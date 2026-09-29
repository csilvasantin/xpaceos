# Layout · Playlists por dispositivo / Device playlists

En Matrix · Starbucks, /layout activa los números y la selección de las seis pantallas y el TPV. Pulsa el dispositivo o su número para editar su playlist. Ctrl + clic, Cmd + clic en Mac o Selección múltiple permiten añadir o quitar dispositivos de la selección. Unir seleccionados les asigna una playlist común y un reloj de reproducción local. Puedes añadir vídeos por URL HTTPS directa, quitarlos, ordenarlos, guardar, usar otra playlist, separar dispositivos o restaurar su playlist original. Editar una playlist compartida afecta a todos sus miembros, indicados en el editor. Al editar una playlist original se crea una copia para los seleccionados. Los cambios del panel se guardan en este navegador; las operaciones MCP autenticadas comparten asignaciones entre clientes abiertos. Salir de /layout cierra el editor y devuelve el arrastre de cámara.

In Matrix · Starbucks, /layout enables labels and selection for the six wall screens and POS. Click the device or its number to edit its playlist. Ctrl + click, Cmd + click on Mac or Multiple selection adds/removes devices from the selection. Group selected assigns one shared playlist and a local playback clock. Add direct HTTPS video URLs, remove/reorder clips, save, use another playlist, ungroup devices or restore their original playlist. Editing a shared playlist affects every member listed in the editor. Editing a base playlist creates a copy for the selected devices. Saving publishes playlist contents by #playlist ID; device assignments are saved in this browser. Leaving /layout closes the editor and restores camera dragging.

## MCP y persistencia / MCP and persistence

matrix_device_layout: save_playlist {playlist_id:"playlist-local",title:"Local",tracks:[{id:"clip",title:"Promotion",url:"https://stock.admira.store/stock/ID/asset.mp4"}]}; assign {device_ids:["starbucks-wall-06","starbucks-tpv-01"],playlist_id:"playlist-local"}; reset {device_ids:[...]}; remove_playlist {playlist_id:"playlist-local"}. Every call requires action and a fresh expected_revision from matrix_state. deviceLayout contains custom playlists and assignments; deviceLayoutRevision controls delivery. Maximum 24 custom playlists, 100 clips each. Only the seven documented virtual screen IDs are supported. No physical-device publication or cross-browser playback clock.

ES: Leer matrix_state antes de cada escritura. Usar la clave de flota propia en Authorization. El estado vivo está en https://mcp.admira.store/matrix/starbucks. No insertar claves en el navegador. El siguiente cambio remoto de deviceLayout conserva las playlists del registro y sus asignaciones locales; la misma revisión no borra los ajustes locales al recargar. Un cliente nuevo recibe la última configuración compartida. Guardar publica título y contenidos por #playlist ID; las asignaciones de dispositivos permanecen locales.

EN: Read matrix_state before each write. Use your own fleet key in Authorization; never embed keys in the browser. The next remote deviceLayout change preserves registered playlists and their local assignments; reloading the same revision preserves local edits. New clients receive the latest shared configuration. Saving publishes playlist title and contents by #playlist ID; device assignments remain local.

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

playlist_add {playlist:"tpv",stockId:"#1329",expected_revision:N} adds the resolved video to a shared base playlist. playlist aliases: hilo, pantallas, tpv, sincro-ia. Existing demo assets remain supported; new Pixeria lookup returns videos only. Ambiguous titles/hashtags fail with no write: use pixeria_search, select an id/number and retry with a fresh revision. Removal/reorder use IDs or Stock numbers already stored in that playlist. For a custom device playlist, read matrix_state, resolve via pixeria_search, then matrix_device_layout save_playlist with the complete ordered array of {id,title,url}; assign only the intended device_ids. Writes require each agent’s own fleet key and expected_revision. Saving UI playlists publishes their contents by #playlist ID; device assignments remain local. Never put a fleet key in browser code.

Verified example: Stock #1329 = 1790711463701-yxy150, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2”. #1329 is a stable reference, not a promise that it is always the latest upload.

