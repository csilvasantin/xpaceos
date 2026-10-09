# Calibrador de pantallas virtuales (4 esquinas) · Virtual screen calibrator

**Estado:** prototipo autónomo en rama `calibrador/pantallas-4-esquinas`. No toca el player en producción.
**Página:** `admira-xp/calibrador-pantallas.html` · recursos en `admira-xp/assets/calibrador/`.

## Por qué
Las pantallas virtuales sobre fotos reales se colocaban como rectángulos rotados (centro, ancho, alto, ángulo).
Una TV fotografiada desde abajo es un trapecio en perspectiva y el gran angular curva sus bordes: el contenido
se sale del marco por un lado y se queda corto por el otro. El calibrador define cada pantalla por sus **4 esquinas
reales** y deforma el contenido con una **homografía** (CSS `matrix3d`), igual que ya hace
`scripts/matrix-panorama.mjs` (`quadTransform`) en la panorámica 360 de Starbucks, pero sobre una foto plana y con
herramientas de precisión.

## Qué hace
- Foto de referencia de fondo, encajada en la vista. Placa limpia (`free-shift-pared.jpg`) sin los overlays
  horneados del método anterior; la captura original queda en `free-shift-pared-original.jpg`.
- Tiradores de esquina arrastrables con **lupa ×4**; arrastrar dentro de una pantalla la mueve entera.
- Flechas: 1 px · Alt+flechas: 0,25 px · Mayús+flechas: 10 px · Tab / Mayús+Tab: esquina y pantalla · 1-3: pantalla.
- **/calibrar** (tecla C): rejilla con borde rojo, diagonales y círculo central en cada pantalla.
- **/demo** (tecla D): entra con zoom a la pantalla más grande y una cortina animada que la barre (antes =
  rectángulo rotado con contorno ámbar y el marco real en verde discontinuo | después = 4 esquinas). Botones
  «Vista completa» / «Zoom a la pantalla N» y «Repetir barrido»; divisor arrastrable; opción de usar la captura
  original como «antes». `?sinanim` salta la animación y `?zoom=0` abre la vista completa.
- Look: acento verde AdmiraNeXT `#33FF99` con texto oscuro `#04130b` (contraste 14,4:1); el cian `#68dce9`
  queda reservado a la barra Experto (línea de comandos).
- **Lente k1** (barril/cojín) aplicada al fondo en WebGL; las esquinas se reproyectan para seguir en el mismo punto
  de la foto.
- **Ajustar al marco** (tecla A): OpenCV.js (CDN) → Canny + contornos + `approxPolyDP` cerca de las esquinas
  actuales; solo encaja si el cuadrilátero es convexo, de área parecida y ninguna esquina se mueve > 8 % de la diagonal.
- Guardar en `localStorage` (`admira.calibrador.v1:<xpacio>`), exportar/importar `.json`, copiar JSON, deshacer (Ctrl+Z).
- Marca blanca: `?marca=<id>` o `/marca <id>` (catálogo `admiranext.com/marcablanca`), `/marca off`.
  Idioma: `?idioma=en` o `/idioma en|es`.
- Parámetros de demo: `?modo=calibrar|demo`, `?split=0..1`, `?contenido=rej`, `?original`, `?fabrica`.

## Contrato JSON
```json
{
  "xpacio": "free-shift-demo",
  "imagen": { "ancho": 3226, "alto": 1168 },
  "k1": 0,
  "pantallas": [
    { "id": "tv-derecha", "nombre": "TV derecha", "k1": 0,
      "esquinas": [[0.642405, 0.330223], [0.884222, 0.147603], [0.948543, 0.444349], [0.669653, 0.607534]] }
  ]
}
```
- `esquinas`: sup-izq, sup-der, inf-der, inf-izq, normalizadas 0..1 sobre la foto **tal como se ve con `k1`**
  (con `k1 = 0`, la foto original).
- Si `k1 ≠ 0` se añade `esquinasFoto`: las mismas esquinas en la foto sin corregir.

## Integración en el player (siguiente paso)
1. Guardar el JSON en los datos del gemelo (p. ej. `xpacio.pantallas[].esquinas`), junto a la foto.
2. En el render: `homografia(esquinas × tamaño foto, anchoContenido, altoContenido)` → `matrix3d` sobre el nodo de
   vídeo/imagen (`transform-origin: 0 0`). Reutilizar `quadTransform` de `matrix-mapping.mjs` o la función
   `homografia` del calibrador.
