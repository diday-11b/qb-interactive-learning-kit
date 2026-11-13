import {isAvailable} from './shared/availability.js?v=11';
import {games} from './registry.js?v=13';
import {element,link} from './shared/dom.js?v=11';
import {gameHref} from './shared/question-selection.js?v=11';
import {journey,selectedSet} from './shared/navigation.js?v=11';
const literacy = new Set(['alphabet_learning','phonics','spelling','vocabulary','reading']);
const categoryNames={phonics:'Phonics',spelling:'Spelling',math:'Math',vocabulary:'Vocabulary',matching:'Matching'};
// Rabbit Racing has a standalone player in this deployment.
const rabbitRacing = Object.freeze({
 slug:'rabbit-racing',
 title:'Rabbit Racing',
 description:'Answer 30 maths questions to race your rabbit against Dash.',
 category:'math',
 language:'en',
 thumbnail:'/games/rabbit-racing/thumbnail.svg'
});
const wheel = Object.freeze({
 slug:'wheel-spin-carnival', title:'Wheel Spin Carnival',
 description:'Add group members and spin the wheel to select a name at random.',
 category:'math', language:'en', thumbnail:'/assets/game-art/wheel-spin-carnival.svg'
});
const standaloneGames = [rabbitRacing, wheel];
const catalogGames = [...games, wheel, rabbitRacing];

export function filterGames(items,{search='',view='all',language=''}={}) {
 const term=search.trim().toLocaleLowerCase();
 return items.filter(game => (!term || [game.title,game.description,game.category,game.language==='dual'?'English Khmer bilingual':'English'].join(' ').toLocaleLowerCase().includes(term)) && (view==='all' || (view==='literacy'?literacy.has(game.category):!literacy.has(game.category))) && (!language || game.language===language || game.language==='dual'));
}
export function renderCatalog(root,selection) {
 document.title='Choose a Game — QB Interactive Learning Kits';
 root.replaceChildren(journey(selection));
 const heading=element('header','page-title');heading.append(element('h1','','Choose a Game!'),element('p','subtitle','Pick your next learning adventure'));root.append(heading,selectedSet(selection));
 const searchRow=element('div','search-row');
 const search=element('input','search');search.type='search';search.placeholder='Search games…';search.setAttribute('aria-label','Search games');search.autocomplete='off';
 const toggle=element('button','filter-toggle','☰ Filters');toggle.type='button';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','game-filters');searchRow.append(search,toggle);
 const filters=element('div','filters');filters.id='game-filters';filters.hidden=true;
 const label=element('label','game-language-label','Language');const language=element('select');language.id='game-language';label.htmlFor=language.id;
 [['','Any language'],['en','English'],['km','Khmer']].forEach(([value,text])=>{const option=element('option','',text);option.value=value;language.append(option);});label.append(language);
 const clear=element('button','filter-chip','Clear filters');clear.type='button';filters.append(label,clear);
 const tabs=element('nav','collection-tabs');tabs.setAttribute('aria-label','Game categories');
 let view='all';
 [['all','🎮','All Games'],['literacy','📖','Literacy Games'],['more','⭐','Math & More']].forEach(([key,icon,text])=>{
  const button=element('button','collection-tab');button.type='button';button.dataset.view=key;button.setAttribute('aria-pressed',String(key===view));
  button.append(element('span','collection-icon',icon),element('span','collection-name',text));
  button.addEventListener('click',()=>{view=key;tabs.querySelectorAll('button').forEach(tab=>tab.setAttribute('aria-pressed',String(tab===button)));update();});tabs.append(button);
 });
 const panel=element('section','game-library-panel');panel.setAttribute('aria-label','Game library');
 const listHeading=element('div','list-heading');listHeading.append(element('h2','','Games to explore'));
 const count=element('span','selected-count');count.setAttribute('role','status');listHeading.append(count);
 const grid=element('div','game-grid');
 const empty=element('p','empty','No games match these filters. Try another search or clear the filters.');empty.hidden=true;empty.setAttribute('role','status');
 panel.append(searchRow,filters,listHeading,grid,empty);root.append(tabs,panel);
 function update(){
  const matches=filterGames(catalogGames,{search:search.value,view,language:language.value});count.textContent=matches.length+' '+(matches.length===1?'game':'games');empty.hidden=matches.length>0;
  grid.replaceChildren(...matches.map(game=>{
   const card=element('article','game-card');card.dataset.game=game.slug;
   const standalone=standaloneGames.includes(game)||game.slug==='alien-spelling';
   const ready=standalone || isAvailable(game);
   const href=standalone
    ? '/games/'+game.slug+'/'+gameHref(null,selection).slice('/games/'.length)
    : gameHref(game.slug,selection);
   const art=element('div','game-thumbnail');
   if(game.thumbnail){
    const image=element('img');image.src=game.thumbnail;image.alt='';image.width=640;image.height=400;image.loading='lazy';image.decoding='async';art.append(image);
   }else{
    const fallback=element('span','game-thumbnail-fallback','🎮');fallback.setAttribute('aria-hidden','true');art.append(fallback);
   }
   const action=ready
    ? link('Play Now',href,'card-action game-availability game-availability--ready')
    : element('button','card-action game-availability game-availability--soon','Coming Soon');
   if(!ready){action.type='button';action.disabled=true;}
   const content=element('div','game-card-content');content.append(element('span','card-kind',categoryNames[game.category]),element('h3','',game.title),element('p','',game.description));
   const tags=element('div','card-tags');tags.append(element('span','card-tag',game.language==='dual'?'English + Khmer':'English'));content.append(tags,action);card.append(art,content);return card;
  }));
 }
 toggle.addEventListener('click',()=>{filters.hidden=!filters.hidden;toggle.setAttribute('aria-expanded',String(!filters.hidden));});
 search.addEventListener('input',update);language.addEventListener('change',update);
 clear.addEventListener('click',()=>{search.value='';language.value='';view='all';tabs.querySelectorAll('button').forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.view==='all')));update();});update();
}
