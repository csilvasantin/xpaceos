# Best y Matrix — 29 septiembre 2026

Good conserva el gemelo clásico; Better muestra su versión 3D. Best es ahora la anterior Matrix: Avenida Admira con cámara fija, muebles editables y visitantes del gemelo. Matrix abre la captura 360° del Starbucks de Alsea. En «Mapear players», marca las cuatro esquinas de la pantalla, anota el ID del player real y una URL HTTPS de vista previa. Aplica los datos y guarda el mapa en este navegador; puedes exportarlo o importarlo. Un ID anotado no verifica conexión ni publica contenido en equipos reales. La captura disponible es un panorama equirectangular, no un modelo Gaussian Splatting.

Good keeps the classic twin; Better shows its 3D version. Best is now the former Matrix: Avenida Admira with a fixed camera, editable furniture and live visitors. Matrix opens the Starbucks Alsea 360° capture. In “Map players”, mark the four screen corners, enter the real player ID and an HTTPS preview URL. Apply the data and save the map in this browser; maps can be exported or imported. Entering an ID does not verify a connection or publish content to real devices. The available capture is an equirectangular panorama, not a Gaussian Splatting model.

## Contrato de mapeo

- Cuatro anclajes yaw/pitch por pantalla: TL, TR, BR, BL. Reproyección con homografía al mover la cámara.
- ID real y URL de previsualización son metadatos introducidos por el usuario; no se inventan ni se validan contra un backend de players.
- Guardado local, exportación/importación JSON (version 1, capture alsea-starbucks-360); máximo 24 pantallas.
- La previsualización se inicia explícitamente; no se restaura sola. No envía órdenes a equipos.
- /gente y /personal controlan los actores simulados en Good/Better/Best. No retocan personas fotografiadas en la captura Matrix.
- Referencia: Yokup DCL-e9f021571cfbed9fbebd3d4e · captura pública /api/catalog y /img/starbucks-demo.webp.

## Altavoz / Speaker

Matrix · Starbucks Paseo de Gracia: pulsa el altavoz situado junto a la señal de salida para escuchar la playlist Starbucks Alsea. La primera pulsación inicia el audio; las siguientes alternan sonido y silencio sin pausar, reiniciar ni detener el cambio de canción. Experto → Altavoz lleva la cámara hasta él; Escuchar/Silenciar ofrece el mismo control. Al salir de Matrix se silencia la escucha local y la playlist sigue avanzando mientras la página esté abierta. Primera pieza de Stock: Bad Times Deep House (6:41), enlazada directamente. Las referencias publicadas se conservan aunque caduque la cola. Las piezas Suno encargadas a Morfeo siguen pendientes de entrega. Consulta nuevas piezas cada 30 segundos. Este control no cambia el volumen de las pantallas físicas.

Matrix · Starbucks Paseo de Gracia: click the speaker beside the exit sign to listen to the Starbucks Alsea playlist. The first click starts audio; subsequent clicks toggle sound and mute without pausing, restarting or stopping track changes. Expert → Speaker takes the camera there; Listen/Mute offers the same control. Leaving Matrix mutes local listening while the playlist keeps advancing as long as the page stays open. First Stock track: Bad Times Deep House (6:41), linked directly. Published references remain available after the delivery queue expires. The Suno tracks requested from Morfeo are still awaiting delivery. New tracks are checked every 30 seconds. This control does not change the volume of physical screens.

Canal: `starbucks-alsea-paseo-de-gracia` · `/hilomusical/next` en api.admira.store. La creación/publicación de las piezas se coordina en FLT-101276; implementación del altavoz: Yokup #178.


## Playlist Starbucks · PlayerTaza / Mug screen

PlayerTaza comparte la selección publicada del Starbucks. La taza debe mostrar el vídeo silenciado y el altavoz controla el audio. La integración de la taza y la sincronización entre dispositivos siguen pendientes.

PlayerTaza shares the published Starbucks selection. The mug should display muted video while the speaker controls audio. Mug integration and cross-device synchronization are still pending.

Playlist JSON: https://www.xpaceos.com/admira-xp/starbucks-playlist.json

Guía ES/EN / Integration guide: https://www.xpaceos.com/admira-xp/docs/starbucks-playlist.md


## Starbucks · admira.app → XpaceOS

En admira.app, busca «Starbucks Paseo de Gracia» y abre la ficha de Paseo de Gracia 103, Barcelona. Pulsa «Visita al Digital Twin» junto a «Tour DOOH» para entrar directamente al Starbucks de XpaceOS en Matrix. Tour DOOH conserva su recorrido por el mapa.

In admira.app, search for “Starbucks Paseo de Gracia” and open the profile at Paseo de Gracia 103, Barcelona. Click “Visit the Digital Twin” beside “Tour DOOH” to open the Starbucks in XpaceOS Matrix directly. Tour DOOH keeps its map tour.

Ficha / Profile: https://admira.app/?locationId=alsea-sbux-021&lang=es

Digital Twin: https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix&loc=alsea-sbux-021

ID: alsea-sbux-021. Asociación curada por ID en xpace-link.js; xpaceUrl explícito del backoffice prevalece, incluido vacío. No se asigna a los demás Starbucks por nombre o circuito. Abrir la visita no publica contenido en players físicos.

Curated association by ID in xpace-link.js; an explicit backoffice xpaceUrl takes precedence, including an empty value. Other Starbucks locations are not matched by name or circuit. Visiting does not publish content to physical players.
