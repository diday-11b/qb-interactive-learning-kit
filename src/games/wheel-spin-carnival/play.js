export {buildQuestions} from '../shared/content/arithmetic.js?v=11';
export function mount(rt){return {render(area){
 const {session:s,element:e}=rt,q=s.question,prizes=[10,20,30,40,50,100];
 const world=e('section','carnival-world'),pointer=e('span','wheel-pointer','▼'),wheel=e('div','prize-wheel');wheel.setAttribute('role','img');wheel.setAttribute('aria-label','Prize wheel: '+prizes.join(', ')+' points');
 prizes.forEach((n,i)=>{const label=e('span','wheel-prize',String(n));label.style.setProperty('--sector',i);wheel.append(label);});
 const outcome=e('p','wheel-outcome','Solve the question to unlock your spin.');outcome.setAttribute('aria-live','polite');world.append(pointer,wheel,outcome);area.append(world);
 const panel=e('section','play-card');panel.append(e('h2','',q.prompt));rt.hint(panel,q);
 if(s.phase==='ready')panel.append(rt.button('Spin wheel',()=>{
  const index=Math.floor(Math.random()*prizes.length),bonus=prizes[index];if(!rt.reward(bonus))return;
  // Sector centers begin 30deg clockwise from the top. Rotate the selected center to the fixed pointer.
  wheel.style.setProperty('--spin',(1800+360-(index*60+30))+'deg');wheel.classList.add('wheel-spinning');
  outcome.textContent='Spinning…';rt.animate(1400,()=>{outcome.textContent='You won '+bonus+' bonus points!';rt.animate(900,()=>rt.next());});
 },'qb-button qb-button--mint'));
 else{const choices=e('div','answer-grid');q.options.forEach((o,i)=>{const b=rt.button(o.label,()=>{rt.answer(o.value);rt.paint();},'answer-button answer-'+i);b.disabled=s.phase!=='question';choices.append(b);});panel.append(choices);}area.append(panel);
}};}
