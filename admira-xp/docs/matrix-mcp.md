# Matrix · MCP · Agentes / Agents

Las pantallas de Matrix · Starbucks y el TPV llevan marco negro, incluido el halo de la captura. Los agentes gestionan sus contenidos desde el MCP de XpaceOS: matrix_state consulta las tres playlists (wall, tpv, music); matrix_playlist_update añade, quita, ordena o vacía contenido; matrix_configure controla reproducción de pared/TPV, sincro, etiquetas y silencio; matrix_music_next avanza la música. Matrix consulta cambios cada 5 segundos mientras está abierto. Las escrituras exigen clave de flota y expected_revision; quedan firmadas por el agente. El estado compartido conserva la última versión si se pierde la conexión.

Matrix · Starbucks screens and POS use black frames, covering the captured blue halo. Agents manage content through XpaceOS MCP: matrix_state reads the three playlists (wall, tpv, music); matrix_playlist_update adds, removes, reorders or clears content; matrix_configure controls wall/POS playback, sync, labels and mute; matrix_music_next advances music. Open Matrix pages poll every 5 seconds. Writes require a fleet key and expected_revision and are signed by the agent. The last state is retained if the connection fails.

ES: Estos controles operan los players virtuales de Matrix. El audio se activa con una pulsación local. Los controles locales siguen disponibles; un nuevo cambio remoto del mismo control prevalece. reset:true libera los controles compartidos y conserva la elección local actual. Para comunicación y encargos entre agentes se utiliza el MCP de Admira.live (agora_decir, agente_encargar, encargo_estado); no se ha enviado ningún encargo de prueba. Añadir funciones nuevas requiere implementación y despliegue: matrix_configure sólo admite las funciones enumeradas, no código arbitrario. El mapeo de esquinas continúa en Recalibrar mapa y no hay confirmación de recepción en hardware.

EN: Controls operate virtual Matrix players. Sound activation requires a local click. Local controls remain available; a new remote change to the same control takes precedence. reset:true releases shared controls while retaining the current local choice. Agent communication and assignments use the Admira.live MCP (agora_decir, agente_encargar, encargo_estado); no test assignment was sent. New capabilities require implementation and deployment: matrix_configure accepts only the listed controls, not arbitrary code. Corner mapping remains in Recalibrate map; no hardware receipt is implied.

## Contrato / Contract

MCP: https://mcp.admira.store/mcp · resource: `xpaceos://matrix/starbucks` · read-only browser feed: https://mcp.admira.store/matrix/starbucks.

1. `quien_soy` confirma tu identidad y escritura / confirms identity and write access. Use your own fleet key; never put credentials into URLs or source files.
2. `matrix_state {}` devuelve / returns `revision`, `playlists`, `controls`, `controlRevision`, `musicNext`, `updatedBy`, `updatedAt`, `history` (last 50 signed operations).
3. Cada escritura usa la última revisión / Every write passes the latest `expected_revision`. A concurrent write rejects stale revisions: read again, review and retry.

Channels: `wall` = six screens (1–3 / 4 / 5–6), `tpv` = local advertising terminal, `music` = speaker/PlayerTaza selection. Playlist identifiers remain unchanged. Public static JSON files are bootstrap snapshots; after a channel is managed through MCP, `matrix_state.playlists[channel]` is authoritative. The legacy music delivery feed remains active until music is managed by MCP; thereafter it cannot re-add a removed song. Queue producers should call `matrix_playlist_update` with published Stock URLs.

### Añadir / Add

`matrix_playlist_update`:
```json
{"channel":"tpv","action":"add","expected_revision":12,"track":{"id":"my-local-ad","stockId":"published-stock-id","title":"Local promotion","url":"https://stock.admira.store/stock/published-stock-id/asset.mp4"}}
```
Revision and Stock ID above are illustrative; read actual state first. Use an existing playable HTTPS media URL, not a YouTube page. Publish media through Pixeria first. No credentials in URLs. Max 100 tracks per channel; IDs and URLs cannot repeat. Prefer MP4 for wall/TPV; music supports browser-playable audio or video.

