# Xtanco Better / Best renderer

`premium-renderer.mjs` provides a presentation of the existing Xtanco state. It owns no simulation, traffic counts, media playback, capture permissions, or animation loop.

```js
import {createPremiumRenderer} from './premium-renderer.mjs';
const view=createPremiumRenderer({
  canvas,
  mode:'best', // 'better' changes materials and edge visibility on the same graph
  getPlayer:()=>window.__xtoreWindowPlayer
});
view.update({cols:14,rows:8,wallHeight:3.25,layout:shopLayout,actors:[],doorOpen:0});
view.resize(1000,650,devicePixelRatio);
view.render(performance.now());
view.setMode('better');
view.fit();
view.dispose();
```

The owner calls `update` and `render`, ideally at most 30 times per second while visible. `resize` ignores unchanged dimensions. Closing the view disposes its GPU objects and event handlers; it does not stop the shared source. Reopening creates a new renderer on the same canvas without forcing context loss.

The snapshot uses grid units: furniture has its existing `id/type/col/row/sx/sy/rot/flipX`; optional custom `fp` is a footprint pair, and `ph` is height in world units. Furniture decoration is procedural, with no external assets. Actor input is `{id,col,row,kind,color,skin,heading,walking}`. `heading` is radians. The caller converts existing projected actor foot positions using `actorGridPosition` from `premium-model.mjs`. For the current isometric projection, `elevation = atan(sqrt(2) * tileH / tileW)` and `wallHeight = wallH / (tileW / sqrt(2) * cos(elevation))` preserve architectural proportions.

The renderer keeps stable actor nodes, rebuilding architecture only when layout or room dimensions change. A mode switch preserves object identities. Both modes use the same scene graph, camera, transforms and shared signage texture. Dragging horizontally changes the viewing angle; the wheel changes zoom. `fit()` restores the initial angle and fitted view.

All connected screen surfaces reference one CanvasTexture. It samples the existing player's `draw(ctx,width,height)` at most 15 times per second; no additional video element, audio or getDisplayMedia call is created. When no source exists, an ADMIRA placeholder is drawn. The scene does not invent audience or exterior statistics.

Best uses standard roughness/metalness materials, hemisphere and directional lighting, and soft shadow maps. Better uses dark surface fills and cyan edge geometry; signage remains readable. Interior/exterior geometry is a procedural architectural interpretation of the active layout, not a measured scan or imported Blender scene.

Three.js 0.160.0 is vendored locally in `premium-three.mjs`, matching the existing scan viewers' pinned version. The MIT license is included in `premium-three.LICENSE`. There are no runtime CDN imports or model downloads. The version is intentionally pinned; an upgrade should include visual regression testing.

Run the offline contract/resource tests with:

```sh
node --test admira-xp/scripts/premium-scene.test.mjs
```

They verify shared object identity across modes, snapshot immutability, actor updates, a single shared media texture, transient resource disposal under layout/actor churn, coordinate conversion and invalid-input bounds. Actual lighting, clipping and WebGL availability also require browser visual review.
