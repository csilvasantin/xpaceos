# El Xtanco · immersive 3D

Open `/admira-xp/?autostart=xtanco&visual=better` or choose **Expert (⌘) → Better**. The homepage's **Try the twin** uses this entry; `visual=life` remains an alias. Escape / **Volver al gemelo** returns to Good and its operational tools without starting another game. There is no separate top-bar 3D launcher.

This is a stylized, procedural representation of the running layout, not a scan or a claim of photorealism. Customers are the existing game actors, not newly inferred camera detections. Camera-owned exterior traffic is not replaced with synthetic pedestrians.

## Ownership

- `life-snapshot.mjs` reads `__xtancoVisualState()`: layout, actors, palette, movement and existing counters. Stable actor identities, explicit palette conversion, no writes to simulation.
- `life-scene.mjs` builds beveled furniture, textured surfaces, articulated characters and three lighting moods. It owns geometry/materials/textures, not a clock or network. Positions interpolate over 100 ms visually; source positions remain intact.
- `life-renderer.mjs` owns the local Three.js renderer, orthographic camera, pointer/pinch/keyboard camera actions and selection. Render is driven by the UI. Scene disposal releases GPU resources.
- `life-ui.mjs` opens an isolated native modal, reads state at 10 Hz and renders while visible. It dynamically loads Three.js only on launch. It closes if the current game state can no longer be represented. `__xtancoReleaseInputs()` releases held gameplay keys when entering the modal.

The public tiers are **Good = classic**, **Better = this immersive 3D**, **Best = photorealistic, in preparation**. `xtanco-visual-tiers.mjs` owns routing and the versioned preference `xtanco_visual_tier_v2`; the old wireframe/hybrid preference is not migrated to an unrelated tier. `__xtancoPremiumView` remains a compatibility façade with no composition, keeping original operation callbacks intact. Legacy `data-xtanco-visual` stays `good` so camera traffic cannot acquire the old wireframe style; the public tier uses `data-xtanco-tier`.

Editor, live player, CLI and control panels remain available in Good. All immersive digital screens sample one shared canvas via the existing `__xtoreWindowPlayer.draw()` source. No extra video, stream, iframe or simulation is created by this view. Audio, measurement and operational interactions remain owned by the original game. Best's asset pipeline and pending real-world references are described in [best-production.md](./best-production.md).

## Controls

Drag to orbit the cutaway, Shift+drag / right-drag to pan, wheel or pinch to zoom. Select objects or people to inspect existing labels. Camera presets: isometric, floor plan and detail. Keyboard on the canvas: left/right arrows, +/− and Home; Escape closes. Day / sunset / night changes presentation lighting only, never physical lights or the game clock.

## Checks

`node --test admira-xp/scripts/life-*.test.mjs homepage-twin-cta.test.mjs`

Browser QA: direct entry, furniture selection, camera presets, lighting, portrait layout, close/reopen and failure fallback. Check the preserved premium/controller/operations suite before publishing. WebGL is required; if it cannot start, the modal offers retry or return to the existing game.
