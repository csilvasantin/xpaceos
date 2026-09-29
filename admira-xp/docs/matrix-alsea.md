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
