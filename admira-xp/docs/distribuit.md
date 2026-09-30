# Distribuit · Better · 16 bits

## Español

En Modo Experto ejecuta /cli distribuit (también distribuit o /distribuit). Se abre Better · 16 bits con el editor. Selecciona un mueble en la escena o en la lista y arrástralo por el suelo; las flechas y los botones mueven ¼ de casilla. Columna/Fila + Mover aplica un desplazamiento recto. El mapa de dureza muestra el perímetro y las huellas ocupadas. Se comprueba la huella completa, escala horizontal, giro y espejo, además del recorrido: no permite salir del espacio, ocupar otro mueble ni atravesarlo. Verde indica una posición válida; rojo indica un intento bloqueado. Al soltar se guarda en este navegador; Deshacer recorre el camino inverso. Escape cancela el arrastre pendiente o cierra el editor. Mayús + arrastre mueve la cámara. /distribuit off cierra. La simulación se pausa mientras se edita y recupera su estado anterior al cerrar. Las paredes, pantallas montadas y el pilar de Starbucks quedan fijos. Better también está disponible en Cafebrería con mesas, libros y sofá.

1. Abre un Xpacio: [Cafebrería](https://www.xpaceos.com/admira-xp/?autostart=cafeteria&quality=better), [Xtanco](https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=better) o [Starbucks](https://www.xpaceos.com/admira-xp/?loc=alsea-sbux-021&quality=better).
2. En Experto escribe `/cli distribuit` y pulsa Enviar/Enter.
3. Selecciona un mueble; arrástralo por el suelo o usa las flechas. Si se bloquea, sigue un recorrido libre rodeando el obstáculo. No atraviesa muebles aunque el puntero salte directamente al otro lado.
4. Suelta para guardar. Deshacer restaura el movimiento anterior; el historial (máximo 50) dura mientras el editor está abierto. Recargar conserva la distribución y los cuartos de casilla, pero reinicia ese historial.
5. Pulsa × o `/distribuit off` para volver a explorar Better. Si estabas jugando, se reanuda; si estabas en pausa, permanece en pausa.

## English

In Expert mode run /cli distribuit (also distribuit, /distribuit or /cli distribute). Better · 16 bits opens with the editor. Select furniture in the scene or list and drag it along the floor; arrow keys and buttons move ¼ tile. Column/Row + Move applies a straight move. The hardness map shows the perimeter and occupied footprints. The full footprint, horizontal scale, rotation and mirror are checked along with the path: furniture cannot leave the space, overlap another piece or pass through it. Green means a valid position; red means a blocked attempt. Release to save in this browser; Undo follows the reverse path. Escape cancels the pending drag or closes the editor. Shift + drag moves the camera. /distribuit off closes it. Simulation is paused during editing and its previous state is restored on exit. Walls, mounted screens and the Starbucks pillar remain fixed. Better is also available in Cafebrería with tables, books and seating.

1. Open Cafebrería, Xtanco or Starbucks using the stable links above.
2. In Expert, type `/cli distribuit` and press Send/Enter.
3. Select furniture and drag it or use arrow keys. Follow a clear path around obstacles; a pointer jump cannot cross furniture.
4. Release to save. Undo restores the previous move; up to 50 completed moves are kept while the editor remains open. Reload preserves the layout and quarter-tile positions, but resets undo history.
5. Close with × or `/distribuit off`. A previously running simulation resumes; a previously paused one remains paused.

## Shared contract / Contrato compartido

- Scope: virtual furniture positions in this browser; no physical-device action and no new remote MCP tool. MCP help: https://mcp.admira.store/help (topic Distribuit).
- IDs: original inventory/layout IDs; labels are informational. Venue binding prevents a delayed save from modifying another Xpacio. Existing inventory tombstones are retained.
- Source: `window.__xtancoFurnitureEditor` in `admira-xp/index.html`. The controller previews a separate snapshot; it revalidates all accepted path segments against the current layout before committing.
- Geometry: `scripts/furniture-geometry.mjs`, shared by customer navigation and Distribuit. Floor footprints respect `fp`, `sx`, `rot`, `flipX`; `sy` changes height only. Rugs are walkable. Mounted/locked items cannot move.
- Hardness: room perimeter, solid furniture footprints and fixed blocked cells. Edge contact is allowed; interior overlap is rejected. An already intersecting legacy item can escape outward to a clear position, but cannot move deeper through its neighbour.
- Persistence: existing current/backup/schema keys returned by `getLayoutSlotKeys(getLayoutStoragePrefix())`; atomic storage writes with rollback on failure. Starbucks retains its separate `starbucks_pg103_v1` prefix.
- Preview stays at the last valid position on a rejected drag. A release saves that last valid position. Escape/pointer cancellation discards the unfinished gesture. Closing/switching/disposal releases editor inputs and restores the simulation state.
- Translation does not rebuild furniture models or reload assets on every drag. Actor simulation is not duplicated.
- Dependencies: WebGL, Pointer Events and writable localStorage. A failed save restores the previous source layout and reports the error.
- Delivered: selection, dragging, quarter-tile steps, coordinate moves, collision/path checks, map overlay, save, undo, close and ES/EN help.
- Pending: rotation/scaling/replacement/import controls inside Distribuit, shared remote editing and a measured 3D survey. Starbucks is an interpretive reconstruction, not a metric floor plan.

## Verification / Verificación

Node tests cover rotated/mirrored/scaled footprints, full-floor bounds, destination and swept collisions, fixed hardness, safe escape, routed undo, private preview, concurrent gestures, room changes, save rollback, real layout reload, stable scene resources and Starbucks absolute fixtures. Browser verification covers CLI opening, actual table dragging, blocked overlap/bounds, undo and fractional-coordinate persistence after reload in Cafebrería, plus opening in Xtanco. Tests use virtual layouts only.
