# Altadis · Pixeria · contrato del preview #4970

Estado: preview local, contenido oficial pendiente de Carlos/Lucas. Cambio #4970 incorporado a #4967 y #4969. No publicado en producción.

## ES · Uso

Abre `/admira-xp/?autostart=xtanco&loc=altadis-bcn-001&adaptado=1&quality=good&lang=es`. En «Recorrido del circuito», alterna «Sin adaptar / Adaptado con Pixeria», y recorre los nueve locales con anterior/siguiente o [ y ]. La navegación conserva el modo. La ventana sigue siendo movible y redimensionable, con Opciones, Avanzadas y Experto del shell existente.

Los marcadores dicen «contenido Altadis». No son vídeos, renders ni una comparación visual final. Dos pantallas registradas por estanco: P1 escaparate 1080×1920; P2 mostrador 1920×1080. Las superficies publicitarias decorativas de la escena también se neutralizan; no se cuentan como hardware registrado. Sin entrega física verificada.

## Conectar archivos, cuando lleguen

Fuente prevista por Carlos: `/workspace/altadis-estancos/neutro/` en GrokBotBox. No se selecciona ni genera otra pieza. Cada `locations[].surfaces[]` de `altadis/demo.json` tiene `screen`, `w`, `h`, `files.original`, `files.adapted` y `expectedFiles`. Cada entrada `files` queda en null hasta disponer del archivo oficial. `expectedFiles` sólo describe el destino esperado, nunca dispara una descarga.

Ejemplo de conexión, únicamente tras verificar archivo y contenido:

```json
{"files":{"original":{"url":"/altadis/media/altadis-bcn-001/original.mp4","width":1080,"height":1920},"adapted":{"url":"/altadis/media/altadis-bcn-001/p2-1920x1080.mp4","width":1920,"height":1080}}}
```

Usar las dimensiones reales de ffprobe, no copiar el ejemplo. URL HTTPS o relativa al sitio. El adaptado debe coincidir exactamente con w/h del destino. El reproductor vuelve a comprobar videoWidth/videoHeight; un archivo mal asignado se oculta y muestra un error. El original se contiene completo, conservando su relación de aspecto. Recargar el preview tras editar la lista. Cada estanco puede llevar composiciones diferentes: no hay un vídeo global compartido por resolución.

Próximo paso de #4967: verificar las composiciones oficiales, conectar los 18 destinos, comprobar movimiento y encaje, capturar comparación real en tres estancos, publicar XpaceOS/Admira Store/Pixeria y actualizar la ayuda del MCP real. Hasta entonces no se acredita vídeo final, producción ni emisión en pantallas físicas.

## EN · Usage and pending delivery

Open the URL above. Original / Adapted with Pixeria changes mode; previous/next ([ and ]) preserves it across nine shops. The existing draggable/resizable circuit window and Options, Advanced and Expert controls are retained. Grey placeholders are not videos or completed adaptations.

The JSON contract assigns files per shop and screen, never globally by orientation. Null means pending. Expected paths never trigger downloads. Only HTTPS or site-relative media URLs are accepted. Adapted dimensions must exactly match the registered screen; actual video metadata is checked again before rendering. Original files retain their complete aspect ratio. Reload after updating the file list.

Official Altadis content is pending. Production delivery, real MCP help deployment, actual video comparisons and physical proof of play remain unverified.

## Guion de minitutorial (pendiente, no vídeo exportado)

1. Dónde: demo Altadis → ventana Recorrido del circuito.
2. Cómo: cambia Sin adaptar / Adaptado con Pixeria; navega anterior y siguiente.
3. Resultado actual: 18 destinos correctos y marcadores grises; el vídeo oficial aún no está conectado.
4. Resultado final pendiente: comparación con las composiciones oficiales verificadas.

No se ha generado un minitutorial MP4: Carlos indicó en #4970 no generar ningún vídeo hasta recibir el suyo. Al levantar esa espera, usar el generador oficial de ADmiraNeXT y registrar el enlace duradero en Yokup; indicar animación si no es captura real.
