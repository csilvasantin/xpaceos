/* ============================================================================
 * canalkiosk-door.js — La puerta exterior del gemelo ES otro CanalKiosk (DooH).
 * ----------------------------------------------------------------------------
 * Sondea la parrilla del CanalKiosk (api.admira.store, la misma que emite el
 * kiosko de la Plaça de la Vila) y la vuelca en window.__campCreatives — el
 * contrato de campañas que drawExteriorAd() ya respeta. Cambias la publi del
 * CanalKiosk (CMS admira.tv) → cambia la puerta del gemelo en ≤30 s.
 * NO pisa campañas reales compradas (solo toca claves marcadas como suyas).
 * (Carlos, 14-jul-2026)
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__CANALKIOSK_DOOR) return; window.__CANALKIOSK_DOOR = true;
  var FEED = 'https://api.admira.store/signage/now?screen=oohmedia';
  var KEYS = ['nino_m','nino_f','joven_m','joven_f','adulto_m','adulto_f','senior_m','senior_f'];
  function apply(item) {
    var W = window; W.__campCreatives = W.__campCreatives || {};
    KEYS.forEach(function (k) {
      var cur = W.__campCreatives[k];
      if (cur && !cur.__ck) return;                       // campaña real comprada: manda ella
      if (item) {
        W.__campCreatives[k] = { __ck: true,
          url: (item.type === 'image' && item.url) ? item.url : '',
          label: String(item.name || item.title || item.id || 'CANALKIOSK').slice(0, 24) };
      } else if (cur && cur.__ck) { delete W.__campCreatives[k]; }
    });
  }
  function tick() {
    try {
      fetch(FEED, { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) { apply((j && j.ok && j.item) ? j.item : null); })
        .catch(function () {});
    } catch (e) {}
  }
  tick(); setInterval(tick, 30000);
})();
