/* Static-host friendly Medium articles and the blog-only welcome host. */
(() => {
  'use strict';
  function mediumURL(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password &&
        (url.hostname === 'medium.com' || url.hostname.endsWith('.medium.com')) ? url.href : '';
    } catch { return ''; }
  }
  function normalizeFeed(payload, limit = 100) {
    if (!payload || !Array.isArray(payload.posts)) throw new Error('Invalid article feed');
    const seen = new Set();
    const posts = payload.posts.flatMap(item => {
      if (!item || typeof item.title !== 'string' || !item.title.trim()) return [];
      const url = mediumURL(item.url);
      if (!url || seen.has(url)) return [];
      seen.add(url);
      const date = new Date(item.publishedAt);
      return [{ title: item.title.slice(0, 220), url,
        excerpt: typeof item.excerpt === 'string' ? item.excerpt.slice(0, 230) : '',
        image: mediumURL(item.image),
        publishedAt: Number.isFinite(date.getTime()) ? date.toISOString() : '',
        tags: Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string').slice(0, 3) : [] }];
    }).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    if (payload.posts.length && !posts.length) throw new Error('No valid Medium articles');
    return { posts: posts.slice(0, Math.max(1, Math.min(100, Number(limit) || 100))), fetchedAt: payload.fetchedAt };
  }
  function createFeedLoader({ fetcher, url, limit, now = Date.now }) {
    let pending, saved, savedAt = 0;
    return function load(force = false) {
      if (pending) return pending;
      if (!force && saved && now() - savedAt < 300000) return Promise.resolve(saved);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      pending = (async () => {
        const response = await fetcher(url, { cache: 'no-cache', signal: controller.signal });
        if (!response.ok) throw new Error('Article feed unavailable');
        const parsed = normalizeFeed(await response.json(), limit);
        saved = parsed; savedAt = now();
        return parsed;
      })().finally(() => { clearTimeout(timer); pending = null; });
      return pending;
    };
  }
  // Curated card labels live beside the feed because the hourly refresh rewrites medium.json.
  function postKey(url) {
    try {
      const slug = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
      const id = slug.match(/-([0-9a-f]{8,16})$/);
      return id ? id[1] : slug;
    } catch { return ''; }
  }
  const humanizeTag = tag => tag.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()).replace(/\bCtf\b/g, 'CTF');
  function applyLabels(posts, payload) {
    const labels = payload && payload.labels && typeof payload.labels === 'object' ? payload.labels : {};
    return posts.map(post => {
      const listed = labels[postKey(post.url)];
      const chosen = Array.isArray(listed)
        ? listed.filter(label => typeof label === 'string' && label.trim()).map(label => label.trim().slice(0, 40)) : [];
      return { ...post, labels: (chosen.length ? chosen : post.tags.map(humanizeTag)).slice(0, 4) };
    });
  }
  // Every word must appear in the title or a label; an optional label narrows further.
  function searchPosts(posts, query = '', label = '') {
    const terms = query.toLowerCase().replace(/#/g, ' ').split(/\s+/).filter(Boolean);
    return posts.filter(post => {
      const labels = post.labels || [];
      if (label && !labels.includes(label)) return false;
      const text = `${post.title} ${labels.join(' ')}`.toLowerCase();
      return terms.every(term => text.includes(term));
    });
  }
  function labelCounts(posts) {
    const counts = new Map();
    posts.forEach(post => (post.labels || []).forEach(label => counts.set(label, (counts.get(label) || 0) + 1)));
    return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }
  function createVisitController({ enter, leave }) {
    let active = false, suppressed = false;
    return {
      get active() { return active; },
      sync(isBlog, explicit = false) {
        if (!isBlog) {
          suppressed = false;
          if (active) { active = false; leave(); }
        } else {
          if (explicit) suppressed = false;
          if (!active && !suppressed) { active = true; enter(); }
        }
      },
      depart() {
        suppressed = true;
        if (active) { active = false; leave(); }
      }
    };
  }
  function shouldDelayNavigation(event, link, currentURL) {
    const url = new URL(link.href, currentURL);
    const current = new URL(currentURL);
    return !event.defaultPrevented && event.button === 0 &&
      !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey &&
      !link.hasAttribute('download') && (!link.target || link.target === '_self') &&
      url.origin === current.origin && url.pathname !== current.pathname;
  }
  function createVoicePlayer(audio, onBlocked) {
    let enabled = true, generation = 0;
    const stop = () => { generation++; audio.pause(); };
    return {
      stop,
      setEnabled(value) { enabled = value; if (!value) stop(); },
      play(url) {
        stop();
        if (!enabled) return;
        const id = generation;
        audio.src = url;
        audio.volume = 0.55;
        try {
          Promise.resolve(audio.play()).then(() => {
            if (id === generation) onBlocked(false);
          }).catch(() => { if (id === generation) onBlocked(true); });
        } catch { if (id === generation) onBlocked(true); }
      }
    };
  }
  function createPortraitSwitcher({ load, render }) {
    let request = 0;
    return async theme => {
      const version = ++request;
      try {
        await load(theme);
        if (version !== request) return false;
        render(theme);
        return true;
      } catch { return false; } // Keep the previous portrait if loading fails.
    };
  }
  // The same helpers are exercised by dependency-free Node tests.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { normalizeFeed, createFeedLoader, postKey, applyLabels, searchPosts, labelCounts, createVisitController, createVoicePlayer, shouldDelayNavigation, createPortraitSwitcher };
  }
  if (typeof document === 'undefined') return;

  const grid = document.querySelector('#writing-grid');
  if (!grid) return;
  const isPreview = grid.dataset.preview === 'true';
  const note = document.querySelector('#blog-feed-note');
  const retry = document.querySelector('#blog-retry');
  const soundButton = document.querySelector('#blog-sound');
  const guide = document.querySelector('#blog-guide');
  const config = window.PORTFOLIO.blog;
  const search = document.querySelector('#blog-search');
  const queryInput = document.querySelector('#blog-query');
  const tagList = document.querySelector('#blog-tags');
  let labelData;
  const loadLabelData = () => labelData || (labelData = window.fetch(config.labels || 'data/blog-labels.json', { cache: 'no-cache' })
    .then(response => response.ok ? response.json() : {}).catch(() => ({})));
  const loadFeed = createFeedLoader({ fetcher: window.fetch.bind(window), url: config.feed, limit: isPreview ? 2 : config.maxPosts });
  const node = (tag, className, text) => {
    const result = document.createElement(tag);
    result.className = className;
    if (text !== undefined) result.textContent = text;
    return result;
  };
  const formatDate = value => new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Karachi'
  }).format(new Date(value));
  let allPosts = [], syncedAt = '', activeLabel = '';
  function renderCards(posts) {
    const cards = posts.map(item => {
      const link = node('a', 'writing-card blog-card');
      link.href = item.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      const art = node('div', 'blog-card-art');
      art.setAttribute('aria-hidden', 'true');
      if (item.image) {
        const image = node('img', '');
        image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
        image.referrerPolicy = 'no-referrer'; image.src = item.image;
        image.addEventListener('error', () => image.remove(), { once: true });
        art.append(image);
      }
      const copy = node('div', 'blog-card-copy');
      const meta = node('div', 'blog-card-meta');
      const date = node('time', '', item.publishedAt ? formatDate(item.publishedAt) : 'FIELD NOTES');
      if (item.publishedAt) date.dateTime = item.publishedAt;
      const labels = node('span', 'blog-card-labels');
      (item.labels.length ? item.labels : ['Security & Research']).forEach(label => labels.append(node('span', 'blog-label', label)));
      meta.append(labels, date);
      copy.append(meta, node('h3', '', item.title), node('p', '', item.excerpt), node('span', 'text-link', 'Read on Medium ↗'));
      link.append(art, copy);
      return link;
    });
    grid.replaceChildren(...cards);
    return cards.length;
  }
  function renderFeed(feed, labels) {
    allPosts = applyLabels(feed.posts, labels);
    syncedAt = feed.fetchedAt;
    if (search && !isPreview) { renderTagList(); applySearch(); return; }
    const count = renderCards(allPosts);
    if (!count) {
      note.textContent = isPreview
        ? 'New stories will appear here when published. Visit the blog for more reading.'
        : 'New stories will appear here when published. Explore the Medium profile above.';
    } else {
      const fetched = new Date(feed.fetchedAt);
      note.textContent = `${count} ${isPreview ? 'latest' : 'recent'} ${count === 1 ? 'story' : 'stories'}` + (Number.isFinite(fetched.getTime()) ? ` · Last synced ${formatDate(feed.fetchedAt)}` : '');
    }
  }
  function renderTagList() {
    const counts = labelCounts(allPosts);
    if (activeLabel && !counts.some(([label]) => label === activeLabel)) activeLabel = '';
    // Shared tags stay visible; one-off tags wait behind a toggle so the list stays short.
    const chips = [['', allPosts.length], ...counts].map(([label, count], index) => {
      const button = node('button', index > 8 || (index && count < 2) ? 'blog-tag is-extra' : 'blog-tag');
      button.type = 'button'; button.dataset.label = label;
      button.append(node('span', '', label || 'All'), node('small', '', String(count)));
      return button;
    });
    const extras = chips.filter(chip => chip.classList.contains('is-extra')).length;
    if (extras) {
      const more = node('button', 'blog-tag blog-tag-more');
      more.type = 'button';
      more.setAttribute('aria-expanded', String(tagList.classList.contains('is-expanded')));
      more.textContent = tagList.classList.contains('is-expanded') ? 'Fewer tags' : `More tags (${extras})`;
      chips.push(more);
    }
    tagList.replaceChildren(...chips);
    search.hidden = !allPosts.length;
  }
  function applySearch() {
    const query = queryInput.value.trim();
    const found = searchPosts(allPosts, query, activeLabel);
    renderCards(found);
    tagList.querySelectorAll('[data-label]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.label === activeLabel)));
    const fetched = new Date(syncedAt);
    const synced = Number.isFinite(fetched.getTime()) ? ` · Last synced ${formatDate(syncedAt)}` : '';
    if (!allPosts.length) note.textContent = 'New stories will appear here when published. Explore the Medium profile above.';
    else if (!query && !activeLabel) note.textContent = `${allPosts.length} recent ${allPosts.length === 1 ? 'story' : 'stories'}${synced}`;
    else {
      const filters = [query && `“${query}”`, activeLabel && `tag ${activeLabel}`].filter(Boolean).join(' in ');
      note.textContent = found.length
        ? `${found.length} of ${allPosts.length} stories match ${filters}`
        : `No stories match ${filters}. Try another word or tag.`;
    }
  }
  if (search && !isPreview) {
    queryInput.addEventListener('input', applySearch);
    tagList.addEventListener('click', event => {
      if (event.target.closest('.blog-tag-more')) {
        tagList.classList.toggle('is-expanded');
        renderTagList(); applySearch();
        tagList.querySelector('.blog-tag-more').focus();
        return;
      }
      const button = event.target.closest('[data-label]');
      if (!button) return;
      activeLabel = button.dataset.label === activeLabel ? '' : button.dataset.label;
      applySearch();
    });
  }
  let loading = false;
  async function loadArticles(force = false) {
    if (loading) return;
    loading = true;
    grid.setAttribute('aria-busy', 'true'); retry.hidden = true;
    if (!grid.children.length) note.textContent = 'Opening the reading shelf…';
    try { const [feed, labels] = await Promise.all([loadFeed(force), loadLabelData()]); renderFeed(feed, labels); }
    catch {
      note.textContent = grid.children.length
        ? 'Showing the articles already loaded. The latest refresh is unavailable.'
        : isPreview ? 'The latest articles could not load. Follow the blog link below for more reading.'
          : 'The reading shelf could not load. You can still read every story on Medium above.';
      retry.hidden = false;
    } finally { loading = false; grid.setAttribute('aria-busy', 'false'); }
  }
  retry.addEventListener('click', () => loadArticles(true));

  // The homepage shares the feed and cards; the welcome host belongs to the full blog.
  if (isPreview) {
    loadArticles();
    return;
  }

  let soundEnabled = true, voiceBlocked = false, leaveTimer;
  try { soundEnabled = sessionStorage.getItem('ainkun-blog-sound') !== 'off'; } catch {}
  function updateSoundButton() {
    soundButton.textContent = voiceBlocked && soundEnabled ? 'Enable voice ♪' : soundEnabled ? 'Voice on ♪' : 'Voice off';
    soundButton.setAttribute('aria-pressed', String(soundEnabled && !voiceBlocked));
    soundButton.setAttribute('aria-label', voiceBlocked && soundEnabled ? 'Enable the blog host voice' : soundEnabled ? 'Mute the blog host voice' : 'Enable the blog host voice');
  }
  const audio = new Audio();
  audio.preload = 'auto';
  const voice = createVoicePlayer(audio, blocked => { voiceBlocked = blocked; updateSoundButton(); });
  voice.setEnabled(soundEnabled); updateSoundButton();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionAllowed = () => !reduced.matches && document.documentElement.dataset.motionPaused !== 'true';
  const say = kind => voice.play(kind === 'hello' ? 'assets/blog/teen-konnichiwa.mp3' : 'assets/blog/teen-arigatou-gozaimasu.mp3');
  const portraits = [...guide.querySelectorAll('[data-host-theme]')];
  const portraitLoads = new Map();
  const selectPortrait = createPortraitSwitcher({
    load(theme) {
      if (!portraitLoads.has(theme)) {
        const image = portraits.find(item => item.dataset.hostTheme === theme);
        const pending = image.decode();
        portraitLoads.set(theme, pending);
        pending.catch(() => portraitLoads.delete(theme));
      }
      return portraitLoads.get(theme);
    },
    render(theme) {
      portraits.forEach(image => image.classList.toggle('is-current', image.dataset.hostTheme === theme));
    }
  });
  const syncPortrait = () => selectPortrait(document.documentElement.dataset.theme || 'morning');
  new MutationObserver(syncPortrait).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });
  const initialPortrait = syncPortrait();
  function bubble(japanese, roman, caption) {
    guide.querySelector('.blog-guide-jp').textContent = japanese;
    guide.querySelector('.blog-guide-roman').textContent = roman;
    guide.querySelector('.blog-guide-caption').textContent = caption;
  }
  const visit = createVisitController({
    enter() {
      clearTimeout(leaveTimer);
      guide.setAttribute('aria-hidden', 'false');
      bubble('こんにちは！', 'Konnichiwa!', 'Welcome to my reading corner.');
      guide.dataset.state = 'present';
      if (!document.hidden) say('hello');
      loadArticles();
    },
    leave() {
      clearTimeout(leaveTimer);
      bubble('ありがとうございます！', 'Arigatou gozaimasu!', 'Thanks for stopping by.');
      guide.dataset.state = motionAllowed() ? 'leaving' : 'hidden';
      if (!document.hidden) say('bye');
      leaveTimer = setTimeout(() => {
        guide.dataset.state = 'hidden'; guide.setAttribute('aria-hidden', 'true');
      }, motionAllowed() ? 1750 : 0);
    }
  });
  soundButton.addEventListener('click', () => {
    soundEnabled = voiceBlocked ? true : !soundEnabled;
    voiceBlocked = false;
    voice.setEnabled(soundEnabled);
    try { sessionStorage.setItem('ainkun-blog-sound', soundEnabled ? 'on' : 'off'); } catch {}
    updateSoundButton();
    if (soundEnabled && visit.active) say('hello');
  });
  let navigationTimer;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button > 0) return;
    const url = new URL(link.href, window.location.href);
    const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname;
    if (samePage) return;
    if (visit.active || navigationTimer) {
      if (shouldDelayNavigation(event, link, window.location.href)) {
        // Let the goodbye finish before following ordinary portfolio links.
        event.preventDefault();
        clearTimeout(navigationTimer);
        navigationTimer = setTimeout(() => window.location.assign(url.href),
          motionAllowed() || soundEnabled ? 1750 : 0);
      }
      visit.depart(); // External/new-tab links and modifier keys retain native behavior.
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (visit.active) voice.stop(); }
    else if (!navigationTimer) visit.sync(true, true);
  });
  window.addEventListener('pagehide', () => {
    voice.stop(); clearTimeout(leaveTimer); clearTimeout(navigationTimer); navigationTimer = null;
  });
  window.addEventListener('pageshow', event => { if (event.persisted) visit.sync(true, true); });

  document.querySelector('#year').textContent = new Date().getFullYear();
  function updateMotion() {
    document.body.classList.toggle('motion-paused', reduced.matches);
    document.documentElement.dataset.motionPaused = String(reduced.matches);
  }
  reduced.addEventListener('change', updateMotion);
  updateMotion();
  // Paint the below-window pose before transitioning into the first greeting.
  initialPortrait.finally(() => requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!document.hidden) visit.sync(true);
  })));
})();
