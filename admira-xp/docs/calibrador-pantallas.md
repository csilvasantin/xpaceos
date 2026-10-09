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
- **/demo** (tecla D): antes (rectángulo rotado) | después (4 esquinas) con divisor arrastrable; opción de usar la
  captura original como «antes».
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
