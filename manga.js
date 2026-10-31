/* Manga reader: manga.html?id=<manga> shows the series page, and &ch=<chapter>&p=<page> opens the reader there.
   Manga marked "rtl" read right to left like Japanese manga, so arrow keys, taps, swipes and the progress bar follow the book. */
(() => {
  'use strict';
  // The page after a chapter's last page is its end card, which offers the next chapter.
  function clampSpot(manga, chapter, page) {
    const ch = Math.min(Math.max(Math.trunc(chapter) || 1, 1), manga.chapters.length);
    return { ch, p: Math.min(Math.max(Math.trunc(page) || 1, 1), manga.chapters[ch - 1].pages + 1) };
  }
  function step(manga, spot, delta) {
    const pages = manga.chapters[spot.ch - 1].pages;
    if (delta > 0) {
      if (spot.p <= pages) return { ch: spot.ch, p: spot.p + 1 };
      return spot.ch < manga.chapters.length ? { ch: spot.ch + 1, p: 1 } : spot;
    }
    if (spot.p > 1) return { ch: spot.ch, p: spot.p - 1 };
    return spot.ch > 1 ? { ch: spot.ch - 1, p: manga.chapters[spot.ch - 2].pages } : spot;
  }
  // In a right-to-left book the next page is on the left.
  const sideStep = (side, direction) => (side === 'left') === (direction === 'rtl') ? 1 : -1;
  function keyStep(key, direction) {
    if (key === 'ArrowLeft' || key === 'ArrowRight') return sideStep(key === 'ArrowLeft' ? 'left' : 'right', direction);
    if (key === 'PageDown' || key === ' ') return 1;
    if (key === 'PageUp') return -1;
    return 0;
  }
  // Swiping right pulls the left-hand page into view.
  const swipeStep = (dx, direction) => sideStep(dx > 0 ? 'left' : 'right', direction);
  // Makes the page-turning rules testable without a browser.
  if (typeof module !== 'undefined' && module.exports) module.exports = { clampSpot, step, sideStep, keyStep, swipeStep };
  if (typeof document === 'undefined') return;

  const data = window.QuestData;
  const body = document.body;
  const $ = selector => document.querySelector(selector);
  const make = (tag, className, text, lang) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  };
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* Reading works without saved progress. */ } }
  };
  const series = $('#series'), reader = $('#reader'), stage = $('.reader-stage'), image = $('.reader-img');
  const scrollBox = $('.reader-scroll'), endCard = $('.reader-end'), select = $('.reader-chapter select');
  const count = $('.reader-count'), progress = $('.reader-progress span'), modeButton = $('.reader-mode'), status = $('#reader-status');
  const turns = { left: $('.reader-turn.is-left'), right: $('.reader-turn.is-right') };
  let manga, spot, observer, cameFromSeries = false;
  // Scrolling down the chapter is the default; turning one page at a time is the visitor's choice, and it is remembered.
  let mode = storage.get('manga-reading-mode') === 'pages' ? 'pages' : 'scroll';
  const address = place => `manga.html?id=${manga.id}${place ? `&ch=${place.ch}&p=${place.p}` : ''}`;
  // Each view this page adds to history counts its depth, so the way back to the library can skip past them all.
  const depth = () => window.history.state?.depth || 0;
  const chapterJp = number => `第${number}話`;
  const spotLink = (link, place) => {
    link.href = address(place);
    link.dataset.ch = place.ch;
    link.dataset.p = place.p;
  };

  // The series page: cover, summary and chapters, with "Continue" when this browser has read part of it.
  function showSeries() {
    body.dataset.view = 'series';
    reader.hidden = true;
    series.hidden = false;
    observer?.disconnect();
    document.title = `${manga.title} | ainkun — Security Researcher`;
    // Continue points at the last page read, which changes every time the reader closes.
    let saved = null;
    try { saved = JSON.parse(storage.get(`manga:${manga.id}`)); } catch { /* No saved place. */ }
    const resume = $('.series-continue');
    resume.hidden = !(saved && Number.isInteger(saved.ch) && Number.isInteger(saved.p) && (saved.ch > 1 || saved.p > 1));
    if (!resume.hidden) {
      const place = clampSpot(manga, saved.ch, saved.p);
      resume.replaceChildren(make('span', null, '続きから', 'ja'), ` CONTINUE · CH ${place.ch}, P ${Math.min(place.p, manga.chapters[place.ch - 1].pages)}`);
      spotLink(resume, place);
    }
    if (series.dataset.filled) return;
    series.dataset.filled = 'true';
    Object.assign($('.series-cover'), { src: manga.cover, alt: `Cover of ${manga.title}` });
    $('.series-jp').textContent = manga.jp;
    $('.series-jp').hidden = !manga.jp;
    $('#series-title').textContent = manga.title;
    const status = data.mangaStatus[manga.status];
    const meta = $('.series-meta');
    meta.append(make('span', 'seal', status.jp, 'ja'), make('span', null, status.label),
      make('span', null, `${manga.chapters.length} ${manga.chapters.length === 1 ? 'chapter' : 'chapters'}`),
      make('span', null, manga.direction === 'rtl' ? 'Reads right to left ←' : 'Reads left to right →'));
    $('.series-summary').textContent = manga.summary;
    $('.series-summary').hidden = !manga.summary;
    spotLink($('.series-start'), { ch: 1, p: 1 });
    $('.series-chapters').append(...manga.chapters.map((chapter, index) => {
      const link = make('a');
      spotLink(link, { ch: index + 1, p: 1 });
      link.append(make('span', 'chapter-number', chapterJp(index + 1), 'ja'), make('span', 'chapter-title', chapter.title),
        make('span', 'chapter-pages', `${chapter.pages} ${chapter.pages === 1 ? 'page' : 'pages'}`));
      const li = make('li');
      li.append(link);
      return li;
    }));
  }

  // The reader.
  function showReader(place) {
    body.dataset.view = 'reader';
    series.hidden = true;
    reader.hidden = false;
    reader.dataset.direction = manga.direction;
    if (!select.options.length) {
      select.append(...manga.chapters.map((chapter, index) => {
        const option = make('option', null, `${chapterJp(index + 1)} · ${chapter.title}`);
        option.value = String(index + 1);
        return option;
      }));
      for (const side of ['left', 'right']) {
        const forward = sideStep(side, manga.direction) > 0;
        const button = turns[side];
        const words = [make('span', null, forward ? '次へ' : '前へ', 'ja'), forward ? ' NEXT' : ' BACK'];
        side === 'left' ? button.append('← ', ...words) : button.append(...words, ' →');
        button.setAttribute('aria-label', forward ? 'Next page' : 'Previous page');
        button.dataset.step = forward ? '1' : '-1';
      }
      $('.reader-series').href = address();
      $('.reader-title').textContent = manga.title;
    }
    setMode(mode, place);
  }
  function go(place) {
    const chapterChanged = !spot || place.ch !== spot.ch;
    spot = place;
    if (mode === 'scroll') {
      if (chapterChanged) renderStrip();
      scrollBox.children[spot.p - 1]?.scrollIntoView({ block: 'start' });
    } else {
      renderPage();
    }
    update();
  }
  function renderPage() {
    const chapter = manga.chapters[spot.ch - 1];
    const atEnd = spot.p > chapter.pages;
    image.hidden = atEnd;
    endCard.hidden = !atEnd;
    if (atEnd) return;
    image.classList.add('is-loading');
    image.src = data.pagePath(manga, chapter, spot.p);
    image.alt = `${chapter.title}, page ${spot.p} of ${chapter.pages}`;
    // The neighbouring pages load in the background so turning feels instant.
    for (const near of [step(manga, spot, 1), step(manga, spot, -1)]) {
      if (near.p <= manga.chapters[near.ch - 1].pages) new Image().src = data.pagePath(manga, manga.chapters[near.ch - 1], near.p);
    }
  }
  function renderStrip() {
    observer?.disconnect();
    const chapter = manga.chapters[spot.ch - 1];
    const pages = Array.from({ length: chapter.pages }, (_, index) => {
      const page = make('img', 'reader-strip');
      Object.assign(page, { src: data.pagePath(manga, chapter, index + 1), alt: `${chapter.title}, page ${index + 1} of ${chapter.pages}`,
        loading: index < 2 ? 'eager' : 'lazy', decoding: 'async' });
      page.dataset.page = String(index + 1);
      return page;
    });
    scrollBox.replaceChildren(...pages, endCard);
    endCard.hidden = false;
    // The page crossing the middle of the screen is the current one.
    observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).map(entry => Number(entry.target.dataset.page));
      if (!visible.length) return;
      spot = { ch: spot.ch, p: Math.min(...visible) };
      update();
    }, { rootMargin: '-45% 0px -45% 0px' });
    pages.forEach(page => observer.observe(page));
  }
  function update() {
    const chapter = manga.chapters[spot.ch - 1];
    const next = manga.chapters[spot.ch];
    const atEnd = spot.p > chapter.pages;
    const shown = Math.min(spot.p, chapter.pages);
    select.value = String(spot.ch);
    count.textContent = `${shown} / ${chapter.pages}`;
    progress.style.width = `${(atEnd ? chapter.pages : shown) / chapter.pages * 100}%`;
    turns.left.disabled = step(manga, spot, sideStep('left', manga.direction)) === spot;
    turns.right.disabled = step(manga, spot, sideStep('right', manga.direction)) === spot;
    // つづく (to be continued) ends a chapter; 完 (the end) closes a finished manga.
    const finished = !next && manga.status === 'complete';
    $('.reader-end-mark').textContent = finished ? '完' : 'つづく';
    $('.reader-end-text').textContent = finished ? 'The end' : 'To be continued';
    const nextLink = $('.reader-next');
    nextLink.hidden = !next;
    if (next) {
      nextLink.replaceChildren(make('span', null, '次の話', 'ja'), ` ${next.title.toUpperCase()} `, make('span', null, '→'));
      spotLink(nextLink, { ch: spot.ch + 1, p: 1 });
    }
    document.title = `${manga.title} · ${chapter.title} | ainkun — Security Researcher`;
    history.replaceState(history.state, '', address(spot));
    storage.set(`manga:${manga.id}`, JSON.stringify(spot));
    status.textContent = atEnd ? `End of ${chapter.title}. ${finished ? 'The end.' : 'To be continued.'}` : `Page ${shown} of ${chapter.pages}`;
  }
  function turn(delta) {
    const next = step(manga, spot, delta);
    if (next !== spot) go(next);
  }
  function setMode(next, place = spot) {
    mode = next;
    storage.set('manga-reading-mode', mode);
    reader.dataset.mode = mode;
    modeButton.setAttribute('aria-pressed', String(mode === 'scroll'));
    modeButton.replaceChildren(make('span', null, mode === 'scroll' ? 'ページ' : '縦読み', 'ja'), mode === 'scroll' ? ' PAGES' : ' SCROLL');
    modeButton.title = mode === 'scroll' ? 'Turn one page at a time' : 'Scroll down through the chapter';
    stage.hidden = mode === 'scroll';
    scrollBox.hidden = mode !== 'scroll';
    if (mode === 'pages') {
      observer?.disconnect();
      stage.append(endCard);
      spot = place;
      renderPage();
      update();
    } else {
      spot = null;
      go(place);
    }
  }
  function leave() {
    if (cameFromSeries) {
      history.back();
    } else {
      history.pushState({ depth: depth() + 1 }, '', address());
      showSeries();
    }
  }

  modeButton.addEventListener('click', () => setMode(mode === 'pages' ? 'scroll' : 'pages'));
  select.addEventListener('change', () => go(clampSpot(manga, Number(select.value), 1)));
  for (const button of Object.values(turns)) button.addEventListener('click', () => turn(Number(button.dataset.step)));
  // Taps on either half of the page turn it; swipes do too, so a swipe never counts as a tap.
  let touch = null, swipedAt = 0;
  for (const side of ['left', 'right']) {
    $(`.reader-zone.is-${side}`).addEventListener('click', () => {
      if (Date.now() - swipedAt > 400) turn(sideStep(side, manga.direction));
    });
  }
  stage.addEventListener('pointerdown', event => {
    touch = event.pointerType === 'mouse' ? null : { x: event.clientX, y: event.clientY };
  });
  stage.addEventListener('pointerup', event => {
    if (!touch) return;
    const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swipedAt = Date.now();
      turn(swipeStep(dx, manga.direction));
    }
  });
  image.addEventListener('load', () => image.classList.remove('is-loading'));
  image.addEventListener('error', () => {
    image.classList.remove('is-loading');
    status.textContent = 'This page could not load.';
  });
  document.addEventListener('keydown', event => {
    if (body.dataset.view !== 'reader' || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('select')) return;
    // Space on a focused button or link presses it instead of turning the page.
    if (event.key === ' ' && event.target.closest('button, a')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      leave();
      return;
    }
    const delta = mode === 'pages' ? keyStep(event.key, manga.direction) : 0;
    if (!delta) return;
    event.preventDefault();
    turn(delta);
  });
  // Links to a chapter or page open the reader in place; the series link closes it.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-ch], .reader-series');
    if (!link || !manga || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (link.classList.contains('reader-series')) return leave();
    cameFromSeries = body.dataset.view === 'series' || cameFromSeries;
    if (body.dataset.view === 'series') history.pushState({ depth: depth() + 1 }, '', link.href);
    const place = clampSpot(manga, Number(link.dataset.ch), Number(link.dataset.p));
    body.dataset.view === 'reader' ? go(place) : showReader(place);
  });
  window.addEventListener('popstate', route);
  function route() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('ch')) {
      showReader(clampSpot(manga, Number(params.get('ch')), Number(params.get('p'))));
    } else {
      cameFromSeries = false;
      showSeries();
    }
  }

  const id = data.slug(new URLSearchParams(window.location.search).get('id'));
  function start(entry) {
    manga = entry;
    if (!manga) {
      body.dataset.view = 'missing';
      $('.manga-missing').hidden = false;
      return;
    }
    // The cover and the pages waiting to load take the manga's page shape.
    body.style.setProperty('--shape', manga.shape);
    data.noteReturn('manga', manga.id);
    route();
  }
  // Opened from the bookcase, the manga arrives with the click, so the series card (and the cover's landing place)
  // is drawn in the first frame. Otherwise the data is fetched.
  const handoff = data.takeHandoff('manga', id);
  const handed = handoff && data.normalizeManga({ manga: [handoff.entry] })[0];
  if (handed) {
    if (handoff.glide) data.arrive();
    start(handed);
  } else {
    data.loadJSON('data/manga.json').then(data.normalizeManga, () => []).then(list => start(list.find(entry => entry.id === id)));
  }
})();
