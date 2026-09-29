# Layout · Playlists por dispositivo / Device playlists

En Matrix · Starbucks, /layout activa los números y la selección de las seis pantallas y el TPV. Pulsa el dispositivo o su número para editar su playlist. Ctrl + clic, Cmd + clic en Mac o Selección múltiple permiten añadir o quitar dispositivos de la selección. Unir seleccionados les asigna una playlist común y un reloj de reproducción local. Puedes añadir vídeos por URL HTTPS directa, quitarlos, ordenarlos, guardar, usar otra playlist, separar dispositivos o restaurar su playlist original. Editar una playlist compartida afecta a todos sus miembros, indicados en el editor. Al editar una playlist original se crea una copia para los seleccionados. Los cambios del panel se guardan en este navegador; las operaciones MCP autenticadas comparten asignaciones entre clientes abiertos. Salir de /layout cierra el editor y devuelve el arrastre de cámara.

In Matrix · Starbucks, /layout enables labels and selection for the six wall screens and POS. Click the device or its number to edit its playlist. Ctrl + click, Cmd + click on Mac or Multiple selection adds/removes devices from the selection. Group selected assigns one shared playlist and a local playback clock. Add direct HTTPS video URLs, remove/reorder clips, save, use another playlist, ungroup devices or restore their original playlist. Editing a shared playlist affects every member listed in the editor. Editing a base playlist creates a copy for the selected devices. Panel edits are saved in this browser; authenticated MCP operations share assignments with open clients. Leaving /layout closes the editor and restores camera dragging.

## MCP y persistencia / MCP and persistence

matrix_device_layout: save_playlist {playlist_id:"playlist-local",title:"Local",tracks:[{id:"clip",title:"Promotion",url:"https://stock.admira.store/stock/ID/asset.mp4"}]}; assign {device_ids:["starbucks-wall-06","starbucks-tpv-01"],playlist_id:"playlist-local"}; reset {device_ids:[...]}; remove_playlist {playlist_id:"playlist-local"}. Every call requires action and a fresh expected_revision from matrix_state. deviceLayout contains custom playlists and assignments; deviceLayoutRevision controls delivery. Maximum 24 custom playlists, 100 clips each. Only the seven documented virtual screen IDs are supported. No physical-device publication or cross-browser playback clock.

ES: Leer matrix_state antes de cada escritura. Usar la clave de flota propia en Authorization. El estado vivo está en https://mcp.admira.store/matrix/starbucks. No insertar claves en el navegador. El siguiente cambio remoto de deviceLayout sustituye la configuración local completa; la misma revisión no borra los ajustes locales al recargar. Un cliente nuevo recibe la última configuración compartida. La UI no publica automáticamente sus cambios locales al MCP.

EN: Read matrix_state before each write. Use your own fleet key in Authorization; never embed keys in the browser. The next remote deviceLayout change replaces the entire local configuration; reloading the same revision preserves local edits. New clients receive the latest shared configuration. The UI does not automatically publish local edits to MCP.

| Número desde la puerta / Number from entrance | ID |
|---|---|
| 1 | starbucks-wall-06 |
| 2 | starbucks-wall-05 |
| 3 | starbucks-wall-04 |
| 4 | starbucks-wall-03 |
| 5 | starbucks-wall-02 |
| 6 | starbucks-wall-01 |
| TPV / POS | starbucks-tpv-01 |

Base playlists: wall, tpv. Custom IDs start with playlist-. save_playlist replaces the full ordered track array (empty stops that group); remove_playlist restores original assignment for its members. assign can target one or multiple devices. To ungroup, save a new playlist copy and assign it only to that device. reset removes custom assignment and returns to wall or tpv.

## Reproducción / Playback

ES: Los dispositivos con la misma playlist siguen el mismo vídeo y reloj dentro de esa página. Pared y TPV conservan sus controles de pausa. /sincro y /sincrototal distribuyen el vídeo sólo cuando los miembros de ese tramo comparten playlist; un tramo con playlists diferentes se muestra individual. Vídeos siempre sin sonido; hilo musical y cuña no cambian. El editor sólo modifica playlists de vídeo de las seis pantallas y TPV, no el altavoz de avisos.

EN: Devices assigned the same playlist follow one clip/clock within the page. Wall and POS retain independent pause controls. /sincro and /sincrototal span a segment only when its members share a playlist; mixed segments show individual video. Videos stay muted; music and closing announcement remain unchanged. The editor manages the six wall displays and POS, not the announcement speaker.

Local storage: xpaceos.starbucks.device-layout.v1. Contract: device-layout.mjs (same validation in MCP). Runtime: device-playback.mjs. Editing surface: device-editor.mjs.

## 25 · Pixeria · Añadir vídeos por título, hashtag o número / Add videos by title, hashtag or number

