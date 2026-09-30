# Distribuir / Distribute · Better · 16 bits

## Español

En Modo Experto ejecuta /cli distribuir; en inglés, /cli distribute. Distribuir / Distribute abre Better · 16 bits. Selecciona un mueble en la escena o en la lista. Arrastra por el suelo o mueve ¼ de casilla con las flechas; Columna/Fila + Mover aplica un desplazamiento recto. Girar ↶/↷ aplica 90° sobre el origen del mueble. Escala permite 25–300% con −/+, un porcentaje y Enter; mantiene las proporciones de altura y suelo. Se valida la huella completa, el perímetro, otros muebles y el recorrido, incluido el espacio barrido durante el giro. Un intento bloqueado conserva la transformación anterior. El mapa de dureza muestra perímetro y huellas. Mover, girar y escalar se guardan en este navegador y admiten Deshacer (hasta 50 cambios mientras el editor siga abierto). Recargar conserva posición, giro y escala; reinicia Deshacer. Escape cancela un arrastre pendiente o cierra; Mayús + arrastre mueve la cámara. /distribuir off cierra. La simulación se pausa al editar y recupera su estado anterior al cerrar. Elementos montados y bloqueados, incluido el pilar de Starbucks, quedan fijos. El alias anterior /cli distribuit sigue funcionando. Sin herramienta MCP remota nueva.

1. Abre [Cafebrería](https://www.xpaceos.com/admira-xp/?autostart=cafeteria&quality=better), [Xtanco](https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=better) o [Starbucks](https://www.xpaceos.com/admira-xp/?loc=alsea-sbux-021&quality=better).
2. En Experto escribe `/cli distribuir` y pulsa Enviar/Enter. Selecciona el mueble.
3. Arrastra, gira 90° con ↶/↷ o cambia Escala. El giro usa el origen del mueble: si falta espacio libre, mueve primero el mueble. La escala modifica por igual suelo y altura, conservando su proporción original.
4. Cada cambio válido se guarda. Deshacer restaura movimiento, giro o escala. Si el espacio cambia durante el guardado, se rechaza; si falla el almacenamiento, se recupera la distribución anterior.
5. Pulsa × o `/distribuir off`. Si estabas jugando, se reanuda; si estabas en pausa, permanece en pausa.

## English

In Expert mode run /cli distribute (Spanish: /cli distribuir). Distribute / Distribuir opens Better · 16 bits. Select furniture in the scene or list. Drag along the floor or move ¼ tile with arrow keys; Column/Row + Move applies a straight move. Rotate ↶/↷ turns 90° around the furniture origin. Scale accepts 25–300% using −/+, a percentage and Enter; it preserves height-to-floor proportions. The full footprint, room boundary, other furniture and path are checked, including the area swept during rotation. Blocked attempts retain the previous transform. The hardness map shows the perimeter and footprints. Move, rotate and scale save in this browser and support Undo (up to 50 changes while the editor is open). Reload retains position, rotation and scale but clears Undo history. Escape cancels a pending drag or closes; Shift + drag moves the camera. /distribute off closes. Simulation pauses during editing and restores its previous state on exit. Mounted and locked items, including the Starbucks pillar, remain fixed. The legacy /cli distribuit alias still works. No new remote MCP tool.

1. Open Cafebrería, Xtanco or Starbucks using the stable links above.
2. In Expert type `/cli distribute` and press Send/Enter. Select the furniture.
3. Drag, rotate 90° with ↶/↷ or change Scale. Rotation uses the layout origin; move into a clear area first when needed. Scaling multiplies floor and height dimensions by the same factor, preserving the original proportions.
4. Each valid change saves. Undo restores a move, rotation or scale. A changed venue or source transform rejects stale saves; storage failures roll back the layout.
5. Close with × or `/distribute off`. Running simulation resumes; paused simulation remains paused.

## Shared contract / Contrato compartido

- Browser-local virtual layout; no physical-device action or new remote MCP tool. MCP help: https://mcp.admira.store/help (topic distribuir or distribute).
- Stable inventory/layout IDs, current/backup/schema storage per Xpacio, existing removal tombstones. Legacy `distribuit` command and JSON contract ID are retained for compatibility; visible names are Distribuir/Distribute.
- Source: `window.__xtancoFurnitureEditor` in `admira-xp/index.html`. Private preview; revalidation of every path segment and all source pose fields before an atomic commit. Saves col, row, rot, sx, sy.
- Geometry: floor footprints include fp, horizontal sx, quarter-turn rot and flipX; sy changes height. Main walk grid and Better customer navigation respect those transforms. Rugs are walkable. Mounted/locked items cannot move, rotate or scale.
- Collision: full footprint inside room, no interior overlap with other solid footprints or fixed hardness. Edge contact is allowed. Translation uses a swept check; rotation checks analytical corner extrema and conservative subdivided intervals between its endpoints. It can reject a very close rotational clearance to remain safe. Legacy overlap can escape outward to a clear position.
- Scale range 0.25–3 (25–300%); height changes proportionally to the existing sx/sy ratio. Rotation steps 90° about the saved layout origin. Move/rotate/scale are separate gestures and can be undone in reverse order; at most 50 completed gestures while open.
- A blocked drag retains the last valid pose; release saves it. Escape/pointer cancellation discards the unfinished gesture. A blocked rotate/scale leaves the saved transform unchanged.
- Starbucks Better/Best groups and Good parts share the same origin, rotation, mirror and scales. Starbucks storage remains separate (`starbucks_pg103_v1`). Its scene is an interpretive reconstruction, not a metric floor plan.
- Translation reuses models; shape changes rebuild owned geometry without starting a second simulation. Closing/disposal releases editor inputs and restores the previous simulation state.
- Dependencies: WebGL, Pointer Events and writable localStorage.
- Delivered: selection, drag, quarter-tile moves, coordinate moves, rotation, proportional scale, collision/path checks, map, save, undo, close, ES/EN help.
- Pending: replacement/import controls inside this editor, cross-browser/shared MCP editing and a measured 3D survey.

## Verification / Verificación

Tests cover intermediate rotation bounds and collisions, mirrored/scaled footprints, valid free rotation, percentage limits, floor grid parity, full-pose persistence, stale-save rejection, storage rollback, reverse undo and Starbucks Good/Better transform parity. Browser verification covers commands, rotation, scale, blocked collisions, undo and reload in Cafebrería. Tests only modify virtual layouts.