### Quitar, ordenar y vaciar / Remove, reorder and clear

- Remove: `{channel:"tpv", action:"remove", track_id:"my-local-ad", expected_revision:N}`.
- Reorder: `{channel:"tpv", action:"reorder", order:["id-2","id-1"], expected_revision:N}`. Include every current ID exactly once.
- Clear: `{channel:"tpv", action:"clear", expected_revision:N}`. Stops that channel and clears its media; other channels continue. Removes playlist entries, never deletes Stock files.
- Adding/reordering keeps the current clip and time if its URL remains. Removing the current clip selects the next available position and preserves play/pause or mute. A cleared channel stays stopped until playback is requested after refilling.

### Funciones / Functions

`matrix_configure {expected_revision:N, controls:{wallPlaying:true, tpvPlaying:true, wallMode:"groups", numbersVisible:true, musicMuted:true}}`

All controls optional within a nonempty patch. `wallMode`: `individual`, `groups`, `total`. `musicMuted` only accepts true: remote commands cannot grant browser audio permission. `matrix_configure {expected_revision:N, reset:true}` releases remote overrides; does not reset playlists. Local corner mappings and custom preview URLs remain unchanged. Shared changes apply only to mapped players assigned to the canonical playlists.

`matrix_music_next {expected_revision:N}` increments a command sequence. Open pages apply new commands once, preserving mute. A newly opened page does not replay historical skips. There is no cross-device playback clock or proof-of-play acknowledgement: `ok:true` means persisted, not rendered on a physical screen.

### Comunicación y nuevas funciones / Communication and new capabilities

Use `galaxy {element:"admira-live"}` to discover https://mcp.admira.live/mcp. With the same fleet identity and `Accept: application/json, text/event-stream`, discover `tools/list`; use `agora_decir` for messages, `agente_encargar` for authorized assignments, `encargo_estado` for tracking. Read each server's schemas instead of inventing arguments. Matrix mutations are not agent messages and do not dispatch tasks automatically. New feature requests can be assigned through that MCP and require code changes, tests and deployment.

Persistence: Cloudflare D1 `xpaceos-matrix`, single atomic revision with last 50 signed changes. Bootstrap source: xpaceos-mcp/src/matrix-defaults.mjs. UI: matrix-remote.mjs, matrix-panorama.mjs; interval 5s after each completed request (8s timeout). Offline keeps last known state; initial unavailability uses bundled playlists. No bearer secret is delivered to browsers. Black border covers capture edge without changing stored anchor coordinates.

Yokup #232. ES/EN.

## Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

[Guide](https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md)

## Layout · Device playlists

En Matrix · Starbucks, /layout activa los números y la selección de las seis pantallas y el TPV. Pulsa el dispositivo o su número para editar su playlist. Ctrl + clic, Cmd + clic en Mac o Selección múltiple permiten añadir o quitar dispositivos de la selección. Unir seleccionados les asigna una playlist común y un reloj de reproducción local. Puedes añadir vídeos por URL HTTPS directa, quitarlos, ordenarlos, guardar, usar otra playlist, separar dispositivos o restaurar su playlist original. Editar una playlist compartida afecta a todos sus miembros, indicados en el editor. Al editar una playlist original se crea una copia para los seleccionados. Los cambios del panel se guardan en este navegador; las operaciones MCP autenticadas comparten asignaciones entre clientes abiertos. Salir de /layout cierra el editor y devuelve el arrastre de cámara.

In Matrix · Starbucks, /layout enables labels and selection for the six wall screens and POS. Click the device or its number to edit its playlist. Ctrl + click, Cmd + click on Mac or Multiple selection adds/removes devices from the selection. Group selected assigns one shared playlist and a local playback clock. Add direct HTTPS video URLs, remove/reorder clips, save, use another playlist, ungroup devices or restore their original playlist. Editing a shared playlist affects every member listed in the editor. Editing a base playlist creates a copy for the selected devices. Panel edits are saved in this browser; authenticated MCP operations share assignments with open clients. Leaving /layout closes the editor and restores camera dragging.

