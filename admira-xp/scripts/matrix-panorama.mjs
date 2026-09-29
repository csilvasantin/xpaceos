import {starbucksMusic,STARBUCKS_SPEAKER} from './starbucks-music.mjs?v=starbucks-1';
import {MATRIX_CAPTURE as CAPTURE,MAPPING_KEY,validateMapping,previewURL,quadTransform} from './matrix-mapping.mjs?v=alsea-1';

export async function mountMatrixPanorama(root,{onReady=()=>{},signal,lang='es'}={}){
 const en=lang==='en',t=(es,english)=>en?english:es;
 let disposed=false,renderer,texture,geometry,material,frame=0,drag=null,marking=null,selected='',dirty=false;
 let recalibrating='',mapRevision=0,renderKey='';
 let yaw=CAPTURE.yaw,pitch=CAPTURE.pitch,fov=CAPTURE.fov;
 let model={version:1,capture:CAPTURE.id,players:[]};
 try{const saved=localStorage.getItem(MAPPING_KEY);if(saved)model=validateMapping(JSON.parse(saved));}catch{}
 root.innerHTML=`<div class="matrix-panorama" tabindex="0" aria-label="Starbucks Alsea 360°"><div class="matrix-player-layer"></div><svg class="matrix-markers" aria-hidden="true"></svg><button class="matrix-speaker" type="button" hidden data-music-toggle aria-pressed="false">♫</button></div>
 <div class="matrix-map-toolbar"><button data-map="panel">${t('Mapear players','Map players')}</button><button data-map="home">${t('Vista inicial','Reset view')}</button><a href="${CAPTURE.source}" target="_blank" rel="noopener">${t('Captura original','Original capture')} ↗</a><button data-map="speaker">${t('Altavoz','Speaker')}</button><button data-music-toggle type="button" aria-pressed="false">${t('Escuchar','Listen')}</button><span class="matrix-music-status" role="status"></span><span class="matrix-map-status" role="status">${t('Cargando panorama…','Loading panorama…')}</span></div>
 <section class="matrix-map-panel" aria-label="${t('Mapeo de players','Player mapping')}" hidden>
 <header><strong>Starbucks · Alsea</strong><button data-map="close" aria-label="${t('Cerrar','Close')}">×</button></header>
 <p>${t('Marca cada pantalla en orden: arriba izquierda, arriba derecha, abajo derecha, abajo izquierda.','Mark each screen in order: top left, top right, bottom right, bottom left.')}</p>
 <button data-map="add">+ ${t('Marcar pantalla','Mark screen')}</button><button data-map="cancel" hidden>${t('Cancelar','Cancel')}</button>
 <label>${t('Pantallas','Screens')}<select class="matrix-map-list"><option value="">—</option></select></label>
 <form class="matrix-map-form" hidden>
 <label>${t('Nombre','Name')}<input name="name" maxlength="100" required></label>
 <label>${t('ID del player real','Real player ID')}<input name="playerId" maxlength="200" placeholder="${t('Pendiente de vincular','Awaiting mapping')}"></label>
 <label>${t('URL de vista previa HTTPS','HTTPS preview URL')}<input name="url" type="url" placeholder="https://…"></label>
 <label>${t('Contenido','Content')}<select name="type"><option value="frame">Player web</option><option value="video">Video</option><option value="image">${t('Imagen','Image')}</option></select></label>
 <button type="submit">${t('Aplicar al mapa','Apply to map')}</button><button type="button" data-map="recalibrate">${t('Recalibrar esquinas','Recalibrate corners')}</button><button type="button" data-map="preview">${t('Abrir vista previa','Open preview')}</button><button type="button" data-map="remove">${t('Quitar del mapa','Remove from map')}</button>
 </form>
 <footer><button data-map="save">${t('Guardar mapa','Save map')}</button><button data-map="export">${t('Exportar','Export')}</button><label class="matrix-import">${t('Importar','Import')}<input type="file" accept="application/json,.json" class="matrix-map-import"></label></footer>
 <p class="matrix-map-note">${t('Mapa local en este navegador. Un ID anotado no confirma conexión con el player real. La vista previa no publica contenido en las pantallas.','Local map in this browser. An entered ID does not confirm a connection to the real player. Previewing does not publish content to screens.')}</p>
 </section>`;
 const surface=root.querySelector('.matrix-panorama'),layer=root.querySelector('.matrix-player-layer'),markers=root.querySelector('.matrix-markers'),panel=root.querySelector('.matrix-map-panel'),status=root.querySelector('.matrix-map-status'),list=root.querySelector('.matrix-map-list'),form=root.querySelector('form');
 const controls=new AbortController(),options={signal:controls.signal},previews=new Map(),nodes=new Map();
 const speaker=root.querySelector('.matrix-speaker'),musicStatus=root.querySelector('.matrix-music-status'),musicButtons=[...root.querySelectorAll('[data-music-toggle]')];
 const music=starbucksMusic();
 const unsubscribeMusic=music.subscribe(state=>{
  const audible=state.started&&!state.muted;
  const action=audible?t('Silenciar','Mute'):t('Escuchar','Listen');
  let label=!state.tracks?t('Playlist pendiente · 3 instrumentales Suno de Morfeo','Playlist pending · 3 Suno instrumentals from Morfeo')
   :state.started?(state.muted?t('Silenciado · la playlist continúa','Muted · playlist continues'):t('Sonando','Playing'))+' · '+state.title
   :state.tracks+' '+t('piezas · pulsa el altavoz para escuchar','tracks · click the speaker to listen');
  if(state.error==='play')label=t('Pulsa para reintentar el audio','Click to retry audio');
  if(state.error==='media')label=t('Audio no disponible · pulsa para reintentar','Audio unavailable · click to retry');
  if(state.error==='feed'&&!state.tracks)label=t('No se pudo cargar la playlist · pulsa para reintentar','Could not load playlist · click to retry');
  musicStatus.textContent=label;
  for(const button of musicButtons){button.setAttribute('aria-pressed',String(audible));button.setAttribute('aria-label',action+' · Starbucks Alsea');button.title=label;if(button===speaker)button.textContent=audible?'♫':'♪';else button.textContent=action;}
 });
 for(const button of musicButtons)button.addEventListener('click',()=>{music.toggle();},options);
 void music.refresh();const musicPoll=setInterval(()=>{void music.refresh();},30000);
 function message(value){status.textContent=value;}
 function changed(){dirty=true;message(t('Mapa sin guardar','Unsaved map'));}
 function destroyPreview(id){const node=previews.get(id);if(node){if(node.tagName==='VIDEO'){node.pause();node.removeAttribute('src');node.load();}else if(node.tagName==='IFRAME')node.src='about:blank';node.remove();previews.delete(id);}}
 function select(id){selected=id;list.value=id;const p=model.players.find(p=>p.id===id);form.hidden=!p;if(p)for(const key of ['name','playerId','url','type'])form.elements.namedItem(key).value=p[key];}
 function renderList(){
  mapRevision++;
  list.replaceChildren(new Option('—',''));
  for(const p of model.players)list.add(new Option(p.name+(p.playerId?' · '+p.playerId:''),p.id));select(selected);
  for(const [id,node] of nodes)if(!model.players.some(p=>p.id===id)){destroyPreview(id);node.remove();nodes.delete(id);}
  for(const p of model.players){let node=nodes.get(p.id);if(!node){node=document.createElement('div');node.className='matrix-mapped-player';node.style.width='640px';node.style.height='360px';const name=document.createElement('button');name.className='matrix-player-label';name.addEventListener('click',()=>{panel.hidden=false;select(p.id);},options);node.append(name);layer.append(node);nodes.set(p.id,node);}node.querySelector('button').textContent=p.name+' · '+(p.playerId||t('sin vincular','unmapped'));}
 }
 renderList();
 list.addEventListener('change',()=>select(list.value),options);
 form.addEventListener('submit',e=>{e.preventDefault();const p=model.players.find(p=>p.id===selected);if(!p)return;const data=new FormData(form),url=previewURL(data.get('url'));if(url===null){message(t('Usa una URL HTTPS sin credenciales.','Use an HTTPS URL without credentials.'));return;}destroyPreview(p.id);Object.assign(p,{name:String(data.get('name')).trim()||'Player',playerId:String(data.get('playerId')).trim(),url,type:data.get('type')});changed();renderList();},options);
 function cancel(){marking=null;recalibrating='';root.querySelector('[data-map=cancel]').hidden=true;surface.classList.remove('is-mapping');markers.replaceChildren();}
 function save(){try{localStorage.setItem(MAPPING_KEY,JSON.stringify(validateMapping(model)));dirty=false;message(t('Mapa guardado en este navegador','Map saved in this browser'));}catch{message(t('No se pudo guardar el mapa','Could not save the map'));}}
 for(const button of root.querySelectorAll('[data-map]'))button.addEventListener('click',()=>{
  switch(button.dataset.map){
   case 'panel':panel.hidden=!panel.hidden;break;
   case 'close':panel.hidden=true;cancel();break;
   case 'home':yaw=CAPTURE.yaw;pitch=CAPTURE.pitch;fov=CAPTURE.fov;break;
   case 'speaker':yaw=STARBUCKS_SPEAKER.yaw;pitch=STARBUCKS_SPEAKER.pitch;fov=75;break;
   case 'add':if(model.players.length>=24){message(t('Máximo 24 pantallas','Maximum 24 screens'));break;}cancel();marking=[];surface.classList.add('is-mapping');root.querySelector('[data-map=cancel]').hidden=false;message(t('Marca esquina 1: arriba izquierda','Mark corner 1: top left'));break;
   case 'recalibrate':if(selected){cancel();recalibrating=selected;marking=[];surface.classList.add('is-mapping');root.querySelector('[data-map=cancel]').hidden=false;message(t('Marca esquina 1: arriba izquierda','Mark corner 1: top left'));}break;
   case 'cancel':cancel();message(t('Marcado cancelado','Marking cancelled'));break;
   case 'save':save();break;
   case 'remove':model.players=model.players.filter(p=>p.id!==selected);selected='';changed();renderList();break;
   case 'preview':{
    const p=model.players.find(p=>p.id===selected);if(!p?.url){message(t('Aplica una URL de vista previa primero','Apply a preview URL first'));break;}
    destroyPreview(p.id);const node=document.createElement(p.type==='frame'?'iframe':p.type==='video'?'video':'img');node.className='matrix-player-media';
    if(p.type==='frame'){node.title=p.name;node.setAttribute('sandbox','allow-scripts allow-same-origin');node.referrerPolicy='no-referrer';}
    if(p.type==='video'){node.muted=true;node.loop=true;node.playsInline=true;node.autoplay=true;}
    node.src=p.url;nodes.get(p.id).prepend(node);previews.set(p.id,node);message(t('Vista previa local; conexión real sin verificar','Local preview; real connection unverified'));break;
   }
   case 'export':{
    const blob=new Blob([JSON.stringify(model,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='alsea-starbucks-players.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;
   }
  }
 },options);
 root.querySelector('.matrix-map-import').addEventListener('change',async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>100000)throw Error();const next=validateMapping(JSON.parse(await file.text()));if(disposed)return;for(const id of previews.keys())destroyPreview(id);model=next;selected='';changed();renderList();}catch{message(t('Mapa inválido para esta captura','Invalid map for this capture'));}finally{e.target.value='';}},options);
 const toolbar=root.querySelector('.matrix-map-toolbar');
 for(const type of ['click','keydown','keyup','keypress','pointerdown','pointerup','mousedown','mouseup','touchstart','touchend'])toolbar.addEventListener(type,e=>e.stopPropagation(),options);
 document.querySelector('#telegramDock .tg-actions')?.append(toolbar);
 const dispose=()=>{if(disposed)return;disposed=true;controls.abort();clearInterval(musicPoll);unsubscribeMusic();music.mute();cancelAnimationFrame(frame);observer?.disconnect();for(const id of previews.keys())destroyPreview(id);geometry?.dispose();material?.dispose();texture?.dispose();renderer?.dispose();toolbar.remove();root.replaceChildren();};
 let observer;
 signal?.addEventListener('abort',dispose,{once:true});
 try{
  const THREE=await import('./premium-three.mjs');if(disposed)return dispose;
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;surface.prepend(renderer.domElement);
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(fov,1,.1,100),ray=new THREE.Raycaster();
  geometry=new THREE.SphereGeometry(10,64,40);const uv=geometry.attributes.uv;
  // Keep U continuous across triangles; RepeatWrapping handles the 360° seam.
  for(let i=0;i<uv.count;i++)uv.setX(i,1-uv.getX(i)+.25);uv.needsUpdate=true;
  texture=await new THREE.TextureLoader().loadAsync(CAPTURE.image);if(disposed){texture.dispose();return dispose;}texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;
  material=new THREE.MeshBasicMaterial({map:texture,side:THREE.BackSide});const sphere=new THREE.Mesh(geometry,material);sphere.rotation.x=THREE.MathUtils.degToRad(CAPTURE.sphereX);scene.add(sphere);
  function updateCamera(){camera.fov=fov;camera.updateProjectionMatrix();const y=THREE.MathUtils.degToRad(yaw),p=THREE.MathUtils.degToRad(pitch);camera.lookAt(Math.sin(y)*Math.cos(p),Math.sin(p),Math.cos(y)*Math.cos(p));camera.updateMatrixWorld();}
  function resize(){const r=surface.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height));camera.aspect=r.width/Math.max(1,r.height);updateCamera();}
  observer=new ResizeObserver(resize);observer.observe(surface);resize();
  function project(c){const y=THREE.MathUtils.degToRad(c.yaw),p=THREE.MathUtils.degToRad(c.pitch),v=new THREE.Vector3(Math.sin(y)*Math.cos(p),Math.sin(p),Math.cos(y)*Math.cos(p));const local=v.clone().applyMatrix4(camera.matrixWorldInverse);if(local.z>=-.03)return null;v.project(camera);return {x:(v.x+1)*surface.clientWidth/2,y:(1-v.y)*surface.clientHeight/2};}
  function at(e){const r=surface.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2(2*(e.clientX-r.left)/r.width-1,1-2*(e.clientY-r.top)/r.height),camera);const v=ray.ray.direction;return {yaw:THREE.MathUtils.radToDeg(Math.atan2(v.x,v.z)),pitch:THREE.MathUtils.radToDeg(Math.asin(v.y))};}
  surface.addEventListener('pointerdown',e=>{if(e.target.closest('button,iframe,video')||e.button!==0)return;surface.focus();if(marking){marking.push(at(e));if(marking.length===4){if(!quadTransform(marking.map(project).filter(Boolean))){cancel();message(t('Esquinas inválidas: repite el orden indicado.','Invalid corners: repeat in the indicated order.'));return;}const id=recalibrating||crypto.randomUUID(),existing=model.players.find(p=>p.id===id);if(existing)existing.corners=marking;else model.players.push({id,name:'Player '+(model.players.length+1),playerId:'',url:'',type:'frame',corners:marking});selected=id;cancel();changed();renderList();}else message(t('Marca esquina ','Mark corner ')+(marking.length+1));return;}drag={x:e.clientX,y:e.clientY,yaw,pitch};surface.setPointerCapture(e.pointerId);},options);
  surface.addEventListener('pointermove',e=>{if(!drag)return;yaw=drag.yaw-(e.clientX-drag.x)*.16;pitch=Math.max(-85,Math.min(85,drag.pitch+(e.clientY-drag.y)*.16));},options);
  const release=()=>{drag=null;};surface.addEventListener('pointerup',release,options);surface.addEventListener('pointercancel',release,options);
  surface.addEventListener('wheel',e=>{e.preventDefault();fov=Math.max(30,Math.min(100,fov+e.deltaY*.04));},{...options,passive:false});
  surface.addEventListener('keydown',e=>{const keys={ArrowLeft:()=>yaw-=4,ArrowRight:()=>yaw+=4,ArrowUp:()=>pitch=Math.min(85,pitch+4),ArrowDown:()=>pitch=Math.max(-85,pitch-4),'+':()=>fov=Math.max(30,fov-5),'-':()=>fov=Math.min(100,fov+5)};if(keys[e.key]){e.preventDefault();keys[e.key]();}},options);
  function draw(){if(disposed)return;const key=[yaw,pitch,fov,surface.clientWidth,surface.clientHeight,mapRevision,marking?.length].join(':');if(key===renderKey){frame=requestAnimationFrame(draw);return;}renderKey=key;updateCamera();renderer.render(scene,camera);const soundPoint=project(STARBUCKS_SPEAKER);speaker.hidden=!soundPoint||!!marking;if(soundPoint){speaker.style.left=soundPoint.x+'px';speaker.style.top=soundPoint.y+'px';}for(const p of model.players){const node=nodes.get(p.id),pts=p.corners.map(project);const matrix=pts.every(Boolean)&&quadTransform(pts);node.hidden=!matrix;if(matrix)node.style.transform='matrix3d('+matrix.join(',')+')';}markers.replaceChildren();if(marking)marking.forEach((corner,i)=>{const p=project(corner);if(!p)return;const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');circle.setAttribute('cx',p.x);circle.setAttribute('cy',p.y);circle.setAttribute('r','7');markers.append(circle);});frame=requestAnimationFrame(draw);}
  draw();message(t('Panorama 360° · arrastra para mirar · rueda para zoom','360° panorama · drag to look · scroll to zoom'));onReady();
 }catch(error){if(!disposed){message(t('No se pudo cargar el panorama. Reintenta desde Matrix.','Could not load panorama. Retry Matrix.'));onReady(String(error?.message||error));}}
 return dispose;
}
