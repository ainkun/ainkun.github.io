/* The shrine grounds: particles for the time of day, the ema board, and the library each ema opens on the page
   (a manga bookcase, an omikuji rack of reviews, a goshuin book of trips). The data rules live in quest-data.js. */
(() => {
  'use strict';
  const data = window.QuestData;
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const make = (tag, className, text, lang) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  };

  // Falling leaves by day, red dragonflies at dusk and fireflies at night.
  const layer = document.querySelector('.shrine-particles');
  const particles = {
    morning: { kind: 'leaf', count: 9 },
    evening: { kind: 'dragonfly', count: 4 },
    night: { kind: 'firefly', count: 24 }
  };
  const leafColors = ['#8fae55', '#a7bd5c', '#d2b24c', '#7d9b48'];
  const between = (min, max) => (min + Math.random() * (max - min)).toFixed(2);
  function scatter() {
    layer.replaceChildren();
    if (reducedMotion.matches) return;
    const { kind, count } = particles[root.dataset.time];
    const total = Math.ceil(count * (window.innerWidth < 760 ? 0.6 : 1));
    for (let i = 0; i < total; i++) {
      const particle = make('span', `particle ${kind}`);
      const style = particle.style;
      if (kind === 'leaf') {
        style.setProperty('--x', `${between(35, 100)}vw`);
        style.setProperty('--drift', `${between(-220, 40)}px`);
        style.setProperty('--spin', `${between(260, 720)}deg`);
        style.setProperty('--leaf', leafColors[i % leafColors.length]);
        style.setProperty('--duration', `${between(12, 20)}s`);
      } else if (kind === 'dragonfly') {
        const facing = i % 2 ? -1 : 1;
        style.setProperty('--face', facing);
        style.setProperty('--from', facing === 1 ? '0vw' : '100vw');
        style.setProperty('--y', `${between(10, 52)}vh`);
        style.setProperty('--duration', `${between(18, 28)}s`);
      } else {
        style.setProperty('--x', `${between(0, 100)}vw`);
        style.setProperty('--y', `${between(38, 96)}vh`);
        style.setProperty('--dx', `${between(-40, 40)}px`);
        style.setProperty('--dy', `${between(12, 34)}px`);
        style.setProperty('--glow', `${between(2.4, 4.6)}s`);
        style.setProperty('--duration', `${between(7, 13)}s`);
      }
      style.setProperty('--delay', `-${between(0, 20)}s`);
      layer.append(particle);
    }
  }
  scatter();
  document.addEventListener('shrine:time', scatter);
  reducedMotion.addEventListener('change', scatter);

  // Each library draws its own catalog. Every entry links to its page in the same shrine theme.
  const tilts = [-3, 2.5, -1.5, 3, -2.5, 1.5, -1, 2, -3.5, 1];
  // Each drawn cover, slip or stamp-book page remembers its entry, to hand to the page it opens.
  const entries = new WeakMap();
  const item = child => {
    const li = make('li');
    li.append(child);
    return li;
  };
  const catalogs = {
    manga(items) {
      const shelf = make('ul', 'shelf');
      items.forEach((manga, index) => {
        const status = data.mangaStatus[manga.status];
        const chapters = `${manga.chapters.length} ${manga.chapters.length === 1 ? 'chapter' : 'chapters'}`;
        const volume = make('a', 'volume');
        volume.href = `manga.html?id=${manga.id}`;
        volume.style.setProperty('--shape', manga.shape);
        entries.set(volume, manga);
        volume.setAttribute('aria-label', `${manga.title}. ${chapters}, ${status.label.toLowerCase()}`);
        const cover = make('span', 'volume-cover');
        const image = make('img');
        Object.assign(image, { src: manga.cover, alt: '', loading: 'lazy', width: 300, height: 450 });
        // A library spine label: NDC 726.1 (manga), the author mark ア for ainkun, and the volume number.
        const label = make('span', 'call-number');
        label.setAttribute('aria-hidden', 'true');
        label.append('726.1', make('br'), 'ア', make('br'), String(index + 1));
        cover.append(image, label);
        const pop = make('span', 'pop-card');
        const meta = make('span', 'pop-meta', chapters);
        meta.append(make('span', 'seal', status.jp, 'ja'));
        pop.append(make('span', 'pop-title', manga.title), meta);
        volume.append(cover, pop);
        shelf.append(item(volume));
      });
      const bookcase = make('div', 'bookcase');
      bookcase.append(shelf);
      return [bookcase];
    },
    reviews(items) {
      const rack = make('ul', 'omikuji-rack');
      items.forEach((review, index) => {
        const kind = data.kinds[review.kind];
        const slip = make('a', `omikuji${review.fortune?.jp === '凶' ? ' is-kyo' : ''}`);
        slip.href = `review.html?id=${review.id}`;
        entries.set(slip, review);
        slip.style.setProperty('--tilt', `${tilts[index % tilts.length] * 0.6}deg`);
        slip.style.setProperty('--sway-delay', `-${(index * 1.7 % 7).toFixed(1)}s`);
        const score = review.rating === null ? '' : `${review.rating}/10`;
        slip.setAttribute('aria-label', [`${review.title}. ${kind.label} review`, score && `${review.rating} out of 10`,
          review.fortune && `${review.fortune.jp}, ${review.fortune.label.toLowerCase()}`].filter(Boolean).join(', '));
        const body = make('span', 'omikuji-body');
        body.append(make('span', 'omikuji-title', review.title), make('span', 'omikuji-meta', [kind.label, score, data.formatDate(review.date)].filter(Boolean).join(' · ')));
        slip.append(make('span', 'omikuji-head', '御神籤', 'ja'), make('span', 'omikuji-fortune', review.fortune ? review.fortune.jp : kind.jp, 'ja'), body);
        rack.append(item(slip));
      });
      // How a rating becomes a fortune.
      const legend = make('p', 'omikuji-legend');
      data.fortunes.forEach(fortune => {
        const entry = make('span', null, ` ${fortune.min ? `${fortune.min}+` : 'below 4'}`);
        entry.prepend(make('span', null, fortune.jp, 'ja'));
        legend.append(entry);
      });
      return [rack, legend];
    },
    travel(items) {
      const book = make('div', 'goshuin-book');
      const front = make('div', 'goshuin-cover');
      front.setAttribute('aria-hidden', 'true');
      front.append(make('span', 'goshuin-label', '御朱印帳', 'ja'));
      const pages = make('ul', 'goshuin-pages');
      items.forEach(trip => {
        const page = make('a', 'goshuin-page');
        page.href = `travel.html?id=${trip.id}`;
        entries.set(page, trip);
        const when = data.formatDate(trip.date);
        page.setAttribute('aria-label', [trip.title, trip.place, when].filter(Boolean).join(', '));
        const ink = make('span', 'gs-ink');
        ink.setAttribute('aria-hidden', 'true');
        ink.append(make('span', 'gs-hohai', '奉拝', 'ja'), make('span', 'gs-place', trip.jp || trip.place || trip.title, trip.jp ? 'ja' : null), make('span', 'gs-date', data.kanjiDate(trip.date), 'ja'));
        const seal = make('span', 'gs-seal', trip.stamp, 'ja');
        const mark = make('span', 'gs-mark', '旅', 'ja');
        seal.setAttribute('aria-hidden', 'true');
        mark.setAttribute('aria-hidden', 'true');
        const caption = make('span', 'gs-caption');
        caption.setAttribute('aria-hidden', 'true');
        caption.append(make('strong', null, trip.title), make('span', null, [trip.place, when].filter(Boolean).join(' · ')));
        page.append(seal, mark, ink, caption);
        pages.append(item(page));
      });
      const back = make('div', 'goshuin-cover');
      back.setAttribute('aria-hidden', 'true');
      book.append(front, pages, back);
      return [book];
    }
  };

  // The board: one ema per side quest, then blank ema on the empty hooks, four in all.
  const grid = document.querySelector('#ema-grid');
  const library = document.querySelector('#library');
  const heading = library.querySelector('#library-title');
  const libraryJp = library.querySelector('.library-jp');
  const libraryName = library.querySelector('.library-name');
  const libraryCount = library.querySelector('.library-count');
  const libraryBody = library.querySelector('.library-body');
  const quests = new Map();
  const shelves = {};
  const normalizers = { manga: data.normalizeManga, reviews: data.normalizeReviews, travel: data.normalizeTrips };
  let open = null;
  let pushed = false;

  function questEma(quest) {
    const ema = make('button', 'ema');
    ema.type = 'button';
    ema.dataset.library = quest.library;
    ema.setAttribute('aria-controls', 'library');
    ema.setAttribute('aria-expanded', 'false');
    const count = data.countLabel(quest.library, shelves[quest.library].length);
    ema.setAttribute('aria-label', `${quest.title}, ${count}`);
    const board = make('span', 'ema-board');
    if (quest.jp) board.append(make('span', 'ema-jp', quest.jp, 'ja'));
    board.append(make('span', 'ema-title', quest.title), make('span', 'ema-count', count));
    ema.append(board);
    ema.addEventListener('click', () => show(quest.library, true));
    return ema;
  }
  function blankEma() {
    const ema = make('span', 'ema is-blank');
    ema.append(make('span', 'ema-board'));
    return ema;
  }
  function hang() {
    const plaques = [...[...quests.values()].map(questEma), ...Array.from({ length: Math.max(0, 4 - quests.size) }, blankEma)];
    grid.replaceChildren(...plaques.map((ema, index) => {
      ema.style.setProperty('--tilt', `${tilts[index % tilts.length]}deg`);
      ema.style.setProperty('--sway-delay', `-${(index * 1.3 % 7).toFixed(1)}s`);
      const slot = make('li', 'ema-slot');
      if (ema.classList.contains('is-blank')) slot.setAttribute('aria-hidden', 'true');
      slot.append(ema);
      return slot;
    }));
    grid.setAttribute('aria-busy', 'false');
  }

  // Opening a library adds #manga, #reviews or #travel to the address, so Back closes it and links can open it directly.
  function show(name, chosen, scroll = true) {
    const quest = quests.get(name);
    if (!quest) return;
    // Switching between libraries replaces the entry, so one Back (or Close) always returns to the plain board.
    if (chosen && window.location.hash !== `#${name}`) {
      history[pushed ? 'replaceState' : 'pushState'](null, '', `#${name}`);
      pushed = true;
    }
    if (open !== name) {
      const items = shelves[name];
      library.dataset.library = name;
      // Only a chosen library plays its opening; one already open when the page loads or comes back is simply there.
      libraryBody.classList.toggle('is-instant', !chosen);
      libraryJp.textContent = quest.jp;
      libraryJp.hidden = !quest.jp;
      libraryName.textContent = quest.title;
      libraryCount.textContent = data.countLabel(name, items.length);
      if (items.length) {
        libraryBody.replaceChildren(...catalogs[name](items));
      } else {
        const empty = make('p', 'library-empty', 'Coming soon');
        empty.prepend(make('span', null, '準備中', 'ja'));
        libraryBody.replaceChildren(empty);
      }
      open = name;
    }
    library.hidden = false;
    grid.querySelectorAll('button.ema').forEach(ema => ema.setAttribute('aria-expanded', String(ema.dataset.library === name)));
    if (scroll) library.scrollIntoView({ behavior: chosen && !reducedMotion.matches ? 'smooth' : 'auto', block: 'start' });
    if (chosen) heading.focus({ preventScroll: true });
  }
  function close() {
    const ema = grid.querySelector(`button.ema[data-library="${open}"]`);
    library.hidden = true;
    open = null;
    grid.querySelectorAll('button.ema').forEach(button => button.setAttribute('aria-expanded', 'false'));
    return ema;
  }
  library.querySelector('.library-close').addEventListener('click', () => {
    if (pushed) {
      history.back();
    } else {
      history.replaceState(null, '', window.location.pathname + window.location.search);
      close()?.focus();
    }
  });
  function sync() {
    const name = window.location.hash.slice(1);
    if (quests.has(name)) {
      show(name, false);
    } else if (open) {
      pushed = false;
      close()?.focus({ preventScroll: true });
    }
  }
  window.addEventListener('popstate', sync);
  // Esc closes the open library, like its Close button.
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!open || document.querySelector('.creator-transition')) return;
    event.preventDefault();
    library.querySelector('.library-close').click();
  });

  // Opening an entry: where the browser glides between pages, the chosen piece is named to match its place on the next
  // page (shrine.css): a manga cover lands on the series page, an omikuji slip unfolds into the review sheet, and a
  // stamp-book page turns over into the trip. The entry travels with the click so that page draws it at once.
  // Browsers without page transitions zoom and fade here before leaving.
  const glides = 'CSSViewTransitionRule' in window;
  const openings = { manga: 'quest-cover', reviews: 'quest-sheet', travel: 'quest-flip' };
  const pieceOf = link => link.querySelector('.volume-cover') || link;
  libraryBody.addEventListener('click', event => {
    const link = event.target.closest('a.volume, a.omikuji, a.goshuin-page');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
    const piece = pieceOf(link);
    data.handOff(open, entries.get(link), glides);
    if (glides) {
      piece.style.viewTransitionName = openings[open];
      return;
    }
    event.preventDefault();
    piece.classList.add('is-opening');
    root.classList.add('quest-leaving');
    setTimeout(() => window.location.assign(link.href), 380);
  });
  // Coming back shows the library as it was before the opening (the page cache keeps the last state).
  function reset() {
    root.classList.remove('quest-leaving');
    libraryBody.querySelectorAll('.is-opening').forEach(piece => piece.classList.remove('is-opening'));
    libraryBody.querySelectorAll('[style*="view-transition-name"]:not([data-returning])').forEach(piece => piece.style.removeProperty('view-transition-name'));
  }
  window.addEventListener('pageshow', reset);
  // Back from an entry, its piece flies home: the cover to its shelf, the sheet into its slip, the trip back into its page.
  window.addEventListener('pagereveal', event => {
    reset();
    let back = null;
    try {
      back = JSON.parse(sessionStorage.getItem('quest-return'));
      sessionStorage.removeItem('quest-return');
    } catch {
      return;
    }
    const id = data.slug(back?.id);
    const link = event.viewTransition && id && back.kind === open && libraryBody.querySelector(`a[href$="?id=${id}"]`);
    if (!link) return;
    const piece = pieceOf(link);
    piece.dataset.returning = 'true';
    piece.style.viewTransitionName = openings[back.kind];
    event.viewTransition.finished.finally(() => {
      piece.style.removeProperty('view-transition-name');
      delete piece.dataset.returning;
    });
  });

  // The board and libraries draw at once from this visit's copy of the data, so coming back to the shrine shows them in
  // its first frame (the page holds its first frame for this script). The network copy follows and redraws them only
  // if something changed; an incomplete network copy never replaces what is shown.
  const sources = { board: 'data/side-quests.json', ...Object.fromEntries(Object.entries(data.libraries).map(([name, { file }]) => [name, file])) };
  let drawn = null;
  function draw(payloads) {
    const text = JSON.stringify(payloads);
    if (text === drawn) return;
    const first = drawn === null;
    drawn = text;
    Object.keys(data.libraries).forEach(name => { shelves[name] = normalizers[name](payloads[name]); });
    quests.clear();
    data.normalizeQuests(payloads.board).forEach(quest => quests.set(quest.library, quest));
    hang();
    if (first) {
      if (window.location.hash) sync();
    } else if (open) {
      const name = open;
      open = null;
      show(name, false, false);
    }
  }
  try {
    const kept = JSON.parse(sessionStorage.getItem('quest-catalogs'));
    if (kept && typeof kept === 'object') draw(kept);
  } catch {
    // No copy yet: the network draws the board.
  }
  const load = file => data.loadJSON(file).catch(() => null);
  Promise.all(Object.entries(sources).map(([name, file]) => load(file).then(payload => [name, payload]))).then(entries => {
    const complete = entries.every(([, payload]) => payload !== null);
    if (!complete && drawn !== null) return;
    const payloads = Object.fromEntries(entries.map(([name, payload]) => [name, payload || {}]));
    if (complete) {
      try { sessionStorage.setItem('quest-catalogs', JSON.stringify(payloads)); } catch { /* The next visit fetches again. */ }
    }
    draw(payloads);
  });
})();
