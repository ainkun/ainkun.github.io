/* Yorimichi Shrine (寄り道神社): every Side Quests page shares one sky. Like the home street, the scene follows the visitor's
   clock (Auto · Local), and the Morning, Evening and Night buttons preview another scene for the rest of the visit.
   ?time=morning|evening|night opens a page on that scene, and ?time=auto returns it to the clock. */
(() => {
  'use strict';
  const times = ['morning', 'evening', 'night'];
  // The same hours as the home street (themes.js), so both places share one sky.
  function timeForDate(date = new Date()) {
    const hour = date.getHours();
    return hour >= 5 && hour < 17 ? 'morning' : hour >= 17 && hour < 20 ? 'evening' : 'night';
  }
  function timeFromSearch(search = '') {
    const time = new URLSearchParams(search).get('time');
    return times.includes(time) ? time : null;
  }
  // A scene chosen in the address or with the buttons lasts for the visit (this tab); otherwise the clock decides.
  function startingTime(search, stored, date = new Date()) {
    const asked = new URLSearchParams(search).get('time');
    if (times.includes(asked)) return { time: asked, automatic: false, keep: asked };
    if (asked !== 'auto' && times.includes(stored)) return { time: stored, automatic: false, keep: stored };
    return { time: timeForDate(date), automatic: true, keep: null };
  }
  // Makes the clock rules testable without a browser.
  if (typeof module !== 'undefined' && module.exports) module.exports = { timeForDate, timeFromSearch, startingTime };
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const scenes = {
    morning: { label: 'Morning', sky: '#c3daf5' },
    evening: { label: 'Evening', sky: '#debcb3' },
    night: { label: 'Night', sky: '#30415f' }
  };
  const painting = time => `assets/${time}-shrine.webp`;
  const visit = {
    get() { try { return sessionStorage.getItem('shrine-time'); } catch { return null; } },
    set(time) {
      try {
        if (time) sessionStorage.setItem('shrine-time', time);
        else sessionStorage.removeItem('shrine-time');
      } catch {
        // Blocked storage only means a chosen scene lasts for one page.
      }
    }
  };
  const start = startingTime(window.location.search, visit.get());
  visit.set(start.keep);
  let current = null;
  let automatic = start.automatic;
  function setTime(time) {
    if (time === current) return;
    current = time;
    root.dataset.time = time;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = scenes[time].sky;
    document.dispatchEvent(new CustomEvent('shrine:time', { detail: time }));
  }
  setTime(start.time);
  // Only the current painting downloads; another loads when it is chosen or the clock reaches it.
  const preload = document.createElement('link');
  preload.rel = 'preload';
  preload.as = 'image';
  preload.href = painting(current);
  document.head.append(preload);

  document.addEventListener('DOMContentLoaded', () => {
    const controls = document.querySelector('.theme-controls');
    const buttons = [...document.querySelectorAll('[data-set-time]')];
    const autoButton = document.querySelector('.theme-auto');
    const clockText = document.querySelector('.theme-clock');
    const status = document.querySelector('#theme-status');
    const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const loaded = new Map();
    let request = 0;
    let pending = null;
    const announce = text => { if (status) status.textContent = text; };

    function load(time) {
      if (!loaded.has(time)) {
        const promise = new Promise((resolve, reject) => {
          const image = new Image();
          image.onload = () => Promise.resolve(image.decode?.()).catch(() => {}).then(resolve);
          image.onerror = reject;
          image.src = painting(time);
        });
        loaded.set(time, promise);
        promise.catch(() => loaded.delete(time));
      }
      return loaded.get(time);
    }
    // The old painting fades out over the new one, like the scene change on the home street.
    function show(time) {
      const scene = document.querySelector('.shrine-scene:not(.is-leaving)');
      if (scene && time !== current && !reducedMotion.matches) {
        const leaving = scene.cloneNode(false);
        leaving.style.backgroundImage = getComputedStyle(scene).backgroundImage;
        leaving.classList.add('is-leaving');
        scene.after(leaving);
        const retire = () => leaving.remove();
        leaving.addEventListener('animationend', retire, { once: true });
        // Hidden tabs and interrupted animations may not send animationend.
        setTimeout(retire, 1900);
      }
      setTime(time);
    }
    function render() {
      if (!controls) return;
      buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.setTime === current)));
      autoButton.textContent = automatic ? 'Auto · Local' : 'Use local time';
      autoButton.setAttribute('aria-pressed', String(automatic));
      autoButton.title = automatic ? 'Following your local time' : 'Return to automatic local time';
      clockText.textContent = `${clock.format(new Date())} Local`;
      controls.dataset.mode = automatic ? 'auto' : 'preview';
      controls.setAttribute('aria-busy', String(pending !== null));
    }
    async function select(time, spoken = true) {
      const version = ++request;
      pending = time;
      render();
      if (spoken) announce(`Loading ${scenes[time].label.toLowerCase()} scene…`);
      try {
        await load(time);
        if (version !== request) return;
        pending = null;
        show(time);
        render();
        if (spoken) announce(`${scenes[time].label} scene. ${automatic ? 'Following your local time.' : 'Preview mode. Choose Use local time to return to automatic.'}`);
      } catch {
        if (version !== request) return;
        pending = null;
        render();
        if (spoken) announce('This scene could not load. Please try again.');
      }
    }
    buttons.forEach(button => button.addEventListener('click', () => {
      automatic = false;
      visit.set(button.dataset.setTime);
      select(button.dataset.setTime);
    }));
    autoButton?.addEventListener('click', () => {
      automatic = true;
      visit.set(null);
      select(timeForDate());
    });
    // Refresh on the minute and when returning to the page; in Auto the scene follows the clock.
    function refresh() {
      render();
      const next = timeForDate();
      if (automatic && next !== (pending || current)) select(next, false);
    }
    setInterval(refresh, 60000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refresh();
    });
    if (controls) controls.hidden = false;
    render();
  });
})();
