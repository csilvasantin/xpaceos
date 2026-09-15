(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.15.09.2026.r13.17:42',
    build: '20260915-1742',
    cacheName: 'xpaceos-blender-catalog-20260915-r13',
  });
})();
