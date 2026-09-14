export const TIER_STORAGE_KEY='xtanco_visual_tier_v2';
export function requestedTier(search='',storage){
  const requested=new URLSearchParams(search).get('visual');
  if(requested!==null)return requested==='life'?'better':['good','better','best'].includes(requested)?requested:'good';
  try{return storage?.getItem(TIER_STORAGE_KEY)==='better'?'better':'good';}catch{return 'good';}
}

/** Public tiers are not the former wireframe/premium painter modes. Best is
 * intentionally unavailable until its photoreal assets have been validated. */
export function createVisualTiers({openBetter,closeBetter,subscribeBetter,storage,onChange=()=>{},onBestRequested=()=>{}}){
  let mode='good',busy=false,notice='',isOpen=false;
  const publish=()=>onChange({mode,busy,notice});
  function save(){try{storage?.setItem(TIER_STORAGE_KEY,mode);}catch{}}
  const unsubscribe=subscribeBetter?.(state=>{
    isOpen=state.open;mode=isOpen?'better':'good';busy=state.busy;notice=state.error||'';
    if(state.reason!=='pagehide')save();publish();
  });
  async function choose(value){
    const next=value==='life'?'better':value;notice='';
    if(next==='better'){
      if(isOpen){publish();return;}
      mode='better';busy=true;save();publish();
      try{await openBetter();}catch(error){closeBetter();mode='good';busy=false;notice='Better no disponible · puedes reintentar';save();publish();}
      return;
    }
    closeBetter();mode='good';busy=false;
    if(next==='best'){notice='Best · fotorealista en preparación. Pendiente de modelado y materiales del Xtanco.';onBestRequested();}
    save();publish();
  }
  publish();
  return {choose,get mode(){return mode;},dispose(){unsubscribe?.();closeBetter();}};
}
