import {isAvailable} from './shared/availability.js?v=11';
import {startGame} from './shared/play.js?v=11';
import {renderSettings} from './shared/settings.js?v=11';
import {findGame} from './registry.js?v=13';
import {loadSelection,gameHref} from './shared/question-selection.js?v=11';
import {renderCatalog} from './catalog.js?v=14';
import {renderIntroduction} from './shared/introduction.js?v=11';
import {element,link} from './shared/dom.js?v=11';
const root=document.querySelector('#game-app');
try {
 const selection=await loadSelection(location.search);
 const slug=new URLSearchParams(location.search).get('game');
 if(slug==='wheel-spin-carnival'||slug==='alien-spelling'){
  location.replace('/games/'+slug+'/'+gameHref(null,selection).slice('/games/'.length));
 } else if(slug){
  const game=findGame(slug);
  if(!game){document.title='Game not found — QB Interactive Learning Kits';root.replaceChildren(element('h1','','Game not found'),element('p','','Choose a game from the library.'),link('Back to Game Library','/games/'));}
  else if(!isAvailable(game)){
   document.title=game.title+' — Coming Soon';
   root.replaceChildren(element('h1','',game.title),element('p','','Coming Soon'),link('Back to Game Library',gameHref(null,selection)));
  }
  else {
   const view=new URLSearchParams(location.search).get('view');
   if(view==='play' && game.gameplay) await startGame(root,game,selection);
   else if(view==='settings' && game.settings) renderSettings(root,game,selection);
   else if(view){document.title='Screen unavailable — QB Interactive Learning Kits';root.replaceChildren(element('h1','','This screen is not available'),link('Back to Introduction',gameHref(game.slug,selection)));}
   else renderIntroduction(root,game,selection);
  }
 } else renderCatalog(root,selection);
 root.removeAttribute('aria-busy');
} catch(error) {
 root.removeAttribute('aria-busy');
 const message=element('p','','We could not load the game library. Please try again.');message.setAttribute('role','alert');
 const retry=element('button','qb-button','Try again');retry.type='button';retry.addEventListener('click',()=>location.reload());
 root.replaceChildren(element('h1','','Let’s try that again'),message,retry,link('Back to questions','/questions/#question-sets'));
}

window.addEventListener('popstate',()=>location.reload());
