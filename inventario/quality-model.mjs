export const BASE_PROFILES=Object.freeze(['good','better','best']);
export const MATRIX_ASSET_NUMBER=47;
// Matrix (PBR de estudio) e Hiperreal (PBR CC0 2K-4K, imperfección y luz de tienda) sólo existen para la pieza 47.
export const PHOTOREAL_PROFILES=Object.freeze(['matrix','hiperreal']);

export function qualityProfiles(number){return number===MATRIX_ASSET_NUMBER?[...BASE_PROFILES,...PHOTOREAL_PROFILES]:[...BASE_PROFILES];}
export function supportsQuality(number,quality){return qualityProfiles(number).includes(quality);}
export function isPhotoreal(number,quality){return number===MATRIX_ASSET_NUMBER&&PHOTOREAL_PROFILES.includes(quality);}
export function selectedQuality(number,quality){return quality==='all'||supportsQuality(number,quality)?quality:'best';}
export function comparisonProfiles(number,quality){return quality==='all'?qualityProfiles(number):[selectedQuality(number,quality)];}
export function qualityLabel(quality){return quality[0].toUpperCase()+quality.slice(1);}
export function catalogFrontAngle(number){return [2,MATRIX_ASSET_NUMBER].includes(number)?Math.PI/2:0;}
