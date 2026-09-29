# Starbucks Alsea · hiloMusical · PlayerTaza

## Español

Contrato compartido para Trinity y los agentes de XpaceOS. Canal/playlist: `starbucks-alsea-paseo-de-gracia`.

- [Playlist JSON pública](https://www.xpaceos.com/admira-xp/starbucks-playlist.json): selección publicada persistente, versión de esquema 1; `tracks` contiene `stockId`, `title`, `url`, `duration` (segundos) y `mimeType`.
- Primera pieza: **Bad Times Deep House**, Stock **1308**, ID `1790706121644-y5mqrq`, duración **400.962177 s**. [MP4 directo](https://stock.admira.store/stock/1790706121644-y5mqrq/asset.mp4?v=35775129), vídeo H264 con audio AAC. Carlos aportó esta pieza; no se atribuye a Suno.
- [Abrir Starbucks Matrix](https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix). Experto → Altavoz lleva la cámara al control del hilo musical.

Para pintar la pieza en la taza con pantalla, consumir el JSON y usar `tracks[index].url` como fuente de vídeo con `muted` y `playsinline`. El altavoz de XpaceOS es el único dueño del audio local: primera pulsación inicia; siguientes alternan mute sin pausar ni reiniciar. Una selección disponible no significa que ya esté sonando: el navegador necesita la primera interacción. La playlist recorre las pistas en orden y vuelve al principio; con una pieza repite esa pieza.

**Estado de integración:** el manifiesto comparte contenido, no un reloj de reproducción. PlayerTaza todavía debe implementar y verificar su integración. En la misma página, el transporte existente es el elemento `audio#starbucksMusic`: una futura integración puede seguir `currentSrc` y `currentTime`, sin modificar su mute ni crear otro audio audible. No se publica todavía una API de sincronización entre pestañas, navegadores, dispositivos o players físicos; no inventar IDs de player o afirmar conexión a Admira.tv por tener la URL.

La consulta adicional `https://api.admira.store/hilomusical/next?store=starbucks-alsea-paseo-de-gracia&since=0` es una cola temporal (24 h), consultada cada 30 s mientras Matrix está abierto. Puede aportar pistas aún no consolidadas en el manifiesto. No usarla como catálogo permanente ni reenviar esta pieza a `/hilomusical/push`: esa ruta vuelve a publicar en Stock. Para añadir piezas definitivas, actualizar `scripts/starbucks-playlist.mjs`, ejecutar `node admira-xp/scripts/export-starbucks-playlist.mjs` desde la raíz y publicar ambos archivos. El test comprueba que altavoz y JSON coincidan.

Las tres piezas instrumentales sin letra solicitadas a Morfeo siguen pendientes de entrega (FLT-101276). Altavoz y primera pieza: Yokup #178. Contrato/documentación para Trinity: Yokup #190. Actualizado: 29 septiembre 2026.

## English

Shared contract for Trinity and XpaceOS agents. Store/playlist ID: `starbucks-alsea-paseo-de-gracia`. Use the [public JSON playlist](https://www.xpaceos.com/admira-xp/starbucks-playlist.json), schema version 1. Each `tracks` entry provides `stockId`, `title`, `url`, `duration` in seconds and `mimeType`. The first published track is **Bad Times Deep House**, Stock **1308**, **400.962177 s**, MP4 with H264 video and AAC audio. Carlos supplied this track; it is not attributed to Suno.

The mug screen should use the track URL as a muted, inline video. The XpaceOS speaker owns local audio: the first click starts playback; later clicks toggle mute without pausing or resetting. Playback advances sequentially and repeats the playlist. Availability does not imply playback has started: a user gesture is required.

The manifest shares content, not a playback clock. PlayerTaza integration still needs implementation and verification. Within the same page, the existing transport is `audio#starbucksMusic`; a future integration can follow its `currentSrc` and `currentTime` without changing its mute state or creating a second audible source. Cross-tab, cross-browser, cross-device and physical-player synchronization are not implemented. A media URL does not establish an Admira.tv player connection.

The `/hilomusical/next` store feed is a temporary 24-hour delivery queue, checked every 30 seconds while Matrix is open. It can contain additions not yet saved in the manifest. Do not treat it as a permanent catalog or push this existing asset again: `/hilomusical/push` republishes to Stock. Maintain the source module and regenerate the public JSON using the command above. Morfeo's three instrumental Suno tracks remain pending under FLT-101276. Speaker/first track: Yokup #178; this handoff: Yokup #190.
