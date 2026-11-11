import {element, link} from './dom.js?v=11';
import {gameHref} from './question-selection.js?v=11';
export function journey(selection, introduction = false) {
 const nav = element('nav', 'journey'); nav.setAttribute('aria-label','How it works');
 const steps=[['Pick or create questions','▱','/questions/#question-sets'],['Choose a game','♧',gameHref(null,selection)],['Play!','▷',introduction ? '#game-introduction' : null]];
 steps.forEach(([label,symbol,href],i)=>{
  if(i){const arrow=element('span','journey-arrow','›');arrow.setAttribute('aria-hidden','true');nav.append(arrow);}
  const item=href ? link('',href,'') : element('button');
  if(!href){item.type='button';item.disabled=true;item.setAttribute('aria-disabled','true');item.title='Play is not available yet';}
  const icon=element('span','journey-icon');icon.setAttribute('aria-hidden','true');icon.append(element('span','step-number',String(i+1)),element('span','',symbol));
  const text=element('span','',label);
  if(i===0) text.replaceChildren(document.createTextNode('Pick or create'),element('br'),document.createTextNode('questions'));
  item.append(icon,text);
  if(i===(introduction?2:1)) item.setAttribute('aria-current','step');
  nav.append(item);
 });return nav;
}
export function selectedSet(selection) {
 const box=element('aside','game-selection');box.setAttribute('aria-label','Selected question set');
 if(selection.status==='selected') {
  box.append(element('strong','',selection.questionSet.name),element('span','',selection.questionSet.kind+' · '+selection.questionSet.count+' questions listed'));
 } else box.append(element('strong','',selection.status==='invalid'?'This question set could not be found.':'Choose a question set for your adventure.'));
 box.append(link(selection.status==='selected'?'Change questions':'Pick questions','/questions/#question-sets','game-text-link'));
 return box;
}
