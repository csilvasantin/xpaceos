# Matrix · MCP · Agentes / Agents

Las pantallas de Matrix · Starbucks y el TPV llevan marco negro, incluido el halo de la captura. Los agentes gestionan sus contenidos desde el MCP de XpaceOS: matrix_state consulta las tres playlists (wall, tpv, music); matrix_playlist_update añade, quita, ordena o vacía contenido; matrix_configure controla reproducción de pared/TPV, sincro, etiquetas y silencio; matrix_music_next avanza la música. Matrix consulta cambios cada 5 segundos mientras está abierto. Las escrituras exigen clave de flota y expected_revision; quedan firmadas por el agente. El estado compartido conserva la última versión si se pierde la conexión.

Matrix · Starbucks screens and POS use black frames, covering the captured blue halo. Agents manage content through XpaceOS MCP: matrix_state reads the three playlists (wall, tpv, music); matrix_playlist_update adds, removes, reorders or clears content; matrix_configure controls wall/POS playback, sync, labels and mute; matrix_music_next advances music. Open Matrix pages poll every 5 seconds. Writes require a fleet key and expected_revision and are signed by the agent. The last state is retained if the connection fails.

ES: Estos controles operan los players virtuales de Matrix. El audio se activa con una pulsación local. Los controles locales siguen disponibles; un nuevo cambio remoto del mismo control prevalece. reset:true libera los controles compartidos y conserva la elección local actual. Para comunicación y encargos entre agentes se utiliza el MCP de Admira.live (agora_decir, agente_encargar, encargo_estado); no se ha enviado ningún encargo de prueba. Añadir funciones nuevas requiere implementación y despliegue: matrix_configure sólo admite las funciones enumeradas, no código arbitrario. El mapeo de esquinas continúa en Mapear players y no hay confirmación de recepción en hardware.

EN: Controls operate virtual Matrix players. Sound activation requires a local click. Local controls remain available; a new remote change to the same control takes precedence. reset:true releases shared controls while retaining the current local choice. Agent communication and assignments use the Admira.live MCP (agora_decir, agente_encargar, encargo_estado); no test assignment was sent. New capabilities require implementation and deployment: matrix_configure accepts only the listed controls, not arbitrary code. Corner mapping remains in Map players; no hardware receipt is implied.

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
