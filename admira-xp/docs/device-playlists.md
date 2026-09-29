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