Docs: https://www.xpaceos.com/admira-xp/docs/pixeria-playlists.md

## Playlist · Previo y Play / Preview and Play

ES: En Matrix → /layout → dispositivo, cada fila muestra un previo silencioso junto al número. El botón ▶ está a la derecha de × y salta al inicio de ese contenido. Todos los dispositivos virtuales activos que usan esa playlist cambian juntos, reanudando los pausados; después continúa el orden normal. Las otras playlists y el hilo musical no cambian. Play guarda primero los cambios válidos e ignora filas vacías. Los dispositivos apagados permanecen apagados. El previo no reproduce audio. Si falla el vídeo, se indica el error y Play permite reintentar.

EN: In Matrix → /layout → device, each row shows a silent preview beside its number. The ▶ button is immediately to the right of × and jumps to the beginning of that content. All active virtual devices using that playlist switch together, resuming paused members; normal playlist order continues afterwards. Other playlists and background music are unaffected. Play saves valid draft changes first and ignores empty rows. Powered-off devices stay off. Previews never play audio. Failed videos show an error and Play retries.

MCP: playlist_play {playlist_id, track_id, expected_revision}. Read matrix_state first. playlist_id is wall, tpv or a shared playlist-<id>. track_id is the saved content ID, not its row number. Authenticated fleet key required. Saving in the editor publishes a stable #playlist UUID; screen assignments remain local. For UUID playlists read playlist_list, not matrix_state, for the revision. The UI Play action remains local to the current browser. MCP commands reach already-open Matrix clients at the next poll (approximately 5 seconds); old commands are not replayed when entering Matrix. Each browser synchronizes its assigned devices locally; this does not guarantee frame accuracy between browsers or publish to physical players. Selecting a regular video exits AI sync. An acknowledgement records the command, not successful playback.

ES: Los agentes pueden leer, editar y saltar a contenido compartido por MCP. EN: Agents can read, edit and jump to shared content through MCP. Endpoint: https://mcp.admira.store/mcp. Example: read matrix_state, then playlist_play with playlist_id="wall", track_id from state.playlists.wall.tracks and the current expected_revision.

## Experto · Acciones, hover y arrastre / Actions, hover and dragging

ES: La fila Send / Show-Hide / Player y cámara / × está en la tercera columna de Experto, junto al selector Good/Better/Best/Matrix y Local view. La columna central queda para los controles operativos. Show/Hide sigue ocultando sólo el texto de Local view.

EN: The Send / Show-Hide / Player and camera / × row is in the third Expert column, together with Good/Better/Best/Matrix and Local view. The middle column holds operational controls. Show/Hide still toggles only Local view text.

ES: El altavoz de avisos no muestra ningún icono ni contorno en reposo, incluso durante la locución. El rectángulo aparece al pasar el ratón por encima o recibir foco de teclado, con animación suave salvo movimiento reducido. Sigue siendo pulsable sobre el altavoz real de la captura; en táctil se puede tocar directamente.

EN: The announcement speaker shows no icon or outline at rest, including during playback. Its rectangle appears on hover or keyboard focus, with a subtle animation unless reduced motion is enabled. The hotspot remains clickable over the captured speaker; touch users can tap it directly.

ES: En /layout, abre la playlist y arrastra una miniatura a la posición deseada. Ratón y táctil reordenan el borrador; al acercarse al borde del panel, la lista se desplaza. Escape o soltar fuera cancela el arrastre. También puedes enfocar la miniatura y usar ↑/↓, o pulsar los botones de flechas existentes. Pulsa Guardar playlist para aplicar y conservar el orden; Play guarda los cambios válidos antes de reproducir.

EN: In /layout, open the playlist and drag a thumbnail to the desired position. Mouse and touch reorder the draft; moving near the panel edge scrolls the list. Escape or dropping outside cancels the drag. You can also focus the thumbnail and use ↑/↓, or use the existing arrow buttons. Save playlist applies and persists the order; Play saves valid changes before playing.

