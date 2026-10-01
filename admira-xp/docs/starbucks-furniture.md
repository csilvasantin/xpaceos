# Starbucks PG103 · mobiliario / furniture

ES: Carlos confirmó el listado el 1 de octubre de 2026. Yokup es el maestro ITIL de `alsea-sbux-021`: barra de preparación `PDG103-BAR-01`, mostrador `PDG103-MOS-01`, vitrina `PDG103-VIT-01`, estantería `PDG103-EST-01`, mesas `PDG103-MES-01/02` y sillas `PDG103-SIL-01/02/03/04`. Son diez unidades de categoría mobiliario; pantallas, TPV y altavoz conservan sus CIs existentes. Sin medidas de campo, fabricante, serie, compra o garantía inventados.

EN: Carlos confirmed the list on 1 October 2026. Yokup is the ITIL master for `alsea-sbux-021`: preparation counter `PDG103-BAR-01`, checkout counter `PDG103-MOS-01`, display case `PDG103-VIT-01`, shelves `PDG103-EST-01`, tables `PDG103-MES-01/02` and chairs `PDG103-SIL-01/02/03/04`. Ten furniture units; existing screen, POS and speaker CIs remain separate. Field dimensions, manufacturer, serial, purchase and warranty information remain unknown.

## Ver y descargar / View and download

[Visor y diez unidades / Viewer and ten units](https://www.xpaceos.com/inventario/starbucks/). Selecciona una unidad, arrastra para girar, cambia frontal/trasera/lateral y descarga GLB o Blender. / Select a unit, drag to orbit, choose front/back/side and download GLB or Blender.

[Manifest](https://www.xpaceos.com/inventario/starbucks/manifest.json): `itil_code` ↔ `instance_id` ↔ `asset_number` ↔ `model3d`/`master`. Catálogo permanente 44–49: barra, mostrador, vitrina, estantería, mesa, silla. Las dos mesas comparten asset 48; las cuatro sillas comparten asset 49. / Permanent catalog numbers 44–49: preparation counter, checkout counter, case, shelves, table, chair. Two tables share asset 48; four chairs share asset 49.

Los 18 GLB y sus 18 maestros Blender se construyen desde las piezas de `scripts/starbucks-room.js`, con sillas separadas y geometría propia por tipo. Good/Better/Best son estilos, no precisión métrica; unidades de escena sin calibrar. El visor no modifica el local ni publica cambios de distribución. La escena actual mantiene sus sillas agrupadas en las mesas; la galería nueva ofrece los modelos independientes. / The 18 GLBs and 18 Blender masters derive from shared scene parts, separating chairs and retaining type-specific geometry. Good/Better/Best are styles, not measured accuracy. Viewer actions do not edit the venue or publish layouts. The current scene still groups chairs under tables; the new gallery provides independent models.

MCP: `itil_inventory_get` / `itil_ci_upsert` de Yokup leen/registran CIs por código; el manifest enlaza los archivos 3D sin introducir una herramienta de escritura nueva. / Yokup tools read/register CIs by code; the manifest links 3D files without a new remote write tool.

## Paneles / Side panels

Opciones y Avanzado siguen el borde inferior real de la barra superior y el borde superior de los docks inferiores visibles, sin hueco adicional. El cálculo reacciona a cambios de tamaño y visibilidad; conserva los anchos guardados. / Options and Advanced follow the actual header bottom and visible bottom-dock top, without an extra gap. Bounds react to size and visibility changes while retaining saved widths.
