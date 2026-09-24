(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.24.09.2026.r6.12:52',
    build: '20260924-1252',
    cacheName: 'xpaceos-session-hud-20260924-r6',
  });
})();
