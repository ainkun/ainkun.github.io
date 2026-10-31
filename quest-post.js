/* Review and travel posts: review.html?id=… and travel.html?id=… find their entry in data/reviews.json or data/travel.json,
   then read the words from data/<reviews|travel>/<id>.md. Posts use a small, safe part of Markdown and never insert raw HTML. */
(() => {
  'use strict';
  const data = typeof window === 'undefined' ? require('./quest-data.js') : window.QuestData;

  // Inline marks: ![alt](picture), [text](link), `code`, **bold**, *italic* and _italic_. Unsafe links stay plain text.
  // An address may hold one level of parentheses, like a Wikipedia link.
  const url = String.raw`((?:[^()\s]|\([^()\s]*\))+)`;
  const inlinePattern = new RegExp(String.raw`!\[([^\]]*)\]\(${url}\)|\[([^\]]+)\]\(${url}\)|` + '`([^`]+)`' + String.raw`|\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|(?<![\w])_([^_]+)_(?![\w])`, 'g');
  const figurePattern = new RegExp(String.raw`^!\[([^\]]*)\]\(${url}(?:\s+"([^"]*)")?\)$`);
  function parseInline(text) {
    const nodes = [];
    let last = 0;
    for (const match of text.matchAll(inlinePattern)) {
      if (match.index > last) nodes.push(text.slice(last, match.index));
      const [whole, alt, src, label, href, code, strong, em, underscored] = match;
      if (src !== undefined) {
        const safe = data.safeLink(src);
        nodes.push(safe ? { type: 'img', src: safe, alt } : alt || whole);
      } else if (href !== undefined) {
        const safe = data.safeLink(href);
        nodes.push(safe ? { type: 'a', href: safe, children: parseInline(label) } : label);
      } else if (code !== undefined) {
        nodes.push({ type: 'code', text: code });
      } else if (strong !== undefined) {
        nodes.push({ type: 'strong', children: parseInline(strong) });
      } else {
        nodes.push({ type: 'em', children: parseInline(em ?? underscored) });
      }
      last = match.index + whole.length;
    }
    if (last < text.length) nodes.push(text.slice(last));
    return nodes;
  }

  // Blocks: # headings, paragraphs, - or 1. lists, > quotes, --- rules, and a picture on its own line with an optional "caption".
  function parseMarkdown(source) {
    const blocks = [];
    let paragraph = [], quote = [], list = null;
    const flush = () => {
      if (paragraph.length) blocks.push({ type: 'p', children: parseInline(paragraph.join(' ')) });
      if (quote.length) blocks.push({ type: 'quote', children: parseInline(quote.join(' ')) });
      if (list) blocks.push(list);
      paragraph = [];
      quote = [];
      list = null;
    };
    for (const raw of String(source ?? '').replace(/\r\n?/g, '\n').split('\n')) {
      const line = raw.trim();
      let match;
      if (!line) {
        flush();
      } else if ((match = /^(#{1,3})\s+(.+)$/.exec(line))) {
        flush();
        blocks.push({ type: 'h', level: match[1].length + 1, children: parseInline(match[2]) });
      } else if (/^(?:-{3,}|\*{3,})$/.test(line)) {
        flush();
        blocks.push({ type: 'hr' });
      } else if ((match = figurePattern.exec(line))) {
        flush();
        const src = data.safeLink(match[2]);
        if (src) blocks.push({ type: 'figure', src, alt: match[1], caption: match[3] || '' });
      } else if ((match = /^(?:[-*]|(\d+)[.)])\s+(.+)$/.exec(line))) {
        const type = match[1] ? 'ol' : 'ul';
        if (paragraph.length || quote.length || list?.type !== type) flush();
        list ??= { type, items: [] };
        list.items.push(parseInline(match[2]));
      } else if ((match = /^>\s?(.*)$/.exec(line))) {
        if (paragraph.length || list) flush();
        quote.push(match[1]);
      } else {
        if (quote.length || list) flush();
        paragraph.push(line);
      }
    }
    flush();
    return blocks;
  }
  // Makes the Markdown rules testable without a browser.
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseInline, parseMarkdown };
  if (typeof document === 'undefined') return;

  const $ = selector => document.querySelector(selector);
  const make = (tag, className, text, lang) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  };
  const picture = (src, alt) => Object.assign(make('img'), { src, alt, loading: 'lazy', decoding: 'async' });
  function renderInline(nodes) {
    const fragment = document.createDocumentFragment();
    for (const node of nodes) {
      if (typeof node === 'string') fragment.append(node);
      else if (node.type === 'code') fragment.append(make('code', null, node.text));
      else if (node.type === 'img') fragment.append(picture(node.src, node.alt));
      else {
        const element = make(node.type);
        if (node.type === 'a') {
          element.href = node.href;
          if (/^https?:/i.test(node.href)) Object.assign(element, { target: '_blank', rel: 'noopener noreferrer' });
        }
        element.append(renderInline(node.children));
        fragment.append(element);
      }
    }
    return fragment;
  }
  function renderBlocks(blocks) {
    return blocks.map(block => {
      if (block.type === 'hr') return make('hr');
      if (block.type === 'figure') {
        const figure = make('figure');
        figure.append(picture(block.src, block.alt));
        if (block.caption) figure.append(make('figcaption', null, block.caption));
        return figure;
      }
      if (block.type === 'ul' || block.type === 'ol') {
        const list = make(block.type);
        list.append(...block.items.map(entry => {
          const li = make('li');
          li.append(renderInline(entry));
          return li;
        }));
        return list;
      }
      const element = make(block.type === 'h' ? `h${block.level}` : block.type === 'quote' ? 'blockquote' : 'p');
      element.append(renderInline(block.children));
      return element;
    });
  }

  const type = document.body.dataset.post;
  const config = {
    reviews: { file: 'data/reviews.json', normalize: data.normalizeReviews, folder: 'data/reviews' },
    travel: { file: 'data/travel.json', normalize: data.normalizeTrips, folder: 'data/travel' }
  }[type];
  const article = $('.post');
  // Each kind of post shows its own mark: the omikuji fortune for a review, the goshuin seal for a trip.
  function head(entry) {
    document.title = `${entry.title} | ainkun — Security Researcher`;
    $('#post-title').textContent = entry.title;
    $('.post-jp').textContent = entry.jp;
    $('.post-jp').hidden = !entry.jp;
    $('.post-lead').textContent = entry.summary;
    $('.post-lead').hidden = !entry.summary;
    const cover = $('.post-cover');
    cover.addEventListener('error', () => { cover.hidden = true; }, { once: true });
    Object.assign(cover, { src: entry.cover, alt: type === 'travel' ? `${entry.title}, ${entry.place}` : `Cover of ${entry.title}`, hidden: false });
    const kicker = $('.post-kicker');
    const mark = $('.post-mark');
    if (type === 'reviews') {
      const kind = data.kinds[entry.kind];
      kicker.append(make('span', null, kind.jp, 'ja'), ` ${kind.label} review`, entry.date ? ` · ${data.formatDate(entry.date)}` : '');
      if (entry.fortune) {
        mark.append(make('span', 'post-mark-head', '御神籤', 'ja'), make('span', 'post-mark-fortune', entry.fortune.jp, 'ja'),
          make('span', 'post-mark-score', `${entry.rating}/10`), make('span', 'post-mark-label', entry.fortune.label));
        mark.hidden = false;
      }
    } else {
      kicker.append(make('span', null, '旅', 'ja'), ' Travel', entry.place ? ` · ${entry.place}` : '', entry.date ? ` · ${data.formatDate(entry.date)}` : '');
      const seal = make('span', 'seal post-mark-seal', entry.stamp, 'ja');
      seal.setAttribute('aria-hidden', 'true');
      mark.append(seal);
      mark.hidden = false;
    }
  }
  // Screenshots sit right below the review as prints; each opens large, with the arrows (or a swipe) moving through them.
  function gallery(shots) {
    const section = $('.post-shots');
    const viewer = $('.shot-viewer');
    if (!section || !viewer || !shots.length) return;
    const large = $('.shot-large'), text = $('.shot-text'), count = $('.shot-count');
    let shown = 0;
    const prints = shots.map((shot, index) => {
      const print = make('button', 'shot');
      print.type = 'button';
      print.setAttribute('aria-label', `Open screenshot ${index + 1} of ${shots.length}${shot.caption ? `: ${shot.caption}` : ''}`);
      print.append(picture(shot.src, ''));
      print.addEventListener('click', () => {
        show(index);
        viewer.showModal();
      });
      return print;
    });
    $('.shots-grid').replaceChildren(...prints.map((print, index) => {
      const li = make('li');
      li.append(print);
      if (shots[index].caption) li.append(make('p', 'shot-caption', shots[index].caption));
      return li;
    }));
    function show(index) {
      shown = (index + shots.length) % shots.length;
      const shot = shots[shown];
      large.src = shot.src;
      large.alt = shot.caption || `Screenshot ${shown + 1} of ${shots.length}`;
      text.textContent = shot.caption;
      text.hidden = !shot.caption;
      count.textContent = `Screenshot ${shown + 1} / ${shots.length}`;
    }
    const single = shots.length < 2;
    viewer.querySelectorAll('.shot-turn').forEach(button => {
      button.hidden = single;
      button.addEventListener('click', () => show(shown + (button.classList.contains('is-next') ? 1 : -1)));
    });
    viewer.querySelector('.shot-close').addEventListener('click', () => viewer.close());
    viewer.addEventListener('keydown', event => {
      if (single || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      show(shown + (event.key === 'ArrowRight' ? 1 : -1));
    });
    viewer.addEventListener('click', event => {
      if (event.target === viewer) viewer.close();
    });
    let touch = null;
    viewer.addEventListener('pointerdown', event => {
      touch = event.pointerType === 'mouse' ? null : event.clientX;
    });
    viewer.addEventListener('pointerup', event => {
      if (touch === null || single) return;
      const dx = event.clientX - touch;
      touch = null;
      if (Math.abs(dx) > 40) show(shown + (dx < 0 ? 1 : -1));
    });
    // Closing returns focus to the print that was showing last.
    viewer.addEventListener('close', () => prints[shown].focus());
    section.hidden = false;
  }
  function missing() {
    article.replaceChildren(make('p', 'post-missing-mark', '見つかりません', 'ja'), make('p', null, `This ${type === 'travel' ? 'trip' : 'review'} isn't here.`));
    article.classList.add('is-missing');
  }

  const id = data.slug(new URLSearchParams(window.location.search).get('id'));
  function open(entry) {
    if (!entry) return missing();
    data.noteReturn(type, entry.id);
    head(entry);
    gallery(entry.screenshots || []);
    return window.fetch(`${config.folder}/${entry.id}.md`, { cache: 'no-cache' })
      .then(response => response.ok ? response.text() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then(text => $('.post-body').replaceChildren(...renderBlocks(parseMarkdown(text))))
      .catch(() => $('.post-body').replaceChildren(make('p', 'post-error', 'This post could not load. Please try again later.')));
  }
  // Opened from the omikuji rack or the stamp book, the entry arrives with the click, so the sheet's head is drawn in
  // the first frame, where the opening lands. Otherwise the data is fetched; the words always load from Markdown.
  const handoff = data.takeHandoff(type, id);
  const handed = handoff && config.normalize({ [type === 'travel' ? 'trips' : 'reviews']: [handoff.entry] })[0];
  if (handed && handoff.glide) data.arrive();
  (handed ? Promise.resolve(open(handed)) : data.loadJSON(config.file).then(config.normalize, () => []).then(entries => open(entries.find(candidate => candidate.id === id))))
    .finally(() => article.setAttribute('aria-busy', 'false'));
})();