ES: En Matrix, escribe /layout, pulsa una pantalla o el TPV y Añadir vídeo. En el campo Título, #hashtag o #1329 escribe el título, un hashtag exacto (por ejemplo #good) o un número de Stock (#1329 o 1329). Pulsa Enter o Buscar en Pixeria. Un número también se resuelve al salir del campo si la URL está vacía. Si hay una coincidencia exacta o única, se rellenan título y URL; si hay varias, elige una. Guarda la playlist para aplicar el borrador a los dispositivos seleccionados. Una coincidencia no inicia una emisión física. No se añade automáticamente todo un hashtag ni se crea una suscripción dinámica. La entrada manual de título y URL sigue disponible. Los vídeos duplicados se avisan sin añadir otra fila.

EN: In Matrix, enter /layout, click a screen or POS and Add video. In Title, #hashtag or #1329 enter a title, an exact hashtag (for example #good), or a Stock number (#1329 or 1329). Press Enter or Search Pixeria. A number also resolves when leaving the field if its URL is empty. An exact or unique match fills the title and URL; otherwise choose a result. Save playlist applies the draft to selected devices. Resolving content does not publish to physical devices. Hashtags do not bulk-add their contents or create a dynamic subscription. Manual title and URL entry remains available. Duplicate videos are reported without adding another entry.

### MCP y fuente / MCP and source

pixeria_search {query:"#1329",limit:20} is a public read. Accepted queries: title words (case/accent insensitive), exact hashtag, stable Stock number or asset id. Returns {query,total,items:[{id,num,title,url,tags,type,exact}]}; only published videos with direct HTTPS URLs. Default limit 20, maximum 50. Stock numbers use the catalog num field, never the position in the list. Public UI endpoint: https://mcp.admira.store/pixeria/search?query=%231329&limit=20. Upstream catalog: https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/index.json, the same public library used by Pixeria. Short cache (up to 30 seconds); failures remain visible and do not overwrite a playlist.

playlist_add {playlist:"tpv",stockId:"#1329",expected_revision:N} adds the resolved video to a shared base playlist. playlist aliases: hilo, pantallas, tpv, sincro-ia. Existing demo assets remain supported; new Pixeria lookup returns videos only. Ambiguous titles/hashtags fail with no write: use pixeria_search, select an id/number and retry with a fresh revision. Removal/reorder use IDs or Stock numbers already stored in that playlist. For a custom device playlist, read matrix_state, resolve via pixeria_search, then matrix_device_layout save_playlist with the complete ordered array of {id,title,url}; assign only the intended device_ids. Writes require each agent’s own fleet key and expected_revision. UI edits remain local; authenticated MCP changes are shared. Never put a fleet key in browser code.

Verified example: Stock #1329 = 1790711463701-yxy150, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2”. #1329 is a stable reference, not a promise that it is always the latest upload.

Docs: https://www.xpaceos.com/admira-xp/docs/pixeria-playlists.md

## Playlist · Previo y Play / Preview and Play

ES: En Matrix → /layout → dispositivo, cada fila muestra un previo silencioso junto al número. El botón ▶ está a la derecha de × y salta al inicio de ese contenido. Todos los dispositivos virtuales activos que usan esa playlist cambian juntos, reanudando los pausados; después continúa el orden normal. Las otras playlists y el hilo musical no cambian. Para cambios sin guardar, guarda primero la playlist. Los dispositivos apagados permanecen apagados. El previo no reproduce audio. Si falla el vídeo, se indica el error y Play permite reintentar.

EN: In Matrix → /layout → device, each row shows a silent preview beside its number. The ▶ button is immediately to the right of × and jumps to the beginning of that content. All active virtual devices using that playlist switch together, resuming paused members; normal playlist order continues afterwards. Other playlists and background music are unaffected. Save draft changes before playing. Powered-off devices stay off. Previews never play audio. Failed videos show an error and Play retries.

MCP: playlist_play {playlist_id, track_id, expected_revision}. Read matrix_state first. playlist_id is wall, tpv or a shared playlist-<id>. track_id is the saved content ID, not its row number. Authenticated fleet key required. First share browser-only custom playlists and assignments with matrix_device_layout. The UI Play action remains local to the current browser. MCP commands reach already-open Matrix clients at the next poll (approximately 5 seconds); old commands are not replayed when entering Matrix. Each browser synchronizes its assigned devices locally; this does not guarantee frame accuracy between browsers or publish to physical players. Selecting a regular video exits AI sync. An acknowledgement records the command, not successful playback.

ES: Los agentes pueden leer, editar y saltar a contenido compartido por MCP. EN: Agents can read, edit and jump to shared content through MCP. Endpoint: https://mcp.admira.store/mcp. Example: read matrix_state, then playlist_play with playlist_id="wall", track_id from state.playlists.wall.tracks and the current expected_revision.
