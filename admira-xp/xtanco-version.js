(() => {
  const root = typeof self !== 'undefined' ? self : (typeof window !== 'undefined' ? window : globalThis);
  // Version format: v.DD.MM.YYYY.rN.HH:MM (R restarts at 1 each day).
  root.XTANCO_APP = Object.freeze({
    name: 'Admira XP // The Xpace OS',
    version: 'v.14.08.2026.r1.11:02',
    build: '20260814-1102',
    cacheName: 'admiranext-v14-08-2026-r1-1102',
  });
})();
