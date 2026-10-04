(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.04.10.2026.r6.13:38',
    build: '20260929-1901',
    cacheName: 'xpaceos-player-blob-20260929-r1',
  });
})();
