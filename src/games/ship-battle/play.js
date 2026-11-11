import {element} from '../shared/dom.js?v=11';
export {buildQuestions} from './questions.js?v=11';
export function mount(rt){
 let open=false;
 return {render(area){
  const s=rt.session,q=s.question;
  const world=element('section','ocean-board');world.setAttribute('aria-label','Sailing toward Discovery Island');
  const background=element('img','ocean-background');background.src='/src/games/ship-battle/assets/environment.svg';background.alt='An ocean with an island, fish, turtle and dolphin swimming below the water.';background.width=1000;background.height=450;
  const ship=element('img','captain-boat');ship.src='/src/games/ship-battle/assets/captain-ship.svg';ship.alt='Your captain’s ship';ship.style.left=(4+s.solved/s.total*70)+'%';ship.dataset.color=rt.config.shipColor;world.append(background,ship);
  const panel=element('section','play-card');
  if(open && ['question','feedback'].includes(s.phase)){
   panel.append(element('h2','',q.prompt));rt.hint(panel,q);
   const answers=element('div','answer-grid');q.options.forEach((option,i)=>{const b=rt.button(String.fromCharCode(65+i)+' · '+option.label,()=>{const result=rt.answer(option.value);if(result.accepted&&result.correct)open=false;rt.paint();},'answer-button answer-'+i);b.disabled=s.phase!=='question';answers.append(b);});panel.append(answers);
  }else{
   panel.append(element('h2','',s.phase==='ready'?'Correct! Set sail!':'Your next discovery is waiting.'),element('p','','Answer a question to sail closer to Discovery Island.'));
   if(s.phase==='question')panel.append(rt.button('Open question',()=>{open=true;rt.paint();},'qb-button qb-button--blue'));
   if(s.phase==='ready')panel.append(rt.button('Set sail',()=>{
    const from=4+s.solved/s.total*70,to=4+(s.solved+1)/s.total*70;
    if(!rt.reward())return;
    ship.style.setProperty('--from',from+'%');ship.style.setProperty('--to',to+'%');ship.classList.add('sailing');rt.animate(800,()=>{open=false;rt.next();});
   },'qb-button qb-button--mint'));
  }
  area.append(world,panel);
 }};
}
