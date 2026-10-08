# Hiperreal · pipeline por tandas

Hiperreal es el acabado fotorrealista del catálogo: texturas PBR CC0 reales, imperfección (huellas, manchas, variación de posición y giro), cantos biselados y luz de tienda. Se generó a mano en la pieza 47 (piloto) y ahora sale de un pipeline reutilizable que se ejecuta por tandas.

## Estado

| Tanda | Piezas | Publicada |
|---|---|---|
| 0 · piloto | 47 Estantería de tazas y café Starbucks | 08-10-2026 |
| 1 · Starbucks | 44 Barra de preparación, 45 Mostrador de caja, 46 Vitrina, 48 Mesa redonda, 49 Silla, 50 Botellero Solán de Cabras, 52 iPad horizontal | 08-10-2026 |

Las piezas con Hiperreal están en `HIPERREAL_BATCHES` de `inventario/quality-model.mjs`.

## Dónde se ve

- Inventario: `/inventario/?asset=<n>&quality=hiperreal` (o `quality=all` para comparar). Cada pieza enlaza su render antes/después en Cycles y su GLB HD.
- Gemelo, perfil **Best**: `/inventario añadir <n>` y la escena del proyecto Starbucks colocan el GLB Hiperreal; si no existe o falla la descarga, cae a Matrix y después a Best (`cloneTwinFurniture`). Better y Good no cambian.
- En la escena Starbucks (Best) los cuerpos de la barra (44), la caja (45) y la vitrina (46) vienen del catálogo; las cafeteras, vasos y la pantalla del TPV siguen siendo procedurales y en vivo. Mesas y sillas siguen procedurales en la escena (la mesa se dibuja junto a sus sillas); en el Inventario sí tienen Hiperreal.
- En el gemelo sólo los materiales Hiperreal/Matrix reciben reflejos de un pequeño entorno de paneles de luz; el resto de la escena conserva su aspecto y su coste.

## Ficheros por pieza

- `inventario/assets/catalog/<nn>/hiperreal.glb` · LOD web (texturas de color a 2K y mapas de datos a 1K en WebP; objetivo ≤ 5 MB).
- `inventario/assets/catalog/<nn>/hiperreal/hiperreal-hd.glb` · LOD HD para Unreal (color 4K, datos 2K).
- `inventario/assets/catalog/<nn>/hiperreal.blend` · máster; las texturas de la biblioteca se comparten en `inventario/assets/hiperreal-tex/` (ruta relativa `//../../hiperreal-tex/`).
- `inventario/assets/catalog/<nn>/hiperreal.manifest.json` · clases de material, tamaños, fuentes CC0.
- `inventario/assets/catalog/<nn>/hiperreal/preview/` · comparativa antes/después.

Se conservan los nombres de objeto y todas las propiedades de inventario (`inventoryNumber`, `inventoryId`, `mediaSurface`, `surfaceId`, `screenTarget`…).

## Pipeline (`admira-xp/tools/hiperreal/`)

1. `pipeline.py --mode build` (Blender 5.2, sobre el `.blend` del perfil de origen, normalmente Best):
   - Escala uniforme de productos cuando un padre los aplasta (`uniform_products`, el problema de la 47).
   - Aplica los biseles procedurales a la geometría.
   - Clasifica cada material por nombre (palabras clave), por color de la paleta Starbucks o por color/metalicidad, y le asigna un juego PBR CC0: `wood`, `wood_dark`, `wood_stained`, `stone`, `metal`, `metal_dark`, `powder`, `glass`, `led`, `ceramic`, `paper`, `cardboard`, `plastic`, `pastry`, `rubber`, `screen`, `gloss_black`, `keep`.
   - `texlib.py` tiñe la veta real (roble Poly Haven 4K, piedra) al color de diseño de cada material y genera ORM con huellas y manchas (ambientCG).
   - UV a escala física (veta a lo largo de la tabla).
   - Variación sembrada por nombre en objetos sueltos (bollería, platos, etiquetas).
   - Exporta el HD y guarda el máster.
2. `lod.sh <n>` · `gltf-transform`: dedup → resize 2K/1K → WebP q84 (→ quantize si pasa de 5 MB).
3. `pipeline.py --mode before|after` · render rápido en Cycles (32 muestras): estudio Matrix neutro frente a tienda (HDRI comfy_cafe, focos cálidos, suelo de hormigón, pared de yeso, polvo y bisel de sombreado sólo en render).
4. `compose.py <tanda> "<piezas>"` · `/workspace/uploads/hiperreal-tanda<N>-comparativa.png` y JPG por pieza.

`run_batch.sh "<piezas>" [muestras]` encadena build + before + after. Los ajustes por pieza van en `pieces.json` (`material_classes`, `coat`, `front`, `expo`, `led_render`, `keep_uvs`, `jitter`…).

## Límites honestos

- Hiperreal mejora materiales, luz e imperfección; no remodela. Las piezas de geometría muy simple (silla 49, mesa 48, cajas de la barra) siguen siendo cajas bien acabadas.
- El botellero 50 ya era PBR: gana sobre todo peso web (4,96 MB → 1,0 MB) y la luz Hiperreal.
- Las medidas siguen siendo interpretativas, no un levantamiento.

## Tanda 2 · piezas nativas de demo (08-10-2026)

Piezas: 2 Estantería, 3 Botellero, 7 Escritorio, 9 Planta, 10 Lámpara, 13 Pantalla TFT, 15 Tablet de satisfacción, 51 Librería
(no existe `catalog/01`). `admira-xp/demos/catalog.json` solo tiene escenarios Starbucks: no hay escena 365/Lenovo con piezas del catálogo que priorizar.

**Detalle geométrico real** (`detail()` en `pipeline.py`, tras los materiales y antes de las UV):
- cajas de 8 vértices (madera, lacado, metal, plástico, piedra): bisel real de hasta 4 mm (2 segmentos);
- tableros finos de madera: cantos de ABS (material propio, un 16 % más oscuro y satinado);
- tableros verticales grandes (>35 cm): panel con ranura perimetral (inset 4 cm, 3 mm de fondo);
- por pieza: `kick_plate` (zócalo empotrado de aluminio oscuro) y `detail.handles` (tirador de barra en frentes de cajón/puerta);
- las cajas ya redondeadas de las piezas nativas (98 vértices) y las mallas trianguladas no se tocan.
- los textos 3D (letreros) se exportan también (tipo FONT) para no perder la identidad visual.

**Encuadre**: `front` admite `-Y`, `+Y`, `+X`, `-X` (la estantería 2 mira a `+X`). La pared, el zócalo de pared y las luces se colocan según ese frente.

**Fondo de las comparativas**: microcemento cálido liso y pared pintada mate con rodapié; sin texturas de hormigón ni yeso. El polvo de las superficies superiores baja a la mitad.

**Límites honestos**: las piezas nativas 3, 7, 9, 10, 13 y 15 están hechas con cajas ya redondeadas o mallas trianguladas, así que el detalle geométrico automático no les añade nada; mejoran solo por materiales. El escritorio 7 no recibió tirador (su cajonera no es una caja simple). Donde más se nota el detalle es en la librería 51 (biseles, cantos y panel trasero) y en la estantería 2 (paneles laterales y zócalo).
