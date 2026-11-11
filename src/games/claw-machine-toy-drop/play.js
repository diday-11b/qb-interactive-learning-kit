export {buildQuestions} from './questions.js?v=11';
export function mount(rt){let selected=null;return {render(area){
 const {session:s,element:e}=rt,q=s.question;
 const world=e('section','claw-cabinet'),rail=e('div','claw-rail'),claw=e('div','moving-claw','⋂');claw.setAttribute('aria-hidden','true');claw.style.left=((Math.max(0,selected)*25)+12.5)+'%';rail.append(claw);world.append(rail);
 const toys=e('div','toy-shelf');q.options.forEach((o,i)=>{const pick=rt.button('',()=>{if(s.phase!=='question')return;selected=i;rt.paint();},'toy-target');pick.setAttribute('aria-label','Move claw to '+o.label);pick.setAttribute('aria-pressed',String(selected===i));pick.disabled=s.phase!=='question';if(o.image){const image=e('img');image.src=o.image;image.alt='';pick.append(image);}pick.append(e('span','',o.label));toys.append(pick);});world.append(toys,e('p','collection-count','Toys collected '+s.solved+' / '+s.total));area.append(world);
 const panel=e('section','play-card');panel.append(e('h2','',q.prompt),e('p','','Move the claw above the matching word. Then drop it!'));rt.hint(panel,q);
 const drop=rt.button('Drop claw',()=>{if(selected===null)return;const result=rt.answer(q.options[selected].value);if(!result.accepted)return;
  if(!result.correct){rt.paint();return;}if(!rt.reward())return;claw.classList.add('claw-dropping');toys.children[selected].classList.add('toy-grabbed');rt.animate(1000,()=>{selected=null;rt.next();});
 },'qb-button qb-button--mint');drop.disabled=selected===null||s.phase!=='question';panel.append(drop);area.append(panel);
}};}
