#!/usr/bin/env bash
# LOD web: texturas a 1K + WebP q84, malla simplificada al 35 % y cuantizada (mismo criterio que admira-xp/tools/hiperreal/lod.sh)
set -euo pipefail; GT=${GT:-/workspace/hiperreal47/tools/node_modules/.bin/gltf-transform}
d=${1:-..}; t=$(mktemp -d)
$GT dedup $d/muffin-hd.glb $t/a.glb >/dev/null
$GT resize $t/a.glb $t/b.glb --width 1024 --height 1024 >/dev/null
$GT simplify $t/b.glb $t/c.glb --ratio 0.35 --error 0.0004 >/dev/null
$GT webp $t/c.glb $t/d.glb --quality 84 >/dev/null
$GT quantize $t/d.glb $d/muffin.glb >/dev/null
rm -rf $t; echo "web=$(stat -c %s $d/muffin.glb) hd=$(stat -c %s $d/muffin-hd.glb)"
