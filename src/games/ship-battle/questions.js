import {TOPICS} from '../shared/content/topics.js?v=11';
import {arithmetic} from '../shared/content/arithmetic.js?v=11';
const names={phonics:'Phonics',vocabulary:'Vocabulary',spelling:'Spelling',math:'Mathematics',science:'Science'};
export function practiceName(config){return 'Ocean practice · '+names[config.topic]+' · 5 questions';}
export function buildQuestions(config){
 if(config.topic==='math')return arithmetic(config.difficulty);
 const rows=TOPICS[config.topic];if(!rows)throw Error('Choose a learning topic.');
 return rows.map(([prompt,choices,answer],i)=>({id:config.topic+'-'+i,input:'choice',prompt,answer,options:choices.map(value=>({value,label:value})),hint:config.topic==='spelling'?'Say the word slowly and listen for the missing sound.':'Read each choice carefully. Think about the clue.'}));
}
