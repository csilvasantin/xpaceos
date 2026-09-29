import {getScreenDisplayMode,subscribeScreenDisplay} from './screen-display.mjs?v=number-layout-1';
export const nextSyncCommand=mode=>mode==='individual'?'/sincro on':'/sincro off';
export const completionFor=(text,mode)=>/^\/(?:sin|sinc|sincr|sincro|syn|sync)$/i.test(text)?nextSyncCommand(mode):null;
export function bindExpertComposer(composer){
 if(!composer)return ()=>{};let suggestion=null;
 function refresh(){composer.placeholder=nextSyncCommand(getScreenDisplayMode());composer.title='Enter: ejecutar / run · Shift+Enter: nueva línea / newline';
  if(suggestion&&composer.value===suggestion.value&&composer.selectionStart===suggestion.start&&composer.selectionEnd===composer.value.length){const next=nextSyncCommand(getScreenDisplayMode());composer.value=next;composer.setSelectionRange(suggestion.start,next.length);suggestion.value=next;}}
 function input(e){if(e.isComposing||String(e.inputType).startsWith('delete')){suggestion=null;return;}const raw=composer.value,next=completionFor(raw,getScreenDisplayMode());suggestion=null;if(!next||composer.selectionStart!==raw.length)return;composer.value=next;composer.setSelectionRange(raw.length,next.length);suggestion={value:next,start:raw.length};}
 function key(e){if(e.key==='Tab'&&suggestion&&composer.value===suggestion.value){e.preventDefault();composer.setSelectionRange(composer.value.length,composer.value.length);suggestion=null;}}
 composer.addEventListener('input',input);composer.addEventListener('keydown',key);const unsubscribe=subscribeScreenDisplay(refresh);refresh();
 globalThis.XpaceExpertComposer={refresh};return ()=>{unsubscribe();composer.removeEventListener('input',input);composer.removeEventListener('keydown',key);delete globalThis.XpaceExpertComposer;};
}
if(typeof document!=='undefined')bindExpertComposer(document.getElementById('telegramComposer'));
