(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.15.09.2026.r17.19:48',
    build: '20260915-1948',
    cacheName: 'xpaceos-matrix-furniture-20260915-r17',
  });
})();