matrix_device_layout: save_playlist {playlist_id:"playlist-local",title:"Local",tracks:[{id:"clip",title:"Promotion",url:"https://stock.admira.store/stock/ID/asset.mp4"}]}; assign {device_ids:["starbucks-wall-06","starbucks-tpv-01"],playlist_id:"playlist-local"}; reset {device_ids:[...]}; remove_playlist {playlist_id:"playlist-local"}. Every call requires action and a fresh expected_revision from matrix_state. deviceLayout contains custom playlists and assignments; deviceLayoutRevision controls delivery. Maximum 24 custom playlists, 100 clips each. Only the seven documented virtual screen IDs are supported. No physical-device publication or cross-browser playback clock.

[Guide](https://www.xpaceos.com/admira-xp/docs/device-playlists.md)

ES: En Yokup, resolve:true registra la recuperación del recurso; el cierre definitivo requiere verificación en Yokup. EN: In Yokup, resolve:true records resource recovery; final ticket closure requires verification in Yokup.

## 25 · Pixeria · Añadir vídeos por título, hashtag o número / Add videos by title, hashtag or number

ES: En Matrix, escribe /layout, pulsa una pantalla o el TPV y Añadir vídeo. En el campo Título, #hashtag o #1329 escribe el título, un hashtag exacto (por ejemplo #good) o un número de Stock (#1329 o 1329). Pulsa Enter o Buscar en Pixeria. Un número también se resuelve al salir del campo si la URL está vacía. Si hay una coincidencia exacta o única, se rellenan título y URL; si hay varias, elige una. Guarda la playlist para aplicar el borrador a los dispositivos seleccionados. Una coincidencia no inicia una emisión física. No se añade automáticamente todo un hashtag ni se crea una suscripción dinámica. La entrada manual de título y URL sigue disponible. Los vídeos duplicados se avisan sin añadir otra fila.

EN: In Matrix, enter /layout, click a screen or POS and Add video. In Title, #hashtag or #1329 enter a title, an exact hashtag (for example #good), or a Stock number (#1329 or 1329). Press Enter or Search Pixeria. A number also resolves when leaving the field if its URL is empty. An exact or unique match fills the title and URL; otherwise choose a result. Save playlist applies the draft to selected devices. Resolving content does not publish to physical devices. Hashtags do not bulk-add their contents or create a dynamic subscription. Manual title and URL entry remains available. Duplicate videos are reported without adding another entry.

### MCP y fuente / MCP and source

pixeria_search {query:"#1329",limit:20} is a public read. Accepted queries: title words (case/accent insensitive), exact hashtag, stable Stock number or asset id. Returns {query,total,items:[{id,num,title,url,tags,type,exact}]}; only published videos with direct HTTPS URLs. Default limit 20, maximum 50. Stock numbers use the catalog num field, never the position in the list. Public UI endpoint: https://mcp.admira.store/pixeria/search?query=%231329&limit=20. Upstream catalog: https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/index.json, the same public library used by Pixeria. Short cache (up to 30 seconds); failures remain visible and do not overwrite a playlist.

playlist_add {playlist:"tpv",stockId:"#1329",expected_revision:N} adds the resolved video to a shared base playlist. playlist aliases: hilo, pantallas, tpv, sincro-ia. Existing demo assets remain supported; new Pixeria lookup returns videos only. Ambiguous titles/hashtags fail with no write: use pixeria_search, select an id/number and retry with a fresh revision. Removal/reorder use IDs or Stock numbers already stored in that playlist. For a custom device playlist, read matrix_state, resolve via pixeria_search, then matrix_device_layout save_playlist with the complete ordered array of {id,title,url}; assign only the intended device_ids. Writes require each agent’s own fleet key and expected_revision. UI edits remain local; authenticated MCP changes are shared. Never put a fleet key in browser code.

Verified example: Stock #1329 = 1790711463701-yxy150, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2”. #1329 is a stable reference, not a promise that it is always the latest upload.

Docs: https://www.xpaceos.com/admira-xp/docs/pixeria-playlists.md