3. Migración: rectángulo rotado → 4 esquinas con la misma función `rectRotado` invertida (centro ± semiejes rotados).
4. Enlazar el calibrador desde Experto (`/calibrar`) con la foto y las pantallas del Xpacio activo.
5. Actualizar help, tutorial, CLI y MCP (AGENTS.md) cuando entre en el player.

---

**EN summary:** standalone 4-corner calibrator. Each virtual screen is defined by its 4 real corners and the content
is warped with a true homography (CSS `matrix3d`). Drag handles with a ×4 loupe, 1 px / 0.25 px nudging, Tab cycling,
`/calibrar` grid with red border, `/demo` before/after split, optional barrel lens k1 (WebGL), OpenCV.js snap to
bezel, localStorage + JSON import/export, `/marca` white label and `/idioma`. JSON contract above; integration steps
listed in Spanish.

## Integración en el player (9-oct-2026 · v.09.10.2026.r2.22:30)

**Modelo de datos del gemelo** — `xpacios/sneakerstore/pantallas.json` (Xpacio `sneakers-store-santa-rosa-19`):

```json
{ "version": 1, "xpacio": "sneakers-store-santa-rosa-19",
  "foto": { "url": "/admira-xp/assets/calibrador/free-shift-pared.jpg", "ancho": 3226, "alto": 1168 },
  "contenido": { "playlist": "https://mcp.admira.store/playlists/playlist-be8a…", "respaldo": { "url": "…/free-shift-anuncio.jpg", "tipo": "imagen" } },
  "k1": 0,
  "pantallas": [ { "id": "tv-derecha", "nombre": "TV derecha", "esquinas": [[x,y],[x,y],[x,y],[x,y]], "k1": 0 } ] }
```

- `esquinas`: SI·SD·ID·II normalizadas 0..1 sobre la foto (con `k1` = 0, la original).
- `esquinasFoto`: las mismas esquinas en la foto sin corregir, solo si `k1` ≠ 0 (el player pinta la foto original).
- **Compatibilidad**: una pantalla antigua con `rect: {x, y, w, h, rot}` (x, y = esquina superior izquierda sin rotar; rot en grados alrededor del centro; 0..1 o píxeles) sigue pintándose: `normalizarGemelo` la convierte a 4 esquinas al vuelo (`origen: 'rect'`).
- El registro de gemelos con foto calibrable está en `XPACIOS_FOTO` (`admira-xp/scripts/pantallas-esquinas.mjs`).

**Una sola implementación** — `admira-xp/scripts/pantallas-esquinas.mjs` envuelve `quadTransform` de `matrix-mapping.mjs` (la homografía de la panorámica 360 de Starbucks). La usan el calibrador (`<script type="module">`) y el player; el calibrador ya no tiene homografía propia. Pruebas: `node --test admira-xp/scripts/pantallas-esquinas.test.mjs`.

**Player «Foto real»** — `admira-xp/scripts/xpacio-foto-player.mjs`, montado en SneakerStore (botón *Foto real*, Opciones → *Foto real*, `?vista=foto`). Cada pantalla es un nodo de 1600×900 con `transform-origin: 0 0` y `matrix3d` desde sus 4 esquinas; reproduce la playlist del Xpacio (si no carga, el anuncio de respaldo). Si el calibrador guarda en otra pestaña, el player recoloca al momento (evento `storage`).

**/calibrar · /calibrate** — en Experto de Admira XP y en el CLI del shell común (`assets/xpace-shell.js`): abre el calibrador del Xpacio activo (`window.XpaceFotoReal.xpacio`; si la página no tiene foto, Sneakers Store). `/calibrar` lo abre en español y `/calibrate` en inglés. Por Telegram, MCP o `/twin/cmd` devuelve el enlace.

**Persistencia** — no existe backend de esquinas para gemelos con foto (el único estado vivo con backend es Matrix Starbucks en mcp.admira.store, que usa yaw/pitch y su propio recalibrado). Por eso: *Guardar* → `localStorage['admira.calibrador.v1:<xpacio>']`, que el player del mismo navegador lee y superpone; *Exportar .json* → fichero con el mismo esquema para publicar la calibración para todos en `xpacios/<id>/pantallas.json` (PR). La clave del prototipo `free-shift-demo` se migra sola. Pendiente: endpoint compartido en xpaceos-mcp.

**/demo pantallas · /demo screens** — abre la Foto real en antes | después: zoom a la TV grande y barrido de la cortina; a la izquierda el rectángulo rotado (borde ámbar) con el marco real en discontinua verde, a la derecha las 4 esquinas. URL directa: `/xpacios/sneakerstore/?vista=foto&modo=demo`.
