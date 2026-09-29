// Published Stock assets selected for this venue. Keep durable references here:
// /hilomusical/next is a delivery queue with a 24-hour retention period.
export const STARBUCKS_PLAYLIST={
  schemaVersion:1,
  id:'starbucks-alsea-paseo-de-gracia',
  title:'Starbucks Alsea · Paseo de Gracia · hiloMusical',
  playback:{order:'sequential',repeat:'all',screenMuted:true,audioOwner:'XpaceOS speaker',crossDeviceSync:false},
  localState:{api:'window.XpaceStarbucksMusic',event:'xpaceos:starbucks-music',scope:'local-page',schemaVersion:1,physicalMugVerified:false},
  tracks:[{
  stockId:'1790706121644-y5mqrq',
  title:'Bad Times Deep House',
  url:'https://stock.admira.store/stock/1790706121644-y5mqrq/asset.mp4?v=35775129',
  duration:400.962177,
  mimeType:'video/mp4'
  }]
};
export const STARBUCKS_PUBLISHED_TRACKS=STARBUCKS_PLAYLIST.tracks;
