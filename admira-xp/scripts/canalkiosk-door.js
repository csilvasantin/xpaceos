/* ============================================================================
 * canalkiosk-door.js — La puerta exterior del gemelo ES otro CanalKiosk (DooH).
 * ----------------------------------------------------------------------------
 * Se programa con la PARRILLA del CanalKiosk (grid/day, screen sim-gracia-kiosko
 * — la misma que edita Carlos en admira.tv/parrilla y emite el kiosko de la
 * Plaça de la Vila). Resuelve la banda horaria actual (isNow), rota las piezas
 * own/paid cada 30 s y las vuelca en window.__campCreatives — el contrato que
 * drawExteriorAd() ya respeta. Cambias la publi del CanalKiosk → cambia la
 * puerta del gemelo en ≤60 s. NO pisa campañas reales compradas (solo toca
 * claves marcadas como suyas con __ck). (Carlos, 14-jul-2026)
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__CANALKIOSK_DOOR) return; window.__CANALKIOSK_DOOR = true;
  var GRID = 'https://api.admira.store/grid/day?screen=sim-gracia-kiosko';
  var KEYS = ['nino_m','nino_f','joven_m','joven_f','adulto_m','adulto_f','senior_m','senior_f'];
  var items = [];
  function apply(item) {
    var W = window; W.__campCreatives = W.__campCreatives || {};
    KEYS.forEach(function (k) {
      var cur = W.__campCreatives[k];
      if (cur && !cur.__ck) return;                       // campaña real comprada: manda ella
      if (item) {
        W.__campCreatives[k] = { __ck: true,
          url: (item.type === 'image' && item.url) ? item.url : '',
          label: String(item.title || 'CANALKIOSK').slice(0, 24) };
      } else if (cur && cur.__ck) { delete W.__campCreatives[k]; }
    });
  }
  function rotate() { apply(items.length ? items[Math.floor(Date.now() / 30000) % items.length] : null); }
  function load() {
    try {
      fetch(GRID, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (gd) {
        var band = (gd.bands || []).find(function (b) { return b.isNow; }) || (gd.bands || [])[0];
        var seen = {};
        items = ((band && band.slots) || []).filter(function (s) {
          if (!((s.kind === 'own' || s.kind === 'paid') && s.creative && s.creative.url)) return false;
          if (s.bookingId) { if (seen[s.bookingId]) return false; seen[s.bookingId] = 1; }
          return true;
        }).map(function (s) {
          return {
            // evita el 301 www→apex (sin CORS) al pintar en canvas
            url: s.creative.url.replace(/^https:\/\/www\.admira\.tv\//, 'https://admira.tv/'),
            type: s.creative.type || 'image',
            title: s.title || (s.creative && s.creative.name) || 'Parrilla',
          };
        });
        rotate();
      }).catch(function () {});
    } catch (e) {}
  }
  load(); setInterval(load, 60000); setInterval(rotate, 30000);
})();
