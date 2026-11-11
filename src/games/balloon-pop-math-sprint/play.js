export {buildQuestions} from '../shared/content/arithmetic.js?v=11';
export function mount(rt){return {render(area){
 const {session:s,element:e}=rt,q=s.question,panel=e('section','play-card');panel.append(e('h2','',q.prompt),e('p','','Pop the balloon with the correct answer.'));rt.hint(panel,q);area.append(panel);
 const sky=e('section','balloon-sky');sky.setAttribute('aria-label','Answer balloons');q.options.forEach((o,i)=>{const b=rt.button(o.label,()=>{const result=rt.answer(o.value);if(!result.accepted)return;if(!result.correct){rt.paint();return;}if(!rt.reward())return;b.classList.add('balloon-popped');rt.animate(600,()=>rt.next());},'number-balloon balloon-'+i);b.setAttribute('aria-label','Pop '+o.label);b.disabled=s.phase!=='question';b.style.setProperty('--delay',(-i*.7)+'s');sky.append(b);});area.append(sky,e('p','collection-count','Balloons popped '+s.solved+' / '+s.total));
}};}
