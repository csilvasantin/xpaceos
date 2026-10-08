import * as T from '../admira-xp/scripts/premium-three.mjs';

// Local light panels provide reflections without a network HDRI or image asset.
export function createMatrixEnvironmentRoom(){
 const room=new T.Scene(),owned=[];
 room.background=new T.Color(.33,.36,.34);
 const add=(geometry,material,position,rotation=[0,0,0])=>{
  const mesh=new T.Mesh(geometry,material);mesh.position.set(...position);mesh.rotation.set(...rotation);room.add(mesh);owned.push(geometry,material);return mesh;
 };
 add(new T.BoxGeometry(10,8,10),new T.MeshBasicMaterial({color:new T.Color(.45,.48,.46),side:T.BackSide}),[0,3,0]);
 for(const [position,size,rotation,color]of [
  [[-3.8,3,0],[3,5],[0,Math.PI/2,0],[5.5,5.8,6]],
  [[3.8,3,1],[3,5],[0,-Math.PI/2,0],[6,5.4,4.6]],
  [[0,6.5,0],[5,5],[Math.PI/2,0,0],[4.2,4.3,4.1]],
  [[0,3,-4.5],[4,4],[0,0,0],[2.1,2.5,2.8]]
 ])add(new T.PlaneGeometry(...size),new T.MeshBasicMaterial({color:new T.Color(...color),side:T.DoubleSide}),position,rotation);
 return {room,dispose(){owned.forEach(resource=>resource.dispose());room.clear();}};
}

export function configureMatrixRenderer(renderer){
 renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
}

export function createMatrixStudio(renderer,scene){
 configureMatrixRenderer(renderer);
 const {room,dispose:disposeRoom}=createMatrixEnvironmentRoom();
 const pmrem=new T.PMREMGenerator(renderer);let environment;
 try{environment=pmrem.fromScene(room,.04);}finally{pmrem.dispose();disposeRoom();}
 scene.environment=environment.texture;
 const key=new T.DirectionalLight('#fff0df',3.6);key.position.set(4,7,5);key.castShadow=true;
 key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=6;key.shadow.camera.bottom=-5;
 key.shadow.camera.near=.1;key.shadow.camera.far=22;key.shadow.bias=-.00015;key.shadow.normalBias=.012;key.shadow.radius=4;
 const fill=new T.DirectionalLight('#d7e5f2',.8);fill.position.set(-4,3,-2);
 const ambient=new T.HemisphereLight('#f8f9f6','#646d60',.45);
 const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.MeshPhysicalMaterial({color:'#e8ebe4',roughness:.8,metalness:0}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.012;floor.receiveShadow=true;
 scene.add(key,fill,ambient,floor);
 return {dispose(){scene.environment=null;environment.dispose();key.shadow.dispose();floor.geometry.dispose();floor.material.dispose();scene.remove(key,fill,ambient,floor);}};
}
