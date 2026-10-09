"""Muffin Hiperreal (XpaceOS · demos de Neo en Starbucks). Blender 5.2.2, sin red.
blender -b --factory-startup --python build_muffin.py -- OUTDIR
Genera muffin.blend, muffin-hd.glb (Unreal) y muffin-web-src.glb (para lod web).
Medidas (m): cápsula Ø 6,2 cm abajo → Ø 7,6 cm arriba, 4,5 cm de alto, 40 pliegues;
copa Ø 9 cm, 3,8 cm por encima del borde → 8,3 cm en total. Origen en el centro de la base.
"""
import bpy, bmesh, math, os, sys, random
from mathutils import Vector, noise
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=os.path.abspath(argv[0] if argv else '.'); os.makedirs(OUT,exist_ok=True)
HERE=os.path.dirname(os.path.abspath(__file__))
TEX=os.path.abspath(os.path.join(HERE,'../../../hiperreal-tex'))+'/'
bpy.ops.wm.read_factory_settings(use_empty=True)
B=bpy.data; sc=bpy.context.scene
random.seed(7)
RB,RT,HC=0.031,0.038,0.045      # cápsula
NP=40; PLEAT=0.0011             # pliegues
RCAP,HDOME=0.045,0.038          # copa
def pleat(th):                  # onda triangular 0..1
    x=(th*NP/(2*math.pi))%1.0; return 1-abs(2*x-1)
def link(ob): sc.collection.objects.link(ob); return ob
def mesh_from(name,verts,faces,uvs=None):
    me=B.meshes.new(name); me.from_pydata(verts,[],faces); me.update()
    if uvs:
        uv=me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            for li,vi in zip(poly.loop_indices,poly.vertices): uv.data[li].uv=uvs[vi]
    for p in me.polygons: p.use_smooth=True
    return link(B.objects.new(name,me))

# ---------- cápsula de papel plisada (UV cilíndrica) ----------
SEG=NP*10; RINGS=28
verts=[];uvs=[];faces=[]
for j in range(RINGS+1):
    v=j/RINGS; z=v*HC; flare=(v**3)*0.0016   # ligera apertura del borde
    for i in range(SEG+1):
        th=2*math.pi*i/SEG; r=RB+(RT-RB)*v+flare+PLEAT*(pleat(th)-.5)*(0.35+0.65*v)
        verts.append((r*math.cos(th),r*math.sin(th),z)); uvs.append((i/SEG,0.25+0.75*v))
for j in range(RINGS):
    for i in range(SEG):
        a=j*(SEG+1)+i; faces.append((a,a+1,a+SEG+2,a+SEG+1))
c=len(verts); verts.append((0,0,0)); uvs.append((0.5,0.12))
for i in range(SEG):   # fondo
    faces.append((c,i+1,i)); 
for i in range(SEG+1):
    th=2*math.pi*i/SEG; uvs[i]=(i/SEG,0.25)
liner=mesh_from('Muffin_Capsula',verts,faces,uvs)
sol=liner.modifiers.new('grosor','SOLIDIFY'); sol.thickness=0.00035; sol.offset=1

# ---------- copa: perfil girado + desplazamiento ----------
# perfil (r,z) desde dentro de la cápsula, vuelo y cúpula
prof=[(RB-0.0006,0.0015),(RT-0.0008,HC-0.002),(RT+0.0005,HC+0.0012),(RCAP-0.003,HC+0.0035),(RCAP,HC+0.0085),
      (RCAP-0.0015,HC+0.015),(RCAP-0.006,HC+0.023),(0.032,HC+0.029),(0.022,HC+0.0345),(0.011,HC+0.0372),(0.0,HC+HDOME)]
def resample(pts,n):
    L=[0]
    for a,b in zip(pts,pts[1:]): L.append(L[-1]+math.dist(a,b))
    out=[]
    for k in range(n+1):
        s=L[-1]*k/n; i=max(0,min(len(pts)-2,next(i for i in range(len(L)-1) if L[i+1]>=s-1e-12)))
        t=(s-L[i])/max(L[i+1]-L[i],1e-9); a,b=pts[i],pts[i+1]
        out.append((a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))
    return out
# suavizar con Chaikin
for _ in range(3):
    q=[prof[0]]
    for a,b in zip(prof,prof[1:]): q+=[(a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25),(a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75)]
    q.append(prof[-1]); prof=q
NT=200; NS=420
P=resample(prof,NT)
from mathutils import kdtree
CR=[]
for n in range(110):
    th=random.uniform(0,2*math.pi); rho=RCAP*0.84*math.sqrt(random.random())
    CR.append((rho*math.cos(th),rho*math.sin(th),random.uniform(0.0012,0.0026),random.uniform(0.4,0.8)))
