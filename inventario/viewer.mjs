import * as T from '../admira-xp/scripts/premium-three.mjs';
import {createLifeScene} from '../admira-xp/scripts/life-scene.mjs?v=inventari-1';
import {cloneCounter} from '../admira-xp/scripts/counter-asset.mjs';
let renderer,queue=Promise.resolve();const imageCache=new Map();
function loadImage(url){if(!imageCache.has(url))imageCache.set(url,new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';const timeout=setTimeout(()=>reject(Error('La imagen tarda demasiado')),12000);im.onload=()=>{clearTimeout(timeout);resolve(im);};im.onerror=()=>{clearTimeout(timeout);reject(Error('No se pudo leer el sprite'));};im.src=url;}));return imageCache.get(url);}
export function preview(asset,tier,angle=0){const task=queue.then(()=>render(asset,tier,angle));queue=task.catch(()=>{});return task;}
async function render(asset,tier,angle){

 renderer ||= new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=tier==='best'?1.2:1.1;
 renderer.setClearColor(0x000000,0);const size=tier==='good'?88:420;renderer.setSize(size,size,false);
 let scene,object,dispose;
 if(asset.id==='native:counter'){
  object=await cloneCounter(tier);scene=new T.Scene();scene.add(object,new T.HemisphereLight('#ffffff','#7e8f81',2.8));const key=new T.DirectionalLight('#fff0d7',3.2);key.position.set(3,6,4);scene.add(key);dispose=()=>scene.clear();
 }else if(asset.img){
  const im=await loadImage(asset.img),frame=document.createElement('canvas'),views=asset.views||1;
  frame.width=Math.floor(im.width/views);frame.height=im.height;const fc=frame.getContext('2d',{willReadFrequently:true});
  const face=views===4?Math.floor(angle/(Math.PI/2))%4:0;fc.drawImage(im,face*frame.width,0,frame.width,im.height,0,0,frame.width,frame.height);
  const rgba=fc.getImageData(0,0,frame.width,frame.height).data;let left=frame.width,top=frame.height,right=0,bottom=0;
  for(let y=0;y<frame.height;y++)for(let x=0;x<frame.width;x++)if(rgba[(y*frame.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Sprite vacío');
  const sw=right-left+1,sh=bottom-top+1,n=tier==='good'?Math.max(sw,sh):tier==='better'?56:112,c=document.createElement('canvas');c.width=n;c.height=n;const ctx=c.getContext('2d',{willReadFrequently:true});
  const scale=n*.9/Math.max(sw,sh);ctx.drawImage(frame,left,top,sw,sh,(n-sw*scale)/2,(n-sh*scale)/2,sw*scale,sh*scale);
  if(tier==='good')return c.toDataURL('image/png');
  const pixels=ctx.getImageData(0,0,n,n).data,cells=[];
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4;if(pixels[p+3]>100)cells.push([x,y,pixels[p],pixels[p+1],pixels[p+2]]);}
  if(!cells.length)throw Error('Sprite sin contenido visible');
  scene=new T.Scene();scene.add(new T.HemisphereLight('#ffffff','#6f7b7c',2));const light=new T.DirectionalLight('#ffe5be',3);light.position.set(-3,5,6);scene.add(light);
  const geometry=new T.BoxGeometry(1/n,1/n,tier==='better'?.08:.035),material=new T.MeshStandardMaterial({roughness:tier==='best'?.55:.95,metalness:tier==='best'?.1:0});
  object=new T.InstancedMesh(geometry,material,cells.length);const matrix=new T.Matrix4(),color=new T.Color();
  cells.forEach(([x,y,r,g,b],i)=>{matrix.makeTranslation((x-n/2)/n,(n-y)/n,0);object.setMatrixAt(i,matrix);color.setRGB(r/255,g/255,b/255,T.SRGBColorSpace);object.setColorAt(i,color);});
  object.computeBoundingBox();scene.add(object);dispose=()=>{object.dispose();geometry.dispose();material.dispose();};
 }else{
  const model=createLifeScene({cols:8,rows:8,wallHeight:3,layout:[{id:asset.id,type:asset.type,fp:asset.fp,col:0,row:0,ph:asset.type==='led'?.22:1.1,sx:1,sy:1}],actors:[]},{inventory:true});
  scene=model.scene;object=model.world.children.find(x=>x.name.startsWith('furniture:'));dispose=()=>model.dispose();
  if(tier!=='best'){
   const seen=new Set();object.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){if(seen.has(m))continue;seen.add(m);if(m.map&&m.isMeshStandardMaterial){m.map=null;m.color.set('#b79061');}if(m.isMeshStandardMaterial){m.roughness=1;m.metalness=0;}m.needsUpdate=true;}});
  }
 }
 try{
  scene.background=null;object.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(object),center=bounds.getCenter(new T.Vector3()),span=bounds.getSize(new T.Vector3());
  const extent=Math.max(span.x,span.y,span.z)*(asset.img?.60:.87)+(asset.img?.02:.1),camera=new T.OrthographicCamera(-extent,extent,extent,-extent,.01,100);
  const az=asset.img?(asset.views===4?0:angle*.4):Math.PI/4+angle;camera.position.copy(center).add(new T.Vector3(Math.sin(az)*10,asset.img?1:7,Math.cos(az)*10));camera.lookAt(center);renderer.render(scene,camera);
  return renderer.domElement.toDataURL('image/png');
 }finally{dispose();}
}
window.addEventListener('pagehide',()=>{renderer?.dispose();renderer?.forceContextLoss();renderer=null;imageCache.clear();});
