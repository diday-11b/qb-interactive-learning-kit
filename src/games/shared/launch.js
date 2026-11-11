import {isAvailable} from './availability.js?v=11';
import {validateSettings} from './settings-state.js?v=11';
const PREFIX='qb-interactive-learning-kits.launch.';
function key(game,selection){return PREFIX+game.slug+'.'+encodeURIComponent(selection?.questionSet?.name||'no-question-set');}
export function prepareLaunch(game,selection,config,storage){
 if(!isAvailable(game)||validateSettings(game.settings,config).length)throw Error('Review your game options before play.');
 const launch={config:structuredClone(config),accepted:true,at:Date.now()};
 try{(storage||globalThis.sessionStorage).setItem(key(game,selection),JSON.stringify(launch));}catch{}
 return launch;
}
export function takeLaunch(game,selection,storage){
 try{const store=storage||globalThis.sessionStorage,raw=store.getItem(key(game,selection));store.removeItem(key(game,selection));const launch=JSON.parse(raw||'null');if(launch?.accepted===true&&Date.now()-launch.at>=0&&Date.now()-launch.at<120000&&!validateSettings(game.settings,launch.config).length)return launch;}catch{}
 return null;
}
