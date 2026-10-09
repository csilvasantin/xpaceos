# Muffin Starbucks · Hiperreal (POS-MUFFIN-01)

ES · Muffin 3D hiperrealista del TPV del gemelo Starbucks, para los clips de Neo cogiendo productos (Unreal) y para el visor web. Referencia: el muffin fotografiado del gemelo (`admira-xp/assets/pos/muffin-reference.png`).

EN · Hyper-real 3D muffin from the Starbucks twin POS, for Neo's product pick-up clips (Unreal) and the web viewer. Reference: the photographed twin muffin.

| Archivo / File | Uso / Use | Tamaño / Size |
|---|---|---|
| `muffin.glb` | Web (texturas 1K WebP, malla al 35 %, cuantizada) | ~0,9 MB |
| `muffin-hd.glb` | Unreal / HD (bizcocho 2K horneado + normal, papel plisado con grosor) | ~7 MB |
| `muffin.blend` | Fuente (incluye la copa de alta densidad, 168k tris, origen del horneado) | ~6 MB |
| `preview/` | Render Cycles con la luz de tienda Hiperreal (comfy_cafe) y comparativa con la foto | |

- Medidas: copa Ø 9 cm, cápsula Ø 6,2 → 7,6 cm × 4,5 cm, 8,3 cm de alto. Origen en el centro de la base, +Y arriba en glTF.
- Materiales: texturas CC0 `pastry_*` de `inventario/assets/hiperreal-tex/` mezcladas por tostado (cima y crestas doradas, grietas claras, azúcar), horneadas a una copa media de 37k tris; cápsula de papel sulfurizado con `paper_orm.jpg`.
- Reconstruir / Rebuild (Blender 5.2.2, sin red):
  ```
  cd source
  blender -b --factory-startup --python build_muffin.py -- ..
  bash lod_web.sh ..
  blender -b ../muffin.blend --python render_preview.py -- ../preview/frontal.png frontal
  ```
- Pendiente (MBP16): colocarlo en la vitrina 46 de la escena Unreal de Neo y grabar el clip «Neo coge el muffin».
