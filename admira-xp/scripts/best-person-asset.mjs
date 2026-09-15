import * as T from './premium-three.mjs';
import {GLTFLoader} from './vendor/GLTFLoader.mjs';

// Public CC0-derived, fully clothed characters built in Blender. A single cached
// mesh per body profile, an independent skeleton/material palette per visitor.
const cache=new Map();
const hash=value=>{let h=2166136261;for(const c of String(value??'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
export function personProfile(actor={}){
 const female=actor.gender==='f'||actor.gender==='female'||(!actor.gender&&hash(actor.id)%2===1);
 const child=actor.age==='nino'||actor.age==='child';
 return `${child?'child-':''}${female?'female':'male'}`;
}
export function personAssetURL(profile){
 if(!['male','female','child-male','child-female'].includes(profile))throw Error('Perfil de personaje no válido');
 return new URL(`../assets/people/best-v1/${profile}.glb`,import.meta.url).href;
}

// Object3D.clone deliberately does not rebind skeletons. Reconnect every bone to
// the corresponding cloned node, preserving shared immutable geometry/textures.
export function clonePersonScene(source){
 const clone=source.clone(true),map=new Map(),ownedMaterials=new Set(),skeletons=new Set();
 let disposed=false;
 const dispose=()=>{if(disposed)return;disposed=true;for(const m of ownedMaterials)m.dispose();for(const s of skeletons)s.dispose();clone.removeFromParent();};
 const pair=(a,b)=>{map.set(a,b);for(let i=0;i<a.children.length;i++)pair(a.children[i],b.children[i]);};pair(source,clone);
 try{source.traverse(original=>{
  if(!original.isMesh)return;
  const mesh=map.get(original);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
  const copyMaterial=m=>{const copy=m.clone();ownedMaterials.add(copy);return copy;};
  mesh.material=Array.isArray(original.material)?original.material.map(copyMaterial):copyMaterial(original.material);
  if(original.isSkinnedMesh){
   mesh.skeleton=original.skeleton.clone();mesh.skeleton.boneInverses=original.skeleton.boneInverses.map(matrix=>matrix.clone());skeletons.add(mesh.skeleton);mesh.bindMatrix.copy(original.bindMatrix);
   mesh.skeleton.bones=original.skeleton.bones.map(b=>map.get(b));
   if(mesh.skeleton.bones.some(b=>!b))throw Error('Esqueleto incompleto');
   mesh.bind(mesh.skeleton,mesh.bindMatrix);
  }
 });}catch(error){dispose();throw error;}
 return {scene:clone,materials:ownedMaterials,dispose};
}
function tintMaterials(materials,actor){
 const safeColor=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(value||'')?value:fallback;
 for(const mat of materials){
  const part=mat.userData?.personPart||mat.name;
  if(part.includes('shirt')){mat.color.set(safeColor(actor.kind==='staff'?'#35574f':actor.color,'#52696e'));if(mat.map)mat.color.lerp(new T.Color('#ffffff'),.72);}
  if(part.includes('trousers')){mat.color.set(safeColor(actor.pants,'#344251'));if(mat.map)mat.color.lerp(new T.Color('#ffffff'),.64);}
  if(part.includes('shoe_upper')){mat.color.set(safeColor(actor.shoes,'#333136'));if(mat.map)mat.color.lerp(new T.Color('#ffffff'),.55);}
  if(part.includes('hair')){
   const c=new T.Color(safeColor(actor.hair,'#302720')),hsl={};c.getHSL(hsl);
   // The palette's saturated blue/orange hair belongs to the retro tier. Best
   // uses the same seed/palette family interpreted as everyday natural hair.
   if(hsl.s>.58&&(hsl.h>.4&&hsl.h<.82))c.set('#22242a');
   else c.lerp(new T.Color('#241b16'),.28);
   mat.color.copy(c);
  }
  if(part.includes('skin')){
   // Diffuse skin carries natural facial detail. A modest tint preserves that
   // detail while keeping the simulation's explicit, fictional skin palette.
   const color=new T.Color(safeColor(actor.skin,'#e0b495'));
   color.lerp(new T.Color('#ffffff'),.34);mat.color.copy(color);
  }
 }
}
export function createPersonPresentation(gltf,actor={}){
 const instance=clonePersonScene(gltf.scene);tintMaterials(instance.materials,actor);
 const scene=instance.scene;scene.name=`best-person:${actor.id||'visitor'}`;
 scene.userData.personProfile=personProfile(actor);scene.userData.visualQuality='best';
 const mixer=new T.AnimationMixer(scene),clips=gltf.animations||[];
 const idleClip=clips.find(c=>c.name.toLowerCase().includes('idle'));
 const walkClip=clips.find(c=>c.name.toLowerCase().includes('walk'));
 const idle=idleClip?mixer.clipAction(idleClip).play():null;
 const walk=walkClip?mixer.clipAction(walkClip).play():null;
 const phase=(hash(actor.id)%1000)/1000;let lastTime=null,blend=actor.walking?1:0,disposed=false,walkPhase=phase,previousPosition=null;
 function animate(timeMs,currentActor=actor,pose){
  if(disposed)return;
  const time=Number.isFinite(timeMs)?timeMs/1000:0;
  const dt=lastTime===null?0:Math.max(0,Math.min(.1,time-lastTime));lastTime=time;
  const target=currentActor.walking?1:0;
  blend+= (target-blend)*(1-Math.exp(-dt*12));
  const position=pose?.position;
  if(Number.isFinite(position?.x)&&Number.isFinite(position?.z)){
   if(previousPosition){
    const distance=Math.hypot(position.x-previousPosition.x,position.z-previousPosition.z);
    // Sample the distance already displayed by the live actor interpolation.
    // Standing actors never treadmill; teleports do not fast-forward a gait.
    // At most half a stride cycle can be advanced in a single rendered frame.
    if(distance<=3)walkPhase=(walkPhase+Math.min(distance,.36)/.72)%1;
   }
   previousPosition={x:position.x,z:position.z};
  }else{
   previousPosition=null;
   if(walkClip)walkPhase=((time/walkClip.duration+phase)%1+1)%1;
  }
  if(idle){idle.enabled=true;idle.setEffectiveWeight(walk?1-blend:1);idle.time=(time+phase*idleClip.duration)%idleClip.duration;}
  if(walk){walk.enabled=true;walk.setEffectiveWeight(idle?blend:1);walk.time=walkPhase*walkClip.duration;}
  mixer.update(0);
 }
 animate(0,actor);
 // Camera fitting may run before the first renderer frame. Mesh nodes precede
 // their bones in glTF, so a Box3 traversal alone can skin against stale clone
 // matrices and report a quarter-height body. Initialize the whole rig first.
 scene.updateMatrixWorld(true);
 scene.traverse(node=>{if(node.isSkinnedMesh){node.boundingBox=null;node.boundingSphere=null;}});
 return {scene,animate,dispose(){if(disposed)return;disposed=true;mixer.stopAllAction();mixer.uncacheRoot(scene);instance.dispose();}};
}
export async function loadBestPerson(actor={}){
 const profile=personProfile(actor),url=personAssetURL(profile);
 if(!cache.has(profile))cache.set(profile,(async()=>{
  const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('Personaje Best no disponible');
  return new GLTFLoader().parseAsync(await response.arrayBuffer(),url);
 })().catch(error=>{cache.delete(profile);throw error;}));
 return createPersonPresentation(await cache.get(profile),actor);
}
