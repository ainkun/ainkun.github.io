/* Side Quests data: the ema on the board and the libraries they open (manga, reviews, travel). Everything read from
   data/*.json passes through here, so pages only see clean text, simple ids and safe links. */
(() => {
  'use strict';
  const clean = value => typeof value === 'string' ? value.trim() : '';
  // Ids name files (assets/manga/<id>/…, data/reviews/<id>.md), so they stay lowercase words joined by hyphens.
  const slug = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean(value)) ? clean(value) : '';
  // Links and images may point to this site or an http(s) address, never a script or data URL.
  function safeLink(value) {
    const link = clean(value);
    try {
      return link && ['http:', 'https:'].includes(new URL(link, 'https://ainkun.com/').protocol) ? link : '';
    } catch {
      return '';
    }
  }
  const list = (payload, key) => Array.isArray(payload?.[key]) ? payload[key] : [];

  const libraries = {
    manga: { file: 'data/manga.json', unit: ['volume', 'volumes'] },
    reviews: { file: 'data/reviews.json', unit: ['review', 'reviews'] },
    travel: { file: 'data/travel.json', unit: ['trip', 'trips'] }
  };
  const countLabel = (library, count) => `${count} ${libraries[library].unit[count === 1 ? 0 : 1]}`;
  // One ema per library, in the order written.
  function normalizeQuests(payload) {
    const seen = new Set();
    return list(payload, 'quests')
      .filter(quest => clean(quest?.title) && Object.hasOwn(libraries, quest.library) && !seen.has(quest.library) && seen.add(quest.library))
      .map(quest => ({ library: quest.library, title: clean(quest.title), jp: clean(quest.jp) }));
  }

  const mangaStatus = { ongoing: { jp: '連載中', label: 'Ongoing' }, complete: { jp: '完結', label: 'Complete' } };
  // The shape of the pages and cover, width:height ("3:4"), written as CSS reads it ("3 / 4"). Pages are 2:3 unless told.
  function pageShape(value) {
    const match = /^(\d+(?:\.\d+)?)\s*[:/]\s*(\d+(?:\.\d+)?)$/.exec(clean(value));
    const ratio = match ? match[1] / match[2] : 0;
    return ratio >= 0.3 && ratio <= 2 ? `${Number(match[1])} / ${Number(match[2])}` : '2 / 3';
  }
  function normalizeManga(payload) {
    return list(payload, 'manga').map(manga => {
      const id = slug(manga?.id);
      // A chapter keeps its number even if one before it is skipped, because the number names its folder.
      const chapters = (Array.isArray(manga?.chapters) ? manga.chapters : [])
        .map((chapter, index) => ({ number: index + 1, title: clean(chapter?.title) || `Chapter ${index + 1}`,
          pages: Number.isInteger(chapter?.pages) && chapter.pages > 0 && chapter.pages < 1000 ? chapter.pages : 0 }))
        .filter(chapter => chapter.pages);
      if (!id || !clean(manga.title) || !chapters.length) return null;
      return { id, title: clean(manga.title), jp: clean(manga.jp), summary: clean(manga.summary),
        status: Object.hasOwn(mangaStatus, manga.status) ? manga.status : 'ongoing', direction: manga.direction === 'ltr' ? 'ltr' : 'rtl',
        shape: pageShape(manga.shape), cover: safeLink(manga.cover) || `assets/manga/${id}/cover.webp`, chapters };
    }).filter(Boolean);
  }
  const pagePath = (manga, chapter, page) => `assets/manga/${manga.id}/${chapter.number}/${String(page).padStart(2, '0')}.webp`;

  // Each review is an omikuji: its fortune comes from the rating out of 10.
  const fortunes = [
    { min: 9, jp: '大吉', label: 'Must see' }, { min: 8, jp: '中吉', label: 'Great' }, { min: 7, jp: '小吉', label: 'Good' },
    { min: 6, jp: '吉', label: 'Decent' }, { min: 4, jp: '末吉', label: 'Mixed' }, { min: 0, jp: '凶', label: 'Skip' }
  ];
  const fortuneFor = rating => typeof rating === 'number' ? fortunes.find(fortune => rating >= fortune.min) : null;
  const kinds = { anime: { jp: 'アニメ', label: 'Anime' }, manga: { jp: '漫画', label: 'Manga' } };
  function normalizeReviews(payload) {
    return list(payload, 'reviews').map(review => {
      const id = slug(review?.id);
      if (!id || !clean(review.title)) return null;
      const rating = typeof review.rating === 'number' && review.rating >= 0 && review.rating <= 10 ? Math.round(review.rating * 2) / 2 : null;
      // Screenshots are pictures under the review: each is a path, or { "src": path, "caption": text }.
      const screenshots = (Array.isArray(review.screenshots) ? review.screenshots : []).map(shot => {
        const src = safeLink(typeof shot === 'string' ? shot : shot?.src);
        return src ? { src, caption: typeof shot === 'string' ? '' : clean(shot.caption) } : null;
      }).filter(Boolean);
      return { id, title: clean(review.title), jp: clean(review.jp), kind: Object.hasOwn(kinds, review.kind) ? review.kind : 'anime',
        rating, fortune: fortuneFor(rating), date: clean(review.date), summary: clean(review.summary),
        cover: safeLink(review.cover) || `assets/reviews/${id}.webp`, screenshots };
    }).filter(Boolean);
  }

  function normalizeTrips(payload) {
    return list(payload, 'trips').map(trip => {
      const id = slug(trip?.id);
      if (!id || !clean(trip.title)) return null;
      return { id, title: clean(trip.title), jp: clean(trip.jp), place: clean(trip.place), date: clean(trip.date), summary: clean(trip.summary),
        stamp: [...clean(trip.stamp) || clean(trip.jp) || '旅'].slice(0, 4).join(''), cover: safeLink(trip.cover) || `assets/travel/${id}/cover.webp` };
    }).filter(Boolean);
  }

  const datePattern = /^(\d{4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // 2026-10-31 → 31 Oct 2026; 2026-10 → Oct 2026. Other text is shown as written.
  function formatDate(value) {
    const match = datePattern.exec(clean(value));
    if (!match) return clean(value);
    return [match[3] && Number(match[3]), match[2] && months[Number(match[2]) - 1], match[1]].filter(Boolean).join(' ');
  }
  const digits = '〇一二三四五六七八九';
  const kanjiNumber = number => number < 10 ? digits[number] : `${number >= 20 ? digits[Math.floor(number / 10)] : ''}十${number % 10 ? digits[number % 10] : ''}`;
  // 2026-10-31 → 二〇二六年十月三十一日, the way the date is brushed in a goshuin book.
  function kanjiDate(value) {
    const match = datePattern.exec(clean(value));
    if (!match) return '';
    const month = Number(match[2]), day = Number(match[3]);
    const monthText = month >= 1 && month <= 12 ? `${kanjiNumber(month)}月` : '';
    const dayText = monthText && day >= 1 && day <= 31 ? `${kanjiNumber(day)}日` : '';
    return `${[...match[1]].map(digit => digits[digit]).join('')}年${monthText}${dayText}`;
  }

  const api = { clean, slug, safeLink, libraries, countLabel, normalizeQuests, mangaStatus, normalizeManga, pagePath,
    fortunes, fortuneFor, kinds, normalizeReviews, normalizeTrips, formatDate, kanjiDate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') {
    api.loadJSON = url => window.fetch(url, { cache: 'no-cache' })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)));
    // Opening an entry hands it to the next page, so that page can draw its card in its very first frame,
    // where the opening animation lands. The next page reads it once; a reload fetches the data as usual.
    api.handOff = (kind, entry, glide) => {
      try { sessionStorage.setItem('quest-handoff', JSON.stringify({ kind, entry, glide })); } catch { /* The page fetches instead. */ }
    };
    api.takeHandoff = (kind, id) => {
      try {
        const handoff = JSON.parse(sessionStorage.getItem('quest-handoff'));
        sessionStorage.removeItem('quest-handoff');
        return handoff?.kind === kind && handoff.entry?.id === id ? handoff : null;
      } catch {
        return null;
      }
    };
    // Arriving through an opening, the opening itself brings the card in, so its own rise-in stays off for the life of the
    // page. (Switching the rise-in back on later would restart it, and the card would blink in a second time.)
    api.arrive = () => document.documentElement.classList.add('quest-arriving');
    // The way back to the library goes back through history when the library opened this page, so the library returns
    // exactly as it was left (from the page cache, without loading again) and the opened piece flies home.
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href^="side-quests.html"]');
      if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      let fromLibrary = false;
      try { fromLibrary = new URL(document.referrer).pathname === new URL(link.href).pathname; } catch { /* Opened directly. */ }
      if (!fromLibrary || window.history.length < 2) return;
      event.preventDefault();
      window.history.go(-1 - (window.history.state?.depth || 0));
    });
    // Esc closes an opened entry the same way as its way-back chip. Layers close one at a time: the reader closes to its
    // series page first (manga.js), and an open screenshot or the creator's send-off closes before the page does.
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (document.body.dataset.view === 'reader' || document.querySelector('dialog[open], .creator-transition')) return;
      const way = [...document.querySelectorAll('main a.shrine-back[href^="side-quests.html"]')].find(link => link.offsetParent !== null);
      if (!way) return;
      event.preventDefault();
      way.click();
    });
    // Leaving an entry page tells the library which piece to fly back to.
    api.noteReturn = (kind, id) => window.addEventListener('pageswap', event => {
      if (!event.viewTransition) return;
      try { sessionStorage.setItem('quest-return', JSON.stringify({ kind, id })); } catch { /* No way back to animate. */ }
    });
    window.QuestData = api;
  }
})();
