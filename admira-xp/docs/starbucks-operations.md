# Demo Starbucks · Incidencias / Incidents · Navidad / Christmas · Sincro IA / AI sync

Demo Starbucks: fuera de /layout, pulsa la pantalla 1 para Desenchufar/Enchufar; queda negra y se abre una incidencia real en Yokup, cuya recuperación se comunica al enchufar. Mapear players muestra los nombres y el formulario manual de incidencias: equipo, problema y gravedad (alta por defecto). Cada ticket manual tiene un recurso único; un fallo conserva el texto para reintentar. Editor de geometría conserva el editor de esquinas. Hilo musical: Stock 1308 → 1309, EXIT avanza conservando mute. Pared normal: 1310, 1312, 1314; /navidad activa 1313, /navidad off vuelve a la programación normal. TPV: 1315 → 1317. /sincro IA usa P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322, con carga coordinada, reloj local común, bucle y vídeo silenciado. /sincro off sale de IA. Son controles de la demo virtual, no de la alimentación física.

Starbucks demo: outside /layout, click screen 1 for Unplug/Plug in; it turns black and opens a real Yokup incident, with recovery reported when plugged back in. Map players shows device names and the manual incident form: device, problem and severity (high by default). Each manual ticket has a unique resource; failures preserve the text for retry. Geometry editor retains the corner editor. Music: Stock 1308 → 1309; EXIT advances while preserving mute. Normal wall: 1310, 1312, 1314; /christmas activates 1313 and /christmas off returns to normal. POS: 1315 → 1317. /sync AI uses P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322 with a load barrier, shared local clock, looping and muted video. /sync off exits AI. These are virtual demo controls, not physical power switching.

## MCP

MCP endpoint: https://mcp.admira.store/mcp. playlist_list is public; playlist_add, playlist_remove, playlist_reorder, hotspot_bind, sincro_set, screen_unplug, screen_plug and incident_open require each agent’s own fleet key. All state writes use expected_revision from matrix_state; incident_open creates a ticket directly and does not need a state revision. Existing matrix_playlist_update accepts other published HTTPS media. playlist_add resolves other published Pixeria videos by title, exact hashtag or Stock number, including #1329; use pixeria_search to choose ambiguous matches. Never send credentials in chat or URLs.

Store: starbucks-alsea-paseo-de-gracia. Playlist aliases: hilo, pantallas, tpv, sincro-ia. position is zero-based. Every write reads the current revision first.

- playlist_list {store}
- playlist_add {store,playlist:"pantallas",stockId:1313,condition:"/navidad",position:3,expected_revision:N}
- playlist_remove {store,playlist:"tpv",stockId:1317,expected_revision:N}
- playlist_reorder {store,playlist:"hilo",order:[1308,1309],expected_revision:N}
- hotspot_bind {store,hotspot:"exit",action:"next-track",expected_revision:N}
- sincro_set {store,screens:[{screen:1,stockId:1316},{screen:2,stockId:1318},{screen:3,stockId:1319},{screen:4,stockId:1320},{screen:5,stockId:1321},{screen:6,stockId:1322}],expected_revision:N}
- matrix_configure {controls:{demoMode:"ia"},expected_revision:N}; modes: linear, christmas, ia. Configuring the six clips alone does not activate IA.
- screen_unplug {store,screen:1,expected_revision:N}; screen_plug has the same arguments.
- incident_open {store,equipo:"pantalla-1",problema:"Sin señal",gravedad:"alta"}. Devices: pantalla-1…pantalla-6, tpv. Severity: urgente, alta, normal, baja.

The six IA files are each 21.16 seconds and use a shared browser clock. The browser is not hardware genlock; decode stalls can require clock correction. Sources remain individual Stock assets, not six cropped copies of the same video. IA explicitly overrides local wall playlist assignments while active and restores them on exit. POS and music remain independent.

## Incidencias / Incidents

POST https://api.yokup.com/incident is public with CORS. Manual resource: demo:starbucks-alsea-paseo-de-gracia:<pantalla-N|tpv>:manual:<uuid>. Demo power resource: demo:starbucks-alsea-paseo-de-gracia:pantalla-N. Unique manual UUIDs prevent collision with the unplug demonstration.

Payload includes subject, resource, kind=screen, severity, source=xpaceos-manual or xpaceos-demo, project_id=xpaceos, loc=Starbucks Alsea · Paseo de Gracia 103, detail and by=XpaceOS Matrix. Plug sends resolve:true with the same demo resource. Success displays the returned INC id and https://www.yokup.com/incidencias. No automatic fault detection is implied.

UI power state is stored locally; MCP power changes are shared via devicesOff and devicesOffRevision. A remote revision conflict after a Yokup request is not a physical acknowledgement: read fresh state and retry (the stable demo resource prevents duplicate active tickets).

## Catálogo / Catalog

Canonical assets: starbucks-demo.mjs. Published contracts: starbucks-playlist.json, starbucks-screen-playlist.json, starbucks-tpv-playlist.json. Current edited state: https://mcp.admira.store/matrix/starbucks. Geometric mapping retains its calibrated seed URL; runtime media comes from the playlist assignment.

ES: En Yokup, resolve:true registra la recuperación del recurso; el cierre definitivo requiere verificación en Yokup. EN: In Yokup, resolve:true records resource recovery; final ticket closure requires verification in Yokup.