KD=kdtree.KDTree(len(CR))
for k,(x,y,r,h) in enumerate(CR): KD.insert((x,y,0),k)
KD.balance()
def crumb(x,y):
    best=0.0
    for (co,k,dist) in KD.find_range((x,y,0),0.0035):
        cx,cy,r,h=CR[k]; d=math.hypot(x-cx,y-cy)/r
        if d<1: best=max(best,h*(1-d*d)**0.6)
    return best
def disp(x,y,z,u):
    """u: 0 (dentro de la cápsula) → 1 (cima). Grietas y lóbulos arriba, migas finas en toda la copa."""
    if u<0.13: return 0.0
    top=min(1,(u-0.13)/0.25)*max(0.0,min(1.0,(z-HC-0.0015)/0.004))   # nada dentro de la cápsula
    p=Vector((x,y,z))*60
    vor=noise.voronoi(p*0.55,distance_metric='DISTANCE')[0]  # distancias a celdas
    d1,d2=vor[0],vor[1]
    crack=max(0.0,1-(d2-d1)*4.2)**3                            # grieta entre lóbulos (pocas y finas)
    lump=noise.fractal(p*0.9,0.6,2.0,4,noise_basis='PERLIN_ORIGINAL')
    fine=noise.fractal(p*4.0,0.7,2.1,4,noise_basis='PERLIN_ORIGINAL')
    pores=noise.voronoi(p*7.5,distance_metric='DISTANCE')[0][0]
    cb=crumb(x,y)*top
    return top*(0.0018*lump-0.0022*crack)+top*0.00055*fine-top*0.00045*max(0,.32-pores)*3+0.0019*cb
V=[];F=[];U=[]
for j,(r,z) in enumerate(P):
    u=j/NT
    for i in range(NS):
        th=2*math.pi*i/NS
        # el batido toma la forma plisada dentro de la cápsula
        rr=r+(PLEAT*(pleat(th)-.5)*0.6 if z<HC-0.001 else 0)
        V.append([rr*math.cos(th),rr*math.sin(th),z]); U.append(u)
# normales del perfil para desplazar
def pnorm(j):
    a=P[max(0,j-1)];b=P[min(NT,j+1)]; dr,dz=b[0]-a[0],b[1]-a[1]; n=Vector((dz,-dr)).normalized(); return n if n.x>=0 or j>NT-3 else -n
for j in range(NT+1):
    nr,nz=pnorm(j); 
    if j==NT: nr,nz=0,1
    for i in range(NS):
        k=j*NS+i; x,y,z=V[k]; th=2*math.pi*i/NS; d=disp(x,y,z,U[k])
        V[k]=(x+math.cos(th)*nr*d,y+math.sin(th)*nr*d,z+nz*d)
for j in range(NT):
    for i in range(NS):
        a=j*NS+i;b=j*NS+(i+1)%NS; F.append((a,b,b+NS,a+NS))
top=len(V); V.append((0,0,P[-1][1]+disp(0,0,P[-1][1],1.0)))
for i in range(NS): F.append((NT*NS+i,NT*NS+(i+1)%NS,top))
U.append(1.0)
# UV en disco (azimutal equidistante desde la cima): sin costuras ni polo estirado
SL=[0.0]*(NT+1)
for j in range(NT-1,-1,-1): SL[j]=SL[j+1]+math.dist(P[j],P[j+1])
UV=[]
for j in range(NT+1):
    rho=0.49*SL[j]/SL[0]
    for i in range(NS):
        th=2*math.pi*i/NS; UV.append((0.5+rho*math.cos(th),0.5+rho*math.sin(th)))
UV.append((0.5,0.5))
cap=mesh_from('Muffin_Copa_HD',V,F,UV)
# tostado por vértice: cima y crestas más doradas, grietas y bajo el vuelo más claros
col=cap.data.color_attributes.new('tostado','FLOAT_COLOR','POINT')
for k,v in enumerate(cap.data.vertices):
    x,y,z=v.co; u=U[k] if k<len(U) else 1.0
    p=Vector((x,y,z))*60; vor=noise.voronoi(p*0.55,distance_metric='DISTANCE')[0]
    crack=max(0.0,1-(vor[1]-vor[0])*4.2)**3
    b=max(0,min(1,(z-HC)/HDOME))**0.7*0.85+0.15*noise.fractal(p*1.7,0.6,2,3)
    b=max(0,min(1,b*(1-0.75*crack)))
    if z<HC+0.009 and math.hypot(x,y)<RCAP-0.004: b*=0.35   # bajo el vuelo
    cb=crumb(x,y) if z>HC+0.004 else 0.0
    col.data[k].color=(b,crack,min(1,cb*1.6),1)