MCP: Existing playlist_reorder changes shared wall/TPV/music order using the full order array and expected_revision. For custom shared playlists, use matrix_device_layout action=save_playlist with the same playlist_id, title and reordered tracks. Read matrix_state before writing. Browser drafts remain local until shared explicitly. UI dragging does not create new physical-device operations or tools. playlist_play continues to jump to saved content. Endpoint: https://mcp.admira.store/mcp.

## Playlist IDs · Guardado, Play y agentes / Saving, Play and agents

ES: Se ignoran las filas totalmente vacías al guardar o pulsar Play. Una fila con sólo título o sólo URL debe completarse; el borrador se conserva si hay un error. Play guarda primero los cambios válidos y asigna la playlist al dispositivo seleccionado antes de saltar al vídeo. Todos los dispositivos que ya comparten esa misma playlist siguen su reloj común. Elegir una playlist en el desplegable ya no provoca que Play actúe sólo en su antiguo destino.

EN: Completely empty rows are ignored when saving or pressing Play. A row with only a title or only a URL must be completed; errors preserve the draft. Play first saves valid edits and assigns the playlist to the selected device before jumping to the video. Devices already sharing that playlist follow their common clock. Choosing a playlist no longer makes Play target only its previous device.

ES: Cada playlist guardada desde el editor tiene un ID estable #playlist<UUID>, visible con Copiar ID. Guardar publica título y contenidos en el registro compartido; la asignación de pantallas sigue en este navegador. Editar y volver a guardar mantiene el ID; Unir crea una nueva lista. Las listas antiguas locales se publican la próxima vez que se guardan. La URL de lectura es https://mcp.admira.store/playlists/<UUID>. El navegador conserva una autorización limitada a sus propias playlists; nunca recibe claves de flota. Comparte el ID, no las credenciales.

EN: Every playlist saved from the editor gets a stable #playlist<UUID> ID, shown with Copy ID. Saving publishes its title and contents to the shared registry; screen assignments stay in this browser. Editing and saving retains its ID; Group creates a new list. Legacy local playlists are published on their next save. Public read URL: https://mcp.admira.store/playlists/<UUID>. The browser holds authorization scoped to its own playlists and never receives fleet keys. Share the ID, not credentials.

MCP example: playlist_add {playlist:"#playlist<UUID>",stockId:"#1309"}. An authenticated agent appends to the end automatically when position is omitted. Stock title, exact hashtag or number are supported; ambiguous searches require choosing a result. Repeated append of the same asset to a UUID playlist is idempotent. Concurrent appends retry without losing items. expected_revision is optional for append; supply it to require an exact revision. playlist_list {playlist:"#playlist<UUID>"} returns current contents and its own revision. playlist_remove and playlist_reorder accept that identifier plus expected_revision; use saved track IDs. playlist_play {playlist_id:"#playlist<UUID>",track_id:"<saved id>",expected_revision:N} jumps on already-open subscribed clients. The UUID playlist revision is independent of matrix_state.revision.

ES: Los cambios de agentes llegan cada cinco segundos a las listas guardadas y asignadas en el navegador. Se añaden al final sin interrumpir el vídeo actual. Si hay edición pendiente, se conserva; un guardado con revisión antigua se rechaza. Recargar playlist permite recuperar los cambios compartidos antes de editar otra vez. Si no hay conexión, se conserva el último estado. No hay publicación a dispositivos físicos.

EN: Agent updates arrive about every five seconds for registered playlists present in the browser. Appending preserves the current video and puts new content at the end. Pending edits are retained; a stale save is rejected. Reload playlist retrieves shared changes before editing again. Offline playback keeps the last state. This does not publish to physical devices.

Base IDs: #playliststarbucks-wall (pantallas), #playliststarbucks-tpv (tpv), #playliststarbucks-music (hilo), #playliststarbucks-ia (sincro-ia). Base writes use matrix_state revision; playlist_add can obtain it automatically when omitted. UUID playlists use playlist_list revision. Existing matrix_device_layout remains available for legacy shared assignments and playlists. Endpoint: https://mcp.admira.store/mcp.
