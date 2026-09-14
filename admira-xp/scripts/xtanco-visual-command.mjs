// Visual modes affect only this browser. This command has no bot, network,
// game-state or legacy /render dependency: the public tier router owns the view.
const aliases=new Map([
  ['good','good'],['8','good'],['8bit','good'],['8-bit','good'],
  ['better','better'],['life','better'],['16','better'],['16bit','better'],['16-bit','better'],
  ['best','best'],['32','best'],['32bit','best'],['32-bit','best'],['hiperrealista','best'],['hyperrealistic','best']
]);

export function parseVisualCommand(input){
  const match=String(input||'').trim().match(/^\/?(?:modo|mode)(?:@\w+)?(?:\s+([\s\S]*))?$/i);
  if(!match)return null;
  const argument=(match[1]||'').trim().toLowerCase();
  if(!argument||['help','ayuda','?'].includes(argument))return {help:true};
  if(['estado','status'].includes(argument))return {status:true};
  const tier=aliases.get(argument);
  if(tier)return {tier};
  // This XpaceOS dispatcher has no /modo store-code command. Keep typos and
  // extra tokens local too, so they cannot fall through to the Telegram echo.
  return {help:true,invalid:true};
}

export async function executeVisualCommand(input,{router,lang='es'}={}){
  const command=parseVisualCommand(input);if(!command)return null;
  const en=lang==='en';
  if(command.help)return {ok:!command.invalid,local:true,message:en
    ? 'Local visual styles (twin console or __xtExec): /mode good · Good 8-bit; /mode better · Better 16-bit (isometric 3D); /mode best · Best 32-bit / hyperrealistic (in preparation). /modo, 8/16/32 and /mode status are also accepted.'
    : 'Estilos visuales locales (consola del gemelo o __xtExec): /modo good · Good 8-bit; /modo better · Better 16-bit (3D isométrico); /modo best · Best 32-bit / hiperrealista (en preparación). También /mode, 8/16/32 y /modo estado.'};
  if(typeof router?.choose!=='function')return {ok:false,local:true,message:en
    ? 'The visual selector is not ready. Try again from Expert mode.'
    : 'El selector visual no está listo. Reintenta desde Experto.'};
  if(command.status){
    const mode=router.mode,label={good:'Good · 8-bit',better:'Better · 16-bit'}[mode];
    return {ok:!!label,local:true,mode,message:label
      ? (en?'Current local visual mode: ':'Modo visual local actual: ')+label+'.'
      : (en?'The local visual mode is not available.':'El modo visual local no está disponible.')};
  }
  try{await router.choose(command.tier);}catch{
    return {ok:false,local:true,message:en?'Could not change the visual mode. Try again from Expert mode.':'No se pudo cambiar el modo visual. Reintenta desde Experto.'};
  }
  const mode=router.mode;
  if(command.tier==='best')return {ok:false,local:true,mode,requested:'best',message:en
    ? 'Best · 32-bit / hyperrealistic is in preparation and is not available yet. Good remains available; /mode better opens the current isometric 3D view.'
    : 'Best · 32-bit / hiperrealista está en preparación y todavía no está disponible. Good sigue disponible; /modo better abre la vista 3D isométrica actual.'};
  if(mode!==command.tier)return {ok:false,local:true,mode,requested:command.tier,message:en
    ? 'The requested view could not open. The current twin remains available; try again from Expert mode.'
    : 'No se pudo abrir la vista solicitada. El gemelo actual sigue disponible; reintenta desde Experto.'};
  return {ok:true,local:true,mode,message:mode==='good'
    ? (en?'Good · 8-bit: back to the classic twin and its controls.':'Good · 8-bit: vuelta al gemelo clásico y sus controles.')
    : (en?'Better · 16-bit: opening the live isometric 3D twin. Use “Back to twin” to return.':'Better · 16-bit: abriendo el gemelo 3D isométrico en vivo. Usa «Volver al gemelo» para regresar.')};
}
