(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.24.09.2026.r4.11:56',
    build: '20260924-1156',
    cacheName: 'xpaceos-photoreal-20260924-r4',
  });
})();
