import * as T from '../admira-xp/scripts/premium-three.mjs';
import {cloneCounter} from '../admira-xp/scripts/counter-asset.mjs';

export async function mountCounterStage(host){
 const canvas=host.querySelector('canvas'),status=host.querySelector('[data-status]');
 let renderer,object,disposed=false,angle=Math.PI/4,elevation=.38,zoom=1,drag=null;
 const owned=new Set(),events=[];
 const on=(element,type,fn)=>{element.addEventListener(type,fn);events.push(()=>element.removeEventListener(type,fn));};
 try{
  renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
  renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  const scene=new T.Scene();scene.background=new T.Color('#edf0e7');
  scene.add(new T.HemisphereLight('#ffffff','#80927f',2.5));
  const key=new T.DirectionalLight('#fff3dc',3.5);key.position.set(3,7,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.bias=-.0003;scene.add(key);
  const fill=new T.DirectionalLight('#d9e8f3',1.5);fill.position.set(-4,3,-3);scene.add(fill);
  const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshStandardMaterial({color:'#edf0e7',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;scene.add(floor);owned.add(floor.geometry);owned.add(floor.material);
  object=await cloneCounter('best');if(disposed)return;
  const materials=new Map();object.traverse(o=>{if(o.isMesh){o.material=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{if(!materials.has(m)){const clone=m.clone();materials.set(m,clone);owned.add(clone);}return materials.get(m);});if(o.material.length===1)o.material=o.material[0];}});scene.add(object);
  const camera=new T.PerspectiveCamera(36,1,.01,100),center=new T.Vector3(.5,.78,1);
  function draw(){
   if(disposed)return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
   renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();
   const distance=(camera.aspect<1?6.2:4.8)/zoom;
   camera.position.copy(center).add(new T.Vector3(Math.sin(angle)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,Math.cos(angle)*Math.cos(elevation)*distance));camera.lookAt(center);renderer.render(scene,camera);
  }
  const setView=(a,e,label)=>{angle=a;elevation=e;zoom=1;status.textContent='Mostrador 1 · '+label+' · modelo 3D completo';draw();};
  for(const button of host.querySelectorAll('[data-view]'))on(button,'click',()=>{const name=button.dataset.view;setView(...({front:[0,.25,'frontal'],back:[Math.PI,.25,'parte posterior'],side:[Math.PI/2,.25,'lateral'],home:[Math.PI/4,.38,'perspectiva']}[name]));});
  for(const button of host.querySelectorAll('[data-zoom]'))on(button,'click',()=>{zoom=Math.max(.7,Math.min(2,zoom+(button.dataset.zoom==='in'?.15:-.15)));draw();});
  on(canvas,'pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
  on(canvas,'pointermove',e=>{if(!drag)return;angle-=(e.clientX-drag.x)*.009;elevation=Math.max(.05,Math.min(1.35,elevation+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};status.textContent='Mostrador 1 · vista libre 360°';draw();});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])on(canvas,type,()=>{drag=null;});
  on(canvas,'keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-'].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')angle-=.15;if(e.key==='ArrowRight')angle+=.15;if(e.key==='ArrowUp')elevation=Math.min(1.35,elevation+.1);if(e.key==='ArrowDown')elevation=Math.max(.05,elevation-.1);if(e.key==='+')zoom=Math.min(2,zoom+.1);if(e.key==='-')zoom=Math.max(.7,zoom-.1);draw();});
  const wire=host.querySelector('[data-wire]');on(wire,'change',()=>{for(const m of materials.values())m.wireframe=wire.checked;draw();});
  on(canvas,'webglcontextlost',e=>{e.preventDefault();status.textContent='Se ha interrumpido la vista 3D. Recarga para recuperarla.';});
  const observer=new ResizeObserver(draw);observer.observe(canvas);events.push(()=>observer.disconnect());
  status.textContent='Mostrador 1 · modelo 3D completo · arrastra para girar';draw();
  return ()=>{disposed=true;events.forEach(off=>off());owned.forEach(r=>r.dispose());key.shadow.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();};
 }catch(error){renderer?.dispose();status.textContent='No se pudo abrir la vista 3D. Recarga para reintentar; el archivo GLB sigue disponible para descargar.';return ()=>{disposed=true;events.forEach(off=>off());owned.forEach(r=>r.dispose());};}
}
