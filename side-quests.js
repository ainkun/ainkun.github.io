/* The shrine grounds: one screen. The painting, with particles for the time of day, the title, and the ema rack painted
   beside the torii. Clicking the rack walks up to it (the quest board, the rack up close); choosing an ema turns it over
   into its library (a manga bookcase, an omikuji rack of reviews, a goshuin book of trips), all in place. The way-back
   chip, Esc and Back step out one level at a time. The data rules live in quest-data.js. */
(() => {
  'use strict';
  const data = window.QuestData;
  const root = document.documentElement;
  const body = document.body;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const make = (tag, className, text, lang) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    if (lang) node.lang = lang;
    return node;
  };
  const between = (min, max) => (min + Math.random() * (max - min)).toFixed(2);
  // The button over the rack in the painting, and the rack up close that it opens.
  const spot = document.querySelector('.rack-spot');
  const rack = document.querySelector('.rack');

  // Falling leaves by day, red dragonflies at dusk and fireflies at night; at night a few of them gather at the rack.
  const layer = document.querySelector('.shrine-particles');
  const particles = {
    morning: { kind: 'leaf', count: 9 },
    evening: { kind: 'dragonfly', count: 4 },
    night: { kind: 'firefly', count: 24 }
  };
  const leafColors = ['#8fae55', '#a7bd5c', '#d2b24c', '#7d9b48'];
  function scatter() {
    layer.replaceChildren();
    if (reducedMotion.matches) return;
    const { kind, count } = particles[root.dataset.time];
    const total = Math.ceil(count * (window.innerWidth < 760 ? 0.6 : 1));
    const near = body.dataset.state === 'scene' ? spot.getBoundingClientRect() : null;
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
        if (near && i < 5) {
          style.setProperty('--x', `${(near.left + near.width * Number(between(-0.1, 1.1))).toFixed(1)}px`);
          style.setProperty('--y', `${(near.top + near.height * Number(between(0.05, 0.75))).toFixed(1)}px`);
        } else {
          style.setProperty('--x', `${between(0, 100)}vw`);
          style.setProperty('--y', `${between(38, 96)}vh`);
        }
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
  let resizing = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizing);
    resizing = window.setTimeout(() => { if (root.dataset.time === 'night') scatter(); }, 300);
  });

  // The painting without the rack, which shows behind the rack up close (side-quests.css): loaded a moment after the page
  // is shown, and again for a new time of day, so it is ready before the rack is opened.
  const plate = document.querySelector('.scene-plate');
  function readyPlate() {
    const image = new Image();
    image.addEventListener('load', () => plate.classList.add('is-ready'), { once: true });
    image.src = `assets/${root.dataset.time}-shrine-bare.webp`;
  }
  window.addEventListener('load', () => window.setTimeout(readyPlate, 1200), { once: true });
  document.addEventListener('shrine:time', readyPlate);

  // A short clip of the rack, laid exactly over it, swings its ema (side-quests.css): one for each time of day, swapped
  // when the time changes. Only with motion allowed and without data saving; it sits under the painting without the
  // rack, and plays only in the scene.
  const scene = document.querySelector('.shrine-scene');
  const saving = Boolean(navigator.connection?.saveData);
  let clip = null;
  function sway() {
    const time = root.dataset.time;
    if (clip && (clip.dataset.time !== time || reducedMotion.matches || saving)) {
      clip.remove();
      clip = null;
    }
    if (reducedMotion.matches || saving) return;
    if (!clip) {
      clip = make('video', 'scene-clip');
      clip.dataset.time = time;
      clip.setAttribute('aria-hidden', 'true');
      clip.setAttribute('muted', '');
      clip.setAttribute('playsinline', '');
      Object.assign(clip, { muted: true, loop: true, playsInline: true, preload: 'auto', src: `assets/${time}-rack.mp4` });
      scene.prepend(clip);
    }
    if (body.dataset.state === 'scene' && !document.hidden) clip.play().catch(() => {});
    else clip.pause();
  }
  sway();
  document.addEventListener('shrine:time', sway);
  reducedMotion.addEventListener('change', sway);
  document.addEventListener('visibilitychange', sway);


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
      const rail = make('ul', 'omikuji-rack');
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
        const slipBody = make('span', 'omikuji-body');
        slipBody.append(make('span', 'omikuji-title', review.title), make('span', 'omikuji-meta', [kind.label, score, data.formatDate(review.date)].filter(Boolean).join(' · ')));
        slip.append(make('span', 'omikuji-head', '御神籤', 'ja'), make('span', 'omikuji-fortune', review.fortune ? review.fortune.jp : kind.jp, 'ja'), slipBody);
        rail.append(item(slip));
      });
      // How a rating becomes a fortune.
      const legend = make('p', 'omikuji-legend');
      data.fortunes.forEach(fortune => {
        const entry = make('span', null, ` ${fortune.min ? `${fortune.min}+` : 'below 4'}`);
        entry.prepend(make('span', null, fortune.jp, 'ja'));
        legend.append(entry);
      });
      return [rail, legend];
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

  const grid = rack.querySelector('#ema-grid');
  const gustLayer = spot.querySelector('.rack-gust');
  const hero = document.querySelector('.shrine-hero');
  const homeWay = document.querySelector('[data-way="home"]');
  const stepWay = document.querySelector('[data-way="step"]');
  const library = document.querySelector('#library');
  const heading = library.querySelector('#library-title');
  const libraryJp = library.querySelector('.library-jp');
  const libraryName = library.querySelector('.library-name');
  const libraryCount = library.querySelector('.library-count');
  const libraryBody = library.querySelector('.library-body');
  const quests = new Map();
  const shelves = {};
  const normalizers = { manga: data.normalizeManga, reviews: data.normalizeReviews, travel: data.normalizeTrips };
  let state = 'scene';
  let open = null;

  // The rack: one ema per side quest on hooks 1, 3 and 5 of its rail (shares of the rack's width); a fourth quest would
  // hang lower on hook 4.
  const hooks = [0.229, 0.499, 0.77, 0.635];
  const emaFor = name => grid.querySelector(`button.ema[data-library="${name}"]`);
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
    ema.addEventListener('click', () => enter('library', quest.library));
    return ema;
  }
  function hang() {
    const plaques = [...quests.values()].slice(0, hooks.length).map(questEma);
    grid.replaceChildren(...plaques.map((ema, index) => {
      ema.style.setProperty('--tilt', `${tilts[index % tilts.length] * 0.7}deg`);
      ema.style.setProperty('--sway-delay', `-${(index * 1.3 % 7).toFixed(1)}s`);
      ema.style.setProperty('--gust-delay', `${(index * 0.11).toFixed(2)}s`);
      const slot = make('li', `ema-slot${index === 3 ? ' is-low' : ''}`);
      slot.style.setProperty('--hook', `${hooks[index] * 100}%`);
      slot.append(ema);
      return slot;
    }));
    grid.setAttribute('aria-busy', 'false');
    const titles = [...quests.values()].map(quest => quest.title);
    spot.setAttribute('aria-label', titles.length ? `Quest board: ${titles.join(', ')}` : 'Quest board');
  }
  // Fills the library frame with one catalog.
  function fill(name) {
    const quest = quests.get(name);
    const items = shelves[name];
    library.dataset.library = name;
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
    libraryBody.scrollTop = 0;
    open = name;
  }

  // The three places on this screen: the scene, the quest board (the rack up close) and a library. The way-back chip
  // takes one step out: from a library to the board (絵馬 / QUESTS), from the board to the scene (戻る / BACK).
  const ways = {
    board: { jp: '戻る', en: ' / BACK', label: 'Back to the shrine' },
    library: { jp: '絵馬', en: ' / QUESTS', label: 'Back to the quest board' }
  };
  function settle(next, name = open) {
    state = next;
    body.dataset.state = next;
    if (next !== 'scene') plate.classList.add('is-ready');
    hero.inert = next !== 'scene';
    grid.inert = next !== 'board';
    rack.classList.toggle('is-shown', next === 'board');
    spot.setAttribute('aria-expanded', String(next !== 'scene'));
    library.hidden = next !== 'library';
    homeWay.hidden = next !== 'scene';
    stepWay.hidden = next === 'scene';
    if (next !== 'scene') {
      stepWay.querySelector('.way-jp').textContent = ways[next].jp;
      stepWay.querySelector('.back-en').textContent = ways[next].en;
      stepWay.setAttribute('aria-label', ways[next].label);
    }
    grid.querySelectorAll('button.ema').forEach(ema => ema.setAttribute('aria-expanded', String(next === 'library' && ema.dataset.library === name)));
    sway();
  }
  // The painting comes closer around the painted rack.
  function aimAtRack() {
    const box = spot.getBoundingClientRect();
    body.style.setProperty('--zoom-x', `${(box.left + box.width / 2).toFixed(1)}px`);
    body.style.setProperty('--zoom-y', `${(box.top + box.height / 2).toFixed(1)}px`);
  }

  const glides = () => !reducedMotion.matches && typeof Element.prototype.animate === 'function';
  const centre = box => [box.left + box.width / 2, box.top + box.height / 2];
  const done = animation => animation.finished.catch(() => {});
  // Lays a box (to) over another (from): centred on it and scaled to its height, as the rack up close over the painted one.
  function over(from, to) {
    const [fx, fy] = centre(from);
    const [tx, ty] = centre(to);
    return `translate(${(fx - tx).toFixed(1)}px, ${(fy - ty).toFixed(1)}px) scale(${(from.height / to.height).toFixed(4)})`;
  }
  const still = 'translate(0px, 0px) scale(1)';
  // A card standing at `box` that turns on its vertical axis; `edge` is the angle it shows edge-on.
  function turned(from, to, edge) {
    const [fx, fy] = centre(from);
    const [tx, ty] = centre(to);
    return `translate(${(fx - tx).toFixed(1)}px, ${(fy - ty).toFixed(1)}px) perspective(1400px) rotateY(${edge}deg) scale(${(from.width / to.width).toFixed(4)}, ${(from.height / to.height).toFixed(4)})`;
  }
  const flat = 'translate(0px, 0px) perspective(1400px) rotateY(0deg) scale(1, 1)';

  // Scene → board: walk up to the rack. The painting comes closer, and the rack up close grows out of the painted one.
  let landing = null;
  async function walkUp() {
    const from = spot.getBoundingClientRect();
    aimAtRack();
    landing?.cancel();
    settle('board');
    if (!glides()) return;
    await done(rack.animate([
      { transformOrigin: '50% 50%', transform: over(from, rack.getBoundingClientRect()), opacity: 0 },
      { opacity: 1, offset: 0.45 },
      { transformOrigin: '50% 50%', transform: still, opacity: 1 }
    ], { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }));
  }
  // Board → scene: step back. The rack up close shrinks back into the painted one and fades into it.
  async function stepAway() {
    const from = rack.getBoundingClientRect();
    settle('scene');
    if (!glides()) return;
    rack.classList.add('is-shown');
    landing = rack.animate([
      { transformOrigin: '50% 50%', transform: still, opacity: 1 },
      { opacity: 1, offset: 0.5 },
      { transformOrigin: '50% 50%', transform: over(spot.getBoundingClientRect(), from), opacity: 0 }
    ], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' });
    await done(landing);
    rack.classList.toggle('is-shown', state === 'board');
    landing?.cancel();
    landing = null;
  }
  // Board → library: the ema turns over, and its library unfolds from it while the rest of the rack fades.
  async function turnOver(name) {
    fill(name);
    const ema = emaFor(name);
    if (!glides() || !ema) {
      settle('library', name);
      return;
    }
    const from = ema.getBoundingClientRect();
    const away = ema.animate([{ transform: 'perspective(500px) rotateY(0deg)' }, { transform: 'perspective(500px) rotateY(90deg)' }],
      { duration: 240, easing: 'cubic-bezier(.5,0,1,1)', fill: 'forwards' });
    await done(away);
    settle('library', name);
    rack.classList.add('is-shown');
    const fade = rack.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease', fill: 'forwards' });
    const to = library.getBoundingClientRect();
    await done(library.animate([
      { transformOrigin: '50% 50%', opacity: 0.4, transform: turned(from, to, -90) },
      { transformOrigin: '50% 50%', opacity: 1, transform: flat }
    ], { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' }));
    await done(fade);
    rack.classList.toggle('is-shown', state === 'board');
    fade.cancel();
    away.cancel();
  }
  // Library → board: the library folds back into its ema, the rack returns, and the ema turns face up again.
  async function turnBack() {
    const ema = emaFor(open);
    if (!glides() || !ema) {
      settle('board');
      return;
    }
    const from = library.getBoundingClientRect();
    const to = ema.getBoundingClientRect();
    const fold = library.animate([
      { transformOrigin: '50% 50%', opacity: 1, transform: flat },
      { transformOrigin: '50% 50%', opacity: 0.4, transform: turned(to, from, 90) }
    ], { duration: 440, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    await done(fold);
    settle('board');
    fold.cancel();
    rack.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease' });
    await done(ema.animate([{ transform: 'perspective(500px) rotateY(-90deg)' }, { transform: 'perspective(500px) rotateY(0deg)' }],
      { duration: 300, easing: 'cubic-bezier(0,0,.4,1)' }));
  }
  async function travel(target, name, animate) {
    if (target === 'library' && !quests.has(name)) target = 'board';
    if (target === state && (target !== 'library' || name === open)) return;
    if (!animate) {
      if (state === 'scene' && target !== 'scene') aimAtRack();
      if (target === 'library') fill(name);
      settle(target);
      return;
    }
    if (state === 'library' && (target !== 'library' || name !== open)) await turnBack();
    if (state === 'scene' && target !== 'scene') await walkUp();
    if (state === 'board' && target === 'scene') await stepAway();
    if (state === 'board' && target === 'library') await turnOver(name);
    countView(target, name);
  }
  // Moves run one after another, so quick clicks or Back presses never cross.
  let moving = Promise.resolve();
  const go = (target, name = null, animate = true) => (moving = moving.then(() => travel(target, name, animate)));
  // Keyboard focus follows: to the library's title, to the ema just closed (or the first), or back to the rack.
  function focusOn(target, name) {
    const place = target === 'library' ? heading : target === 'board' ? emaFor(name) || grid.querySelector('button.ema') : spot;
    place?.focus({ preventScroll: true });
  }

  // The address follows: #quests for the board, #manga, #reviews or #travel for a library, so Back steps out and links
  // can open a place directly.
  const hashFor = (target, name) => target === 'library' ? `#${name}` : target === 'board' ? '#quests' : '';
  function fromHash() {
    const key = window.location.hash.slice(1);
    if (quests.has(key)) return ['library', key];
    return [key === 'quests' ? 'board' : 'scene', null];
  }
  // Google Analytics counts a page load or a new address, but not a change after the # alone. So each move to the board,
  // a library or back to the scene is counted here, with its own address and title; the place a visit starts at is
  // counted with the page load.
  let viewed = window.location.href;
  function countView(target, name) {
    const where = target === 'library' ? quests.get(name).title : target === 'board' ? 'Quest Board' : '';
    const address = window.location.origin + window.location.pathname + window.location.search + hashFor(target, name);
    window.gtag?.('event', 'page_view', {
      page_location: address,
      page_referrer: viewed,
      page_title: where ? document.title.replace(' | ', ` · ${where} | `) : document.title
    });
    viewed = address;
  }
  const visit = {
    seen() { try { return sessionStorage.getItem('quest-rack-opened') === 'true'; } catch { return false; } },
    see() { try { sessionStorage.setItem('quest-rack-opened', 'true'); } catch { /* The hints just stay frequent. */ } }
  };
  function enter(target, name = null) {
    visit.see();
    spot.classList.add('is-seen');
    history.pushState({ quest: target }, '', hashFor(target, name));
    go(target, name).then(() => focusOn(target, name));
  }
  function leave() {
    if (state === 'scene') return;
    const from = open;
    const parent = state === 'library' ? 'board' : 'scene';
    // A step this page added goes back through history; otherwise (a link opened the board or a library) it is replaced.
    if (history.state?.quest === state) {
      history.back();
      return;
    }
    history.replaceState(null, '', window.location.pathname + window.location.search + hashFor(parent));
    go(parent).then(() => focusOn(parent, from));
  }
  function sync() {
    const from = open;
    const [target, name] = fromHash();
    go(target, name).then(() => focusOn(target, name || from));
  }
  spot.addEventListener('click', () => enter('board'));
  stepWay.addEventListener('click', leave);
  window.addEventListener('popstate', sync);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (state === 'scene') return;
    event.preventDefault();
    leave();
  });

  // So the rack is noticed: a gust sends a glint across it and blows a few leaves past (warm leaves at dusk, fireflies at
  // night), about 3 seconds after arriving and then every 7 seconds; once it has been opened, only now and then.
  const gusts = { morning: ['gust-leaf', 4], evening: ['gust-leaf', 3], night: ['gust-spark', 5] };
  const duskLeaves = ['#d9822f', '#c4562c', '#e0a44a'];
  function blow() {
    const [kind, count] = gusts[root.dataset.time] || gusts.morning;
    const colours = root.dataset.time === 'evening' ? duskLeaves : leafColors;
    gustLayer.replaceChildren(...Array.from({ length: count }, (_, i) => {
      const bit = make('span', kind);
      const style = bit.style;
      style.setProperty('--delay', `${(i * 0.14).toFixed(2)}s`);
      if (kind === 'gust-leaf') {
        style.setProperty('--from-x', `${between(-28, 10)}%`);
        style.setProperty('--from-y', `${between(8, 58)}%`);
        style.setProperty('--dx', `${between(70, 135)}cqw`);
        style.setProperty('--dy', `${between(-6, 22)}cqw`);
        style.setProperty('--spin', `${between(240, 620)}deg`);
        style.setProperty('--leaf', colours[i % colours.length]);
      } else {
        style.setProperty('--from-x', `${between(5, 95)}%`);
        style.setProperty('--from-y', `${between(40, 85)}%`);
        style.setProperty('--dx', `${between(-14, 14)}cqw`);
        style.setProperty('--dy', `${between(-30, -12)}cqw`);
      }
      return bit;
    }));
    window.setTimeout(() => gustLayer.replaceChildren(), 3000);
  }
  let gustTimer = 0;
  function gust() {
    if (state === 'scene' && !document.hidden && !reducedMotion.matches) {
      spot.classList.remove('is-gust');
      void spot.offsetWidth;
      spot.classList.add('is-gust');
      blow();
      window.setTimeout(() => spot.classList.remove('is-gust'), 2100);
    }
    gustTimer = window.setTimeout(gust, visit.seen() ? 22000 : 7000);
  }
  gustTimer = window.setTimeout(gust, 3000);
  // The quest marker over the rack comes a moment after arriving, and stays until the rack has been opened in this visit.
  if (visit.seen()) spot.classList.add('is-seen');
  window.setTimeout(() => spot.classList.add('is-hinting'), 1200);

  // Opening an entry: where the browser glides between pages, the chosen piece is named to match its place on the next
  // page (shrine.css): a manga cover lands on the series page, an omikuji slip unfolds into the review sheet, and a
  // stamp-book page turns over into the trip. The entry travels with the click so that page draws it at once.
  // Browsers without page transitions zoom and fade here before leaving.
  const pageGlides = 'CSSViewTransitionRule' in window;
  const openings = { manga: 'quest-cover', reviews: 'quest-sheet', travel: 'quest-flip' };
  const pieceOf = link => link.querySelector('.volume-cover') || link;
  libraryBody.addEventListener('click', event => {
    const link = event.target.closest('a.volume, a.omikuji, a.goshuin-page');
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
    const piece = pieceOf(link);
    data.handOff(open, entries.get(link), pageGlides);
    if (pageGlides) {
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
    // The piece lets go of its name when the flight ends, or when the browser skips it (as for a typed address).
    const land = () => {
      piece.style.removeProperty('view-transition-name');
      delete piece.dataset.returning;
    };
    event.viewTransition.finished.then(land, land);
  });

  // The rack and libraries draw at once from this visit's copy of the data, so coming back to the shrine shows them in
  // its first frame (the page holds its first frame for this script). The network copy follows and redraws them only
  // if something changed; an incomplete network copy never replaces what is shown.
  if (fromHash()[0] === 'board') go('board', null, false);
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
      const [target, name] = fromHash();
      if (target === 'library') go(target, name, false);
    } else if (state === 'library' && quests.has(open)) {
      fill(open);
    }
  }
  try {
    const kept = JSON.parse(sessionStorage.getItem('quest-catalogs'));
    if (kept && typeof kept === 'object') draw(kept);
  } catch {
    // No copy yet: the network draws the rack.
  }
  const load = file => data.loadJSON(file).catch(() => null);
  Promise.all(Object.entries(sources).map(([name, file]) => load(file).then(payload => [name, payload]))).then(loaded => {
    const complete = loaded.every(([, payload]) => payload !== null);
    if (!complete && drawn !== null) return;
    const payloads = Object.fromEntries(loaded.map(([name, payload]) => [name, payload || {}]));
    if (complete) {
      try { sessionStorage.setItem('quest-catalogs', JSON.stringify(payloads)); } catch { /* The next visit fetches again. */ }
    }
    draw(payloads);
  });
})();
