export {buildQuestions} from './questions.js?v=11';
import {shuffle} from '../shared/session.js?v=11';
export function mount(rt){let selected=null;const meanings=shuffle(rt.session.questions);return {render(area){
 const {session:s,element:e}=rt,world=e('section','alchemy-world'),flask=e('div','alchemy-flask'),liquid=e('div','potion-liquid');liquid.style.height=(s.solved/s.total*100)+'%';flask.append(liquid,e('span','','Potion '+s.solved+' / '+s.total));world.append(flask);area.append(world);
 const panel=e('section','play-card');panel.append(e('h2','','Match words to brew your potion'),e('p','','Choose a word, then its meaning. Each correct pair adds an ingredient.'));
 const board=e('div','matching-board'),words=e('div','match-column'),definitions=e('div','match-column');
 s.questions.forEach(q=>{if(s.completed.has(q.id))return;const b=rt.button(q.word,()=>{if(s.activate(q.id)){selected=q.id;rt.paint();}},'match-tile');b.disabled=s.phase!=='question';b.setAttribute('aria-pressed',String(selected===q.id));words.append(b);});
 meanings.forEach(q=>{if(s.completed.has(q.id))return;const b=rt.button(q.definition,()=>{if(!selected)return;const result=rt.answer(q.word);if(!result.accepted)return;if(!result.correct){rt.paint();return;}if(!rt.reward())return;liquid.style.height=(s.solved/s.total*100)+'%';flask.classList.add('potion-mixing');rt.animate(850,()=>{selected=null;rt.next();});},'match-tile');b.disabled=!selected||s.phase!=='question';definitions.append(b);});board.append(words,definitions);panel.append(board);if(selected)rt.hint(panel,s.question);area.append(panel);
}};}
