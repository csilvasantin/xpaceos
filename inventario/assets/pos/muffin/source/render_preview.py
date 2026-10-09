"""Render Cycles del muffin con la luz de tienda Hiperreal (comfy_cafe). blender -b muffin.blend --python render_preview.py -- OUT.png [frontal|tres-cuartos]"""
import bpy, sys, os, math
from mathutils import Vector
argv=sys.argv[sys.argv.index('--')+1:]; OUT=argv[0]; view=argv[1] if len(argv)>1 else 'frontal'
HERE=os.path.dirname(os.path.abspath(__file__)); HDR=os.path.abspath(os.path.join(HERE,'../../../catalog/47/hiperreal/comfy_cafe_1k.hdr'))
B=bpy.data; sc=bpy.context.scene
w=B.worlds.new('tienda'); sc.world=w; w.use_nodes=True; nt=w.node_tree; env=nt.nodes.new('ShaderNodeTexEnvironment'); env.image=B.images.load(HDR)
bg=nt.nodes['Background']; bg.inputs['Strength'].default_value=0.55; nt.links.new(env.outputs['Color'],bg.inputs['Color'])
# balda de vitrina (vidrio esmerilado claro) y fondo cálido desenfocado
bpy.ops.mesh.primitive_plane_add(size=0.6,location=(0,0,0)); sh=bpy.context.active_object
m=B.materials.new('balda'); m.use_nodes=True; p=m.node_tree.nodes['Principled BSDF']; p.inputs['Base Color'].default_value=(0.55,0.55,0.53,1); p.inputs['Roughness'].default_value=.25; sh.data.materials.append(m)
bpy.ops.mesh.primitive_plane_add(size=0.6,location=(0,0.16,0.15),rotation=(math.radians(90),0,0)); wall=bpy.context.active_object
m2=B.materials.new('fondo'); m2.use_nodes=True; p2=m2.node_tree.nodes['Principled BSDF']; p2.inputs['Base Color'].default_value=(0.32,0.25,0.18,1); p2.inputs['Roughness'].default_value=.8; wall.data.materials.append(m2)
# luz cálida de vitrina desde arriba
ld=B.lights.new('vitrina','AREA'); ld.energy=2.5; ld.size=0.25; ld.color=(1,0.93,0.82); lo=B.objects.new('vitrina',ld); sc.collection.objects.link(lo); lo.location=(0,-0.05,0.32)
cd=B.cameras.new('cam'); cd.lens=85; cam=B.objects.new('cam',cd); sc.collection.objects.link(cam)
pos={'frontal':(0,-0.42,0.13),'tres-cuartos':(0.24,-0.30,0.24)}[view]
cam.location=pos; cam.rotation_euler=(Vector((0,0,0.04))-Vector(pos)).to_track_quat('-Z','Y').to_euler()
cd.dof.use_dof=True; cd.dof.focus_distance=(Vector(pos)-Vector((0,0,0.04))).length; cd.dof.aperture_fstop=5.6
sc.camera=cam; sc.render.engine='CYCLES'; cy=sc.cycles; cy.device='CPU'; cy.samples=96; cy.use_denoising=True
sc.render.resolution_x=sc.render.resolution_y=900; sc.view_settings.view_transform='Standard'; sc.view_settings.exposure=-0.4; sc.render.filepath=OUT
sc.render.threads_mode='FIXED'; sc.render.threads=8
bpy.ops.render.render(write_still=True); print('RENDERED',OUT,flush=True)
