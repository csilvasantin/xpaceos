# 01.- Un espacio, tres representaciones

Release: v.15.09.2026.r4.12:07. Misión: DCL-439017bdcf3269d6b417599a.

| Nivel visual | Entrada | Estado y correspondencia |
| --- | --- | --- |
| 01.- Good · 8 bits | Avanzado ▤ / Experto ⌘ / selector / `/modo good` | Canvas clásico; dueño de simulación, layout y controles. |
| 02.- Better · 16 bits | Mismos accesos / `/modo better` | Mismo snapshot de entidades. Cámara `mapped` por defecto; `Explorar 3D` no altera Good. |
| 03.- Best · 32 bits | Mismos accesos / `/modo best` | Escenario conceptual fijo con una capa de personas que lee las posiciones del mismo snapshot vivo. La cámara, el mobiliario y las 30 funciones Best todavía no son interactivos. |

Los números anteriores pertenecen a los **niveles visuales**, no renumeran las funciones estables XP-F01–XP-F30. 8/16/32 son etiquetas artísticas, no profundidad de color ni una promesa de paridad.

## 02.- Registro geométrico Good → Better

Good proyecta `(col,row)` como `X=ox+(col-row)*tileW/2`, `Y=oy+(col+row)*tileH/2`.
Better interpreta `(x,y,z)=(col,altura,row)`. `life-camera.mjs` deriva azimut `π/4`, elevación `asin(tileH/tileW)` (20,487° para80×28), escala `tileW/√2` y frustum desde el origen y tamaño lógico de Good.

Se contiene el mismo rectángulo lógico en la superficie disponible, sin deformación. Barras, tamaño de ventana y letterboxing pueden cambiar su tamaño visible. Pruebas con Three real registran puntos de suelo, alturas y anclas de actores, no igualdad píxel a píxel entre sprites2D y mallas interpretadas3D.

Cada entrada en Better vuelve a `mapped`. Girar, desplazar, acercar, Planta o Detalle son exploración libre. `Comparar con Good` restaura inmediatamente el registro. No se rota el canvas Good ni se crea otra simulación para imitar la cámara libre.

## 03.- Referencia Best y producción futura

`../assets/best-xtanco-mapped-20260915.png` fue generada con la herramienta integrada de imagen usando una captura de Better en `mapped` como referencia geométrica y la propuesta aprobada como referencia de materiales. El prompt se conserva junto al PNG. Es una aproximación artística, no una reconstrucción3D ni un asset registrado por puntos. La propuesta original se conserva en `best-xtanco-concept-20260915.png`.

La preview con personas usa `../assets/best-xtanco-gran-de-gracia-cleanplate-20260915.png`, derivada de la imagen anterior eliminando sus personas fijas y recuperando la fachada de piedra y la placa «CARRER GRAN DE GRÀCIA» del concepto aprobado. `best-live-people.mjs` proyecta la cuadrícula canónica 14×8 de Good sobre cuatro anclas medidas en ese mismo suelo y no modifica la simulación. La escala CSS se calibra contra la altura visible de la puerta y el mobiliario, con corrección de profundidad para adultos y niños.

Para un Best operativo, Blender/Unreal deberán consumir el mismo layout y los mismos IDs de entidades, junto al contrato de cámara; los assets deberán verificarse contra anclas y medidas. La capa actual sí sigue aproximadamente las posiciones de las personas, pero la imagen de fondo no cumple ese contrato de runtime ni permite afirmar sincronización exacta del escenario. Las30 áreas funcionales de Best siguen `planned` en `/mcp/funcionalidades.json`.

## 04.- Navegación y seguridad

Un único router y una única preferencia versionada gobiernan todos los selectores. Los cambios cancelan la apertura anterior; `requestId` y `AbortSignal` impiden que resultados tardíos reabran una vista. Best confirma éxito después de cargar su imagen; Better después de preparar el renderer. `/modo` es local: no se envía a Telegram ni ejecuta herramientas MCP. Escape vuelve a Good. `pagehide` libera recursos sin borrar la preferencia.
