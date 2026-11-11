export {buildQuestions} from './questions.js?v=11';
import {shuffle} from '../shared/session.js?v=11';
export function mount(rt){let draft='';return {render(area){
 const {session:s,element:e}=rt,q=s.question;
 const sky=e('section','shuttle-world');sky.setAttribute('aria-label','Shuttle energy '+s.solved+' of '+s.total);
 const craft=e('img','mission-shuttle');craft.src='/src/games/alien-spelling/assets/shuttle.svg';craft.alt='Friendly alien in a spelling shuttle';
 sky.append(craft,e('p','energy-meter','Energy '+s.solved+' / '+s.total));area.append(sky);
 const panel=e('section','play-card');panel.append(e('h2','',q.prompt));
 if(q.image&&q.type==='picture'){const image=e('img','word-picture');image.src=q.image;image.alt=q.definition;panel.append(image);}
 panel.append(rt.button('Hear word',()=>rt.speak(q.word)));rt.hint(panel,q);
 if(s.phase==='ready')panel.append(rt.button('Launch Shuttle',()=>{if(!rt.reward())return;craft.classList.add('shuttle-launch');rt.animate(850,()=>{draft='';rt.next();});},'qb-button qb-button--mint'));
 else {
 const form=e('form','spelling-entry'),label=e('label','','Your spelling'),input=e('input');input.id='spelling-answer';label.htmlFor=input.id;input.type='text';input.value=draft;input.maxLength=64;input.autocomplete='off';input.spellcheck=false;input.disabled=s.phase!=='question';input.addEventListener('input',()=>{draft=input.value;});
 const tiles=e('div','letter-tiles');shuffle(q.tiles).forEach(letter=>{const b=rt.button(letter.toUpperCase(),()=>{draft=(draft+letter).slice(0,64);input.value=draft;input.focus();},'letter-tile');b.disabled=s.phase!=='question';tiles.append(b);});
 const clear=rt.button('Clear letters',()=>{draft='';input.value='';input.focus();});clear.disabled=s.phase!=='question';
 const check=rt.button('Check Spelling',()=>{});check.type='submit';check.disabled=s.phase!=='question';form.append(label,input,tiles,clear,check);form.addEventListener('submit',event=>{event.preventDefault();if(rt.answer(input.value).accepted)rt.paint();});panel.append(form);
 }
 area.append(panel);
}};}
