export const STOCK_URL='https://api.admira.store/stock/list?type=furni&limit=200';
export function safeAsset(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='api.admira.store'&&u.pathname.startsWith('/stock/asset/')?u.href:null;}catch{return null;}}
export function fromPixeria(item){
 if(item?.type!=='furni'||typeof item.id!=='string'||!safeAsset(item.url))return null;
 return {id:'pixeria:'+item.id,type:'custom',name:String(item.title||'Mueble Pixeria').slice(0,120),category:'Pixeria',mount:'floor',source:'Pixeria',views:/4 caras/.test(item.comment||'')?4:1,img:safeAsset(item.url),fp:Array.isArray(item.fp)?item.fp.slice(0,2).map(v=>Math.max(.1,Math.min(10,Number(v)||1))):[1,1],ph:Math.max(12,Math.min(200,Number(item.ph)||46))};
}
export function assetForInstance(item){return item.type==='custom'?'pixeria:'+(/\/stock\/asset\/([^/?]+)/.exec(item.img||'')?.[1]||item.id):'native:'+item.type;}
export function instancesFor(asset,layout){return layout.filter(i=>assetForInstance(i)===asset.id);}
