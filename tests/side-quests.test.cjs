const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { timeForDate, timeFromSearch, startingTime } = require('../shrine.js');
const { themeForDate } = require('../themes.js');
const data = require('../quest-data.js');
const reader = require('../manga.js');
const { parseInline, parseMarkdown } = require('../quest-post.js');
const root = path.join(__dirname, '..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));

test('the shrine changes scene at the same local hours as the home street', () => {
  for (const localTime of ['2026-10-09T04:59:59', '2026-10-09T05:00:00', '2026-10-09T16:59:59', '2026-10-09T17:00:00',
    '2026-10-09T19:59:59', '2026-10-09T20:00:00', '2026-10-10T00:00:00']) {
    assert.equal(timeForDate(new Date(localTime)), themeForDate(new Date(localTime)), localTime);
  }
});

test('?time= previews a known scene and ignores anything else', () => {
  assert.equal(timeFromSearch('?time=night'), 'night');
  assert.equal(timeFromSearch('?x=1&time=evening'), 'evening');
  for (const search of ['?time=noon', '?time=Night', '?time=auto', '?time=null', '']) assert.equal(timeFromSearch(search), null, search);
});

test('a chosen scene lasts for the visit, and Auto returns to the local clock', () => {
  const noon = new Date('2026-10-09T12:00:00'), late = new Date('2026-10-09T22:00:00');
  assert.deepEqual(startingTime('?time=night', null, noon), { time: 'night', automatic: false, keep: 'night' });
  assert.deepEqual(startingTime('?time=evening', 'night', noon), { time: 'evening', automatic: false, keep: 'evening' });
  assert.deepEqual(startingTime('', 'evening', noon), { time: 'evening', automatic: false, keep: 'evening' });
  assert.deepEqual(startingTime('?time=auto', 'evening', late), { time: 'night', automatic: true, keep: null });
  assert.deepEqual(startingTime('', null, late), { time: 'night', automatic: true, keep: null });
  assert.deepEqual(startingTime('?time=noon', 'bogus', noon), { time: 'morning', automatic: true, keep: null });
});

test('one ema per known library, in the order written', () => {
  const quests = data.normalizeQuests({ quests: [
    { library: 'travel', title: ' Travel Blog ', jp: '旅' }, { library: 'manga', title: 'Manga' }, { library: 'manga', title: 'Twice' },
    { library: 'toString', title: 'Prototype' }, { library: 'games', title: 'Unknown' }, { library: 'reviews', title: '  ' }, null
  ] });
  assert.deepEqual(quests, [{ library: 'travel', title: 'Travel Blog', jp: '旅' }, { library: 'manga', title: 'Manga', jp: '' }]);
  assert.equal(data.countLabel('manga', 1), '1 volume');
  assert.equal(data.countLabel('travel', 0), '0 trips');
  for (const payload of [undefined, null, {}, [], { quests: 'none' }]) assert.deepEqual(data.normalizeQuests(payload), []);
});

test('manga need a simple id, a title and at least one chapter with pages', () => {
  const manga = data.normalizeManga({ manga: [
    { id: 'first-quest', title: 'First Quest', direction: 'ltr', status: 'complete', chapters: [{ pages: 12 }, { pages: 0 }, { title: 'Finale', pages: 8 }] },
    { id: '../secret', title: 'Escape', chapters: [{ pages: 3 }] }, { id: 'no-pages', title: 'Empty', chapters: [{ pages: 2.5 }] },
    { id: 'Upper', title: 'Caps', chapters: [{ pages: 1 }] }, { id: 'plain', title: 'Plain', cover: 'javascript:alert(1)', direction: 'up', status: 'paused', chapters: [{ pages: 1 }] }
  ] });
  assert.deepEqual(manga.map(entry => entry.id), ['first-quest', 'plain']);
  const [first, plain] = manga;
  // The skipped chapter keeps its folder number, so the finale still reads from folder 3.
  assert.deepEqual(first.chapters, [{ number: 1, title: 'Chapter 1', pages: 12 }, { number: 3, title: 'Finale', pages: 8 }]);
  assert.equal(data.pagePath(first, first.chapters[1], 7), 'assets/manga/first-quest/3/07.webp');
  assert.deepEqual([first.direction, first.status, plain.direction, plain.status], ['ltr', 'complete', 'rtl', 'ongoing']);
  assert.equal(plain.cover, 'assets/manga/plain/cover.webp');
});

test('a manga page shape is width:height, read as a CSS ratio, and 2:3 unless it is a sensible one', () => {
  const shapeOf = shape => data.normalizeManga({ manga: [{ id: 'shaped', title: 'Shaped', shape, chapters: [{ pages: 1 }] }] })[0].shape;
  for (const [shape, css] of [['3:4', '3 / 4'], [' 1792 / 2400 ', '1792 / 2400'], ['4:3', '4 / 3'], ['0.7:1', '0.7 / 1'],
    [undefined, '2 / 3'], ['', '2 / 3'], ['wide', '2 / 3'], ['3:0', '2 / 3'], ['0:4', '2 / 3'], ['9:1', '2 / 3'], ['-3:4', '2 / 3'], ['3:4;color:red', '2 / 3'], [34, '2 / 3']]) {
    assert.equal(shapeOf(shape), css, String(shape));
  }
  // A manga handed from the bookcase to its page is read again there, and keeps its shape.
  const [handed] = data.normalizeManga({ manga: [{ id: 'shaped', title: 'Shaped', shape: '3:4', chapters: [{ pages: 1 }] }] });
  assert.equal(data.normalizeManga({ manga: [handed] })[0].shape, '3 / 4');
});

test('a review rating becomes its omikuji fortune', () => {
  for (const [rating, fortune] of [[10, '大吉'], [9, '大吉'], [8.5, '中吉'], [7, '小吉'], [6.5, '吉'], [4, '末吉'], [3.5, '凶'], [0, '凶']]) {
    assert.equal(data.fortuneFor(rating).jp, fortune, String(rating));
  }
  const reviews = data.normalizeReviews({ reviews: [
    { id: 'good', title: 'Good', kind: 'manga', rating: 8.74 }, { id: 'unrated', title: 'Unrated', kind: 'film', rating: 11 }, { id: 'nameless', rating: 5 }
  ] });
  assert.deepEqual(reviews.map(review => [review.id, review.kind, review.rating, review.fortune?.jp ?? null]), [['good', 'manga', 8.5, '中吉'], ['unrated', 'anime', null, null]]);
});

test('review screenshots accept a path or a captioned picture, and drop unsafe ones', () => {
  const [review] = data.normalizeReviews({ reviews: [{ id: 'shots', title: 'Shots', screenshots: [
    'assets/reviews/shots/01.webp', { src: ' https://example.com/2.webp ', caption: ' Episode 2 ' }, { caption: 'No picture' },
    'javascript:alert(1)', { src: 'data:image/png;base64,AA' }, 42, null
  ] }] });
  assert.deepEqual(review.screenshots, [{ src: 'assets/reviews/shots/01.webp', caption: '' }, { src: 'https://example.com/2.webp', caption: 'Episode 2' }]);
  assert.deepEqual(data.normalizeReviews({ reviews: [{ id: 'none', title: 'None', screenshots: 'oops' }] })[0].screenshots, []);
});

test('trips get a short seal and their dates in two calendars of writing', () => {
  const [trip, plain] = data.normalizeTrips({ trips: [
    { id: 'north', title: 'North', jp: '北の旅', stamp: '北国旅記録', date: '2026-10-31' }, { id: 'plain', title: 'Plain' }, { title: 'No id' }
  ] });
  assert.equal(trip.stamp, '北国旅記');
  assert.equal(plain.stamp, '旅');
  assert.equal(plain.cover, 'assets/travel/plain/cover.webp');
  assert.equal(data.kanjiDate('2026-10-31'), '二〇二六年十月三十一日');
  assert.equal(data.kanjiDate('2026-01-20'), '二〇二六年一月二十日');
  assert.equal(data.kanjiDate('2025-12'), '二〇二五年十二月');
  assert.equal(data.kanjiDate('2026-13-01'), '二〇二六年');
  assert.equal(data.kanjiDate('last summer'), '');
  assert.equal(data.formatDate('2026-10-31'), '31 Oct 2026');
  assert.equal(data.formatDate('2026-08'), 'Aug 2026');
  assert.equal(data.formatDate('Summer 2026'), 'Summer 2026');
});

test('the reader turns pages across chapters and stops at both ends', () => {
  const manga = { chapters: [{ pages: 3 }, { pages: 2 }] };
  assert.deepEqual(reader.clampSpot(manga, 9, 9), { ch: 2, p: 3 });
  assert.deepEqual(reader.clampSpot(manga, NaN, -4), { ch: 1, p: 1 });
  assert.deepEqual(reader.step(manga, { ch: 1, p: 3 }, 1), { ch: 1, p: 4 }, 'the end card follows the last page');
  assert.deepEqual(reader.step(manga, { ch: 1, p: 4 }, 1), { ch: 2, p: 1 });
  assert.deepEqual(reader.step(manga, { ch: 2, p: 1 }, -1), { ch: 1, p: 3 });
  const first = { ch: 1, p: 1 }, last = { ch: 2, p: 3 };
  assert.equal(reader.step(manga, first, -1), first);
  assert.equal(reader.step(manga, last, 1), last);
});

test('right-to-left manga turn forward with the left arrow, a left tap and a right swipe', () => {
  assert.equal(reader.keyStep('ArrowLeft', 'rtl'), 1);
  assert.equal(reader.keyStep('ArrowRight', 'rtl'), -1);
  assert.equal(reader.keyStep('ArrowRight', 'ltr'), 1);
  assert.equal(reader.keyStep('PageDown', 'rtl'), 1);
  assert.equal(reader.keyStep(' ', 'ltr'), 1);
  assert.equal(reader.keyStep('PageUp', 'ltr'), -1);
  assert.equal(reader.keyStep('a', 'rtl'), 0);
  assert.equal(reader.sideStep('left', 'rtl'), 1);
  assert.equal(reader.sideStep('left', 'ltr'), -1);
  assert.equal(reader.swipeStep(80, 'rtl'), 1);
  assert.equal(reader.swipeStep(-80, 'ltr'), 1);
});

test('posts read a small, safe part of Markdown', () => {
  const blocks = parseMarkdown(`# Day one\r\nA **bold** and *quiet* start,\nwith \`code\`.\n\n- one\n- two [link](https://example.com)\n1. first\n\n> said someone\n\n---\n![Hill](assets/travel/x/01.webp "At dawn")\n![Bad](javascript:alert(1))`);
  assert.deepEqual(blocks.map(block => block.type), ['h', 'p', 'ul', 'ol', 'quote', 'hr', 'figure']);
  assert.equal(blocks[0].level, 2);
  assert.deepEqual(blocks[1].children, ['A ', { type: 'strong', children: ['bold'] }, ' and ', { type: 'em', children: ['quiet'] }, ' start, with ', { type: 'code', text: 'code' }, '.']);
  assert.deepEqual(blocks[2].items[1][1], { type: 'a', href: 'https://example.com', children: ['link'] });
  assert.deepEqual(blocks[6], { type: 'figure', src: 'assets/travel/x/01.webp', alt: 'Hill', caption: 'At dawn' });
});

test('unsafe links and HTML stay plain text', () => {
  assert.deepEqual(parseInline('[click](javascript:alert(1)) <img src=x onerror=alert(1)>'), ['click', ' <img src=x onerror=alert(1)>']);
  assert.deepEqual(parseInline('![x](data:image/png;base64,AA)'), ['x']);
  assert.deepEqual(parseInline('snake_case_name stays'), ['snake_case_name stays']);
});

test('the bundled side quests are complete: every entry is valid and every file it needs exists', () => {
  const exists = file => fs.existsSync(path.join(root, file));
  assert.equal(data.normalizeQuests(read('data/side-quests.json')).length, read('data/side-quests.json').quests.length);
  const manga = data.normalizeManga(read('data/manga.json'));
  assert.equal(manga.length, read('data/manga.json').manga.length);
  for (const entry of manga) {
    assert.ok(exists(entry.cover), entry.cover);
    for (const chapter of entry.chapters) {
      for (let page = 1; page <= chapter.pages; page++) assert.ok(exists(data.pagePath(entry, chapter, page)), data.pagePath(entry, chapter, page));
    }
  }
  for (const [file, normalize, folder] of [['data/reviews.json', data.normalizeReviews, 'data/reviews'], ['data/travel.json', data.normalizeTrips, 'data/travel']]) {
    const raw = read(file);
    const entries = normalize(raw);
    assert.equal(entries.length, (raw.reviews || raw.trips).length, file);
    for (const entry of entries) {
      assert.ok(exists(entry.cover), entry.cover);
      for (const shot of entry.screenshots || []) assert.ok(exists(shot.src), shot.src);
      const words = fs.readFileSync(path.join(root, folder, `${entry.id}.md`), 'utf8');
      for (const block of parseMarkdown(words).filter(block => block.type === 'figure')) assert.ok(exists(block.src), block.src);
    }
  }
});