# ---------- materiales ----------
def img(name,cs='sRGB'):
    i=B.images.load(TEX+name,check_existing=True); i.colorspace_settings.name=cs; return i
def principled(mat):
    mat.use_nodes=True; nt=mat.node_tree; bs=nt.nodes['Principled BSDF']; return nt,bs
hi=B.materials.new('Bizcocho_procedural'); nt,bs=principled(hi)
tc=nt.nodes.new('ShaderNodeTexCoord')
def boxtex(name,cs='sRGB',scale=3.0):
    # mismas UV en disco que la copa media: sin costuras de proyección
    m=nt.nodes.new('ShaderNodeMapping'); m.inputs['Scale'].default_value=(scale,scale,scale); nt.links.new(tc.outputs['UV'],m.inputs['Vector'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(name,cs); t.extension='REPEAT'; nt.links.new(m.outputs['Vector'],t.inputs['Vector']); return t
light=boxtex('pastry_ca9852_1024.jpg'); gold=boxtex('pastry_b8783c_1024.jpg',scale=2.6); brown=boxtex('pastry_754f36_1024.jpg',scale=2.2)
attr=nt.nodes.new('ShaderNodeVertexColor'); attr.layer_name='tostado'; sep=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(attr.outputs['Color'],sep.inputs['Color'])
def mix(a,b,fac):
    m=nt.nodes.new('ShaderNodeMix'); m.data_type='RGBA'; nt.links.new(fac,m.inputs[0]); nt.links.new(a,m.inputs[6]); nt.links.new(b,m.inputs[7]); return m.outputs[2]
ramp1=nt.nodes.new('ShaderNodeMapRange'); nt.links.new(sep.outputs['Red'],ramp1.inputs['Value']); ramp1.inputs['From Min'].default_value=0.0; ramp1.inputs['From Max'].default_value=0.55
ramp2=nt.nodes.new('ShaderNodeMapRange'); nt.links.new(sep.outputs['Red'],ramp2.inputs['Value']); ramp2.inputs['From Min'].default_value=0.62; ramp2.inputs['From Max'].default_value=1.25
c1=mix(light.outputs['Color'],gold.outputs['Color'],ramp1.outputs['Result'])
c2=mix(c1,brown.outputs['Color'],ramp2.outputs['Result'])
sugar=nt.nodes.new('ShaderNodeRGB'); sugar.outputs[0].default_value=(0.62,0.40,0.16,1)
c3=mix(c2,sugar.outputs[0],sep.outputs['Blue'])
nt.links.new(c3,bs.inputs['Base Color']); bs.inputs['Roughness'].default_value=.72
cap.data.materials.append(hi)
# cápsula: papel sulfurizado gris perla con manchas de mantequilla
pm=B.materials.new('Papel_procedural'); nt,bs=principled(pm)
tcp=nt.nodes.new('ShaderNodeTexCoord'); nz=nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=9; nz.inputs['Detail'].default_value=6
nt.links.new(tcp.outputs['Object'],nz.inputs['Vector'])
mr=nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value=.52; mr.inputs['From Max'].default_value=.7; nt.links.new(nz.outputs['Fac'],mr.inputs['Value'])
base=nt.nodes.new('ShaderNodeRGB'); base.outputs[0].default_value=(0.42,0.41,0.39,1)
grease=nt.nodes.new('ShaderNodeRGB'); grease.outputs[0].default_value=(0.47,0.40,0.29,1)
m=nt.nodes.new('ShaderNodeMix'); m.data_type='RGBA'; nt.links.new(mr.outputs['Result'],m.inputs[0]); nt.links.new(base.outputs[0],m.inputs[6]); nt.links.new(grease.outputs[0],m.inputs[7])
nt.links.new(m.outputs[2],bs.inputs['Base Color']); bs.inputs['Roughness'].default_value=.55
liner.data.materials.append(pm)

# ---------- copa media (UV) para hornear ----------
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=8; sc.render.threads_mode='FIXED'; sc.render.threads=8
mid=cap.copy(); mid.data=cap.data.copy(); mid.name='Muffin_Copa'; link(mid)
dec=mid.modifiers.new('lod','DECIMATE'); dec.ratio=0.22
bpy.ops.object.select_all(action='DESELECT'); mid.select_set(True); bpy.context.view_layer.objects.active=mid
bpy.ops.object.modifier_apply(modifier='lod')
print('TRIS hd',sum(len(p.vertices)-2 for p in cap.data.polygons),'mid',sum(len(p.vertices)-2 for p in mid.data.polygons),flush=True)
def bake_target(ob,name,size,noncolor=False):
    im=B.images.new(name,size,size,alpha=False); 
    if noncolor: im.colorspace_settings.name='Non-Color'
    mat=B.materials.new(name+'_tmp'); mat.use_nodes=True; n=mat.node_tree.nodes.new('ShaderNodeTexImage'); n.image=im; mat.node_tree.nodes.active=n
    ob.data.materials.clear(); ob.data.materials.append(mat); return im
S=int(os.environ.get('MUFFIN_TEX','2048'))
rb=sc.render.bake; rb.use_selected_to_active=True; rb.cage_extrusion=0.004; rb.max_ray_distance=0.012; rb.margin=8
col_img=bake_target(mid,'muffin_basecolor',S)
bpy.ops.object.select_all(action='DESELECT'); cap.select_set(True); mid.select_set(True); bpy.context.view_layer.objects.active=mid
bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'}); col_img.filepath_raw=OUT+'/muffin_basecolor.jpg'; col_img.file_format='JPEG'; col_img.save()
nor_img=B.images.new('muffin_normal',S,S,alpha=False); nor_img.colorspace_settings.name='Non-Color'
mid.data.materials[0].node_tree.nodes.active.image=nor_img
bpy.ops.object.bake(type='NORMAL',normal_space='TANGENT'); nor_img.filepath_raw=OUT+'/muffin_normal.png'; nor_img.file_format='PNG'; nor_img.save()
print('BAKED cap',flush=True)
# papel: horneado propio
bpy.ops.object.select_all(action='DESELECT'); liner.select_set(True); bpy.context.view_layer.objects.active=liner
rb.use_selected_to_active=False
lim=B.images.new('liner_basecolor',1024,1024,alpha=False)
tmp=liner.data.materials[0].node_tree; n=tmp.nodes.new('ShaderNodeTexImage'); n.image=lim; tmp.nodes.active=n
bpy.ops.object.bake(type='DIFFUSE',pass_filter={'COLOR'}); lim.filepath_raw=OUT+'/liner_basecolor.jpg'; lim.file_format='JPEG'; lim.save()
print('BAKED liner',flush=True)

# ---------- materiales finales (glTF) ----------
def final(name,color_path,rough,normal_path=None,orm=None,sheen=0.0):
    mat=B.materials.new(name); nt,bs=principled(mat)
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=B.images.load(color_path); nt.links.new(t.outputs['Color'],bs.inputs['Base Color'])
    bs.inputs['Roughness'].default_value=rough
    if orm:
        o=nt.nodes.new('ShaderNodeTexImage'); o.image=img(orm,'Non-Color'); s=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(o.outputs['Color'],s.inputs['Color']); nt.links.new(s.outputs['Green'],bs.inputs['Roughness'])
    if normal_path:
        nn=nt.nodes.new('ShaderNodeTexImage'); nn.image=B.images.load(normal_path); nn.image.colorspace_settings.name='Non-Color'
        nm=nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=1.0; nt.links.new(nn.outputs['Color'],nm.inputs['Color']); nt.links.new(nm.outputs['Normal'],bs.inputs['Normal'])
    if sheen: bs.inputs['Sheen Weight'].default_value=sheen
    return mat
while mid.data.color_attributes: mid.data.color_attributes.remove(mid.data.color_attributes[0])   # glTF multiplicaría COLOR_0
mid.data.name='Muffin_Copa'; liner.data.name='Muffin_Capsula'
mid.data.materials.clear(); mid.data.materials.append(final('Muffin_bizcocho',OUT+'/muffin_basecolor.jpg',.74,OUT+'/muffin_normal.png',sheen=.25))
liner.data.materials.clear(); liner.data.materials.append(final('Muffin_capsula_papel',OUT+'/liner_basecolor.jpg',.55,orm='paper_orm.jpg'))
bpy.ops.object.select_all(action='DESELECT'); liner.select_set(True); bpy.context.view_layer.objects.active=liner
bpy.ops.object.modifier_apply(modifier='grosor')
# el HD de alta densidad queda en el .blend como fuente del horneado, fuera del glTF
cap.hide_render=True; cap.hide_set(True)
root=B.objects.new('Muffin_Starbucks',None); link(root)
for o in (mid,liner): o.parent=root
root['component_id']='POS-MUFFIN-01'; root['dimensions_cm']='Ø9 × 8,3 (cápsula Ø6,2→7,6 × 4,5)'; root['source']='XpaceOS Hiperreal · pastry CC0 procedural'
bpy.ops.wm.save_as_mainfile(filepath=OUT+'/muffin.blend',compress=True)
bpy.ops.object.select_all(action='DESELECT')
for o in (root,mid,liner): o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT+'/muffin-hd.glb',export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
print('EXPORTED',OUT,flush=True)
