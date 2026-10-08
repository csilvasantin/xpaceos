export const COFFEE_COLLECTION_PATH='/inventario/assets/catalog/47/collection/preview/';
// Read-only model collection; preserve only explicit navigation preferences.
export function coffeeCollectionURL(baseURL){
 const base=new URL(baseURL),url=new URL(COFFEE_COLLECTION_PATH,base.origin);
 for(const key of ['lang','marca','loc','project','circuit'])if(base.searchParams.has(key))url.searchParams.set(key,base.searchParams.get(key));
 return url;
}
