/* ============================================================================
 * canalkiosk-door.js v3 — La puerta exterior del gemelo ES otro CanalKiosk (DooH).
 * ----------------------------------------------------------------------------
 * Se programa con la PARRILLA del CanalKiosk (grid/day, screen sim-gracia-kiosko,
 * la misma que editas en admira.tv/parrilla). Cruza cada slot con el Stock para
 * obtener su THUMBNAIL (visual real, CORS ok) y lo vuelca en window.__campCreatives
 * (contrato que drawExteriorAd ya respeta): la puerta emite la pieza actual con
 * imagen + título, rotando cada 30 s. Cambias la publi → cambia la puerta ≤60 s.
 * NO pisa campañas reales compradas (claves marcadas __ck). (Carlos, 16-jul-2026)
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__CANALKIOSK_DOOR) return; window.__CANALKIOSK_DOOR = '3';
  var GRID  = 'https://api.admira.store/grid/day?screen=sim-gracia-kiosko';
  var STOCK = 'https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/index.json';
  var KEYS = ['nino_m','nino_f','joven_m','joven_f','adulto_m','adulto_f','senior_m','senior_f'];
  var items = [], thumbs = {};
  function apply(item) {
    var W = window; W.__campCreatives = W.__campCreatives || {};
    KEYS.forEach(function (k) {
      var cur = W.__campCreatives[k];
      if (cur && !cur.__ck) return;                       // campaña real comprada: manda ella
      if (item) {
        W.__campCreatives[k] = { __ck: true, url: item.img || '', label: String(item.title || 'CANALKIOSK').slice(0, 24) };
      } else if (cur && cur.__ck) { delete W.__campCreatives[k]; }
    });
  }
  function rotate() { apply(items.length ? items[Math.floor(Date.now() / 30000) % items.length] : null); }
  function load() {
    try {
      var pStock = fetch(STOCK, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (j) {
        (j.items || []).forEach(function (it) { if (it && it.id && it.thumbnail) thumbs[it.id] = it.thumbnail; });
      }).catch(function () {});
      var pGrid = fetch(GRID, { cache: 'no-store' }).then(function (r) { return r.json(); });
      Promise.all([pStock, pGrid]).then(function (rs) {
        var gd = rs[1] || {};
        var band = (gd.bands || []).find(function (b) { return b.isNow; }) || (gd.bands || [])[0];
        var seen = {};
        items = ((band && band.slots) || []).filter(function (s) {
          if (!((s.kind === 'own' || s.kind === 'paid') && s.creative && s.creative.url)) return false;
          if (s.bookingId) { if (seen[s.bookingId]) return false; seen[s.bookingId] = 1; }
          return true;
        }).map(function (s) {
          var img = '';
          if (s.creative.type === 'image') img = s.creative.url.replace(/^https:\/\/www\.admira\.tv\//, 'https://admira.tv/');
          else if (s.stockId && thumbs[s.stockId]) img = thumbs[s.stockId];
          return { img: img, title: s.title || (s.creative && s.creative.name) || 'Parrilla' };
        });
        rotate();
      }).catch(function () {});
    } catch (e) {}
  }
  load(); setInterval(load, 60000); setInterval(rotate, 30000);
})();
