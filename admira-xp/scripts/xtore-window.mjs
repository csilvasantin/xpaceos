import {SCREEN,TTL,allowedOrigin,playbackState,targetTime,MirrorSession} from './xtore-window-core.mjs';
const qs=new URLSearchParams(location.search);
const enabled=qs.get('virtualPlayer')===SCREEN;
const entry=document.createElement('a');entry.id='xtore-window-entry';entry.textContent='Xtore · zapatillas';
entry.href='?autostart=xtanco&virtualPlayer='+SCREEN;
entry.style.cssText='position:fixed;right:100px;top:6px;z-index:1000;padding:7px 12px;background:#10252b;color:#8ce8e0;border:1px solid #347b7d;border-radius:8px;font:12px sans-serif;text-decoration:none';
if(!enabled){document.body.append(entry);}else{
  document.title='Xtore · zapatillas — Player virtual · XpaceOS';
  const panel=document.createElement('section');panel.id='xtore-window-panel';panel.setAttribute('aria-label','Player virtual de zapatillas');
  panel.style.cssText='position:fixed;right:12px;top:52px;width:min(360px,90vw);z-index:1000;background:#08161df2;color:#d7f6ed;border:1px solid #347b7d;border-radius:12px;padding:14px;font:13px/1.5 sans-serif;box-shadow:0 8px 30px #0008';
  panel.innerHTML='<strong>Xtore · zapatillas</strong><p id="xtore-link-status" role="status">Conecta el player interior para reflejarlo en las pantallas del gemelo.</p><button id="xtore-connect">Conectar player y cámara ↗</button> <button id="xtore-disconnect">Desconectar</button><details id="xtore-camera"><summary>Cámara del escaparate · Puerta Cam</summary><canvas width="1" height="1" style="width:100%;max-height:230px;object-fit:contain" hidden></canvas><p id="xtore-camera-status" role="status">Sin vídeo de cámara. Los peatones del juego no son detecciones reales.</p></details><p id="xtore-media-status" role="status">Player sin señal</p><button id="xtore-sound">Activar sonido del gemelo</button><p style="font-size:11px;opacity:.7">Mismo player virtual · espejo de esta sesión · sin grabación. El audio del espejo empieza silenciado.</p>';
  for(const button of panel.querySelectorAll('button'))button.style.cssText="background:#163039;color:#d7f6ed;border:1px solid #38727a;border-radius:6px;padding:6px 9px;margin:3px 0;cursor:pointer;font:inherit";
  panel.querySelector('summary').style.cssText="cursor:pointer;padding:8px 0";
  document.body.append(panel);
  const status=panel.querySelector('#xtore-link-status'),mediaStatus=panel.querySelector('#xtore-media-status'),cameraStatus=panel.querySelector('#xtore-camera-status'),camera=panel.querySelector('canvas');
  let peer=null,origin='',token='',connection=null,connected=false,lastMedia=0,lastCamera=0,latest=null,element=null,mediaKey='',audio=false,loadFailed=false,applied=false;
  function send(event){if(peer&&!peer.closed)peer.postMessage({source:'xpace-xtore-twin',screen:SCREEN,session:token,event},origin);}
  function stopMedia(){if(element){element.pause?.();element.removeAttribute('src');element.load?.();}element=null;mediaKey='';latest=null;applied=false;lastMedia=0;mediaStatus.textContent='Player sin señal · esperando al interior';}
  function stopCamera(){camera.hidden=true;camera.width=1;camera.height=1;lastCamera=0;cameraStatus.textContent='Cámara sin señal reciente';}
  function disconnect(){send('disconnect');connected=false;peer=null;connection=null;stopMedia();stopCamera();status.textContent='Desconectado. Las pantallas esperan al player virtual.';}
  function bind(target,targetOrigin,session){disconnect();peer=target;origin=targetOrigin;token=session;connection=new MirrorSession({peer,origin,session});send('hello');}
  const requested=qs.get('twinOrigin'),session=qs.get('twinSession');
  if(window.opener&&allowedOrigin(requested,location.origin)&&/^[a-f0-9-]{36}$/.test(session||''))bind(window.opener,requested,session);
  panel.querySelector('#xtore-connect').onclick=()=>{
    if(peer&&!peer.closed){peer.focus();return;}
    const testOrigin=qs.get('analyzerOrigin');
    const analyzerOrigin=/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(location.origin)&&allowedOrigin(testOrigin,location.origin)?testOrigin:'https://admira.tv';
    const session=crypto.randomUUID(),url=new URL('/videoanalytics/xtore/',analyzerOrigin);
    url.search=new URLSearchParams({twinOrigin:location.origin,twinSession:session});
    const target=window.open(url.href,'xtore-analyzer-'+session,'popup,width=1180,height=900');
    if(!target){status.textContent='Permite la ventana del analizador en Chrome y vuelve a conectar.';return;}
    bind(target,url.origin,session);status.textContent='Abre Puerta Cam y comparte su pestaña en el analizador.';
  };
  panel.querySelector('#xtore-disconnect').onclick=disconnect;
  panel.querySelector('#xtore-sound').onclick=()=>{audio=!audio;if(element)element.muted=!audio;panel.querySelector('#xtore-sound').textContent=audio?'Silenciar gemelo':'Activar sonido del gemelo';};
  function synchronize(){
    if(!element||!latest)return;
    if(latest.type==='image'){applied=element.complete&&element.naturalWidth>0;return;}
    if(element.readyState<1)return;
    const pos=targetTime(latest);
    if(Math.abs(element.currentTime-pos)>.8)try{element.currentTime=pos;}catch{}
    element.playbackRate=latest.rate;element.muted=!audio;
    if(latest.paused)element.pause();else if(element.paused)element.play().catch(()=>{mediaStatus.textContent='Reproducción bloqueada · pulsa Activar sonido o vuelve a conectar';});
    applied=element.readyState>=2&&(latest.paused||!element.paused);
  }
  function apply(p){
    latest=p;lastMedia=p.ts;
    const key=p.id+'|'+p.url+'|'+p.type;
    if(key!==mediaKey){
      element?.pause?.();if(element){element.removeAttribute('src');element.load?.();}
      mediaKey=key;loadFailed=false;applied=false;
      const next=document.createElement(p.type==='image'?'img':p.type==='audio'?'audio':'video');element=next;
      // Keep the game canvas origin-clean, including its existing camera tools.
      next.crossOrigin='anonymous';next.referrerPolicy='no-referrer';next.muted=!audio;next.playsInline=true;next.preload='auto';
      next.addEventListener(p.type==='image'?'load':'loadedmetadata',()=>{if(element===next)synchronize();});
      next.addEventListener('error',()=>{if(element===next){loadFailed=true;applied=false;mediaStatus.textContent='No se pudo cargar la pieza del interior';}});
      next.src=p.url;
    }
    synchronize();
    if(!loadFailed)mediaStatus.textContent=(applied?'Reflejando · ':'Cargando · ')+p.title+' · '+(p.loop?'playlist base':'condicional');
  }
  window.addEventListener('message',e=>{
    const d=connection?.receive(e);
    if(!d){e.data?.bitmap?.close?.();return;}
    if(d.event==='hello'||d.event==='ready'){
      connected=true;status.textContent='Player interior enlazado · mismo contenido en pared y escaparate';
      if(d.event==='hello')send('ready');return;
    }
    if(!connected){d.bitmap?.close?.();return;}
    if(d.event==='playback'){const p=playbackState(d.playback);if(p)apply(p);else stopMedia();}
    else if(d.event==='playback-off')stopMedia();
    else if(d.event==='camera'){
      const bmp=d.bitmap;
      if(!(bmp instanceof ImageBitmap)||!Number.isFinite(d.frameAt)||Date.now()-d.frameAt>=1500||d.frameAt>Date.now()+1000||bmp.width>480||bmp.height>1920||d.frameAt<=lastCamera){bmp?.close?.();return;}
      camera.width=bmp.width;camera.height=bmp.height;camera.getContext('2d').drawImage(bmp,0,0);bmp.close();camera.hidden=false;lastCamera=d.frameAt;
      const names={person:'personas',car:'coches',motorcycle:'motos',bicycle:'bicis'};
      cameraStatus.textContent='Puerta Cam · presencia: '+Object.entries(names).map(([kind,name])=>`${Math.max(0,Math.min(100,Math.floor(d.counts?.[kind]||0)))} ${name}`).join(' · ');
    }else if(d.event==='camera-off')stopCamera();
    else if(d.event==='disconnect')disconnect();
  });
  function draw(ctx,w,h){
    ctx.save();ctx.fillStyle='#071117';ctx.fillRect(0,0,w,h);
    const fresh=latest&&Date.now()-lastMedia<TTL&&!loadFailed;
    const drawable=fresh&&element&&(latest.type==='image'?element.complete&&element.naturalWidth:latest.type==='video'&&element.readyState>=2);
    if(drawable){
      const vw=element.videoWidth||element.naturalWidth,vh=element.videoHeight||element.naturalHeight;
      const scale=Math.min(w/vw,h/vh);if(vw&&vh)ctx.drawImage(element,(w-vw*scale)/2,(h-vh*scale)/2,vw*scale,vh*scale);
    }else{ctx.textAlign='center';ctx.fillStyle='#8ce8e0';ctx.font=`${Math.max(4,w/16)}px sans-serif`;ctx.fillText(fresh&&latest.type==='audio'?'♪ '+latest.title:'PLAYER VIRTUAL',w/2,h/2,w-6);}
    ctx.restore();return true;
  }
  window.__xtoreWindowPlayer={draw,openCamera(){panel.querySelector('details').open=true;},cameraActive:()=>Date.now()-lastCamera<1500&&lastCamera>0};
  // Click the actual camera position already computed by the isometric renderer.
  document.addEventListener('click',e=>{
    const p=window.XPACE_MUPICAM?.pos,convert=window.__dsQuadCvToClient;
    if(!p||!convert)return;const at=convert([{x:p.x,y:p.y-7}])?.[0];
    if(at&&Math.hypot(e.clientX-at.x,e.clientY-at.y)<20){window.__xtoreWindowPlayer.openCamera();}
  });
  setInterval(()=>{
    if(peer?.closed){disconnect();return;}
    if(peer)send(connected?'heartbeat':'hello');
    if(lastMedia&&Date.now()-lastMedia>=TTL)stopMedia();
    if(lastCamera&&Date.now()-lastCamera>=1500)stopCamera();
  },500);
  window.addEventListener('pagehide',disconnect);
}
