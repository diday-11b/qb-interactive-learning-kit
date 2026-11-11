import {WORDS} from '../shared/content/words.js?v=11';
export const practiceName=c=>'Spelling practice · '+c.difficulty+' · '+c.activity+' · 5 words';
export function buildQuestions(c){return WORDS[c.difficulty].map((w,i)=>{
 const type=c.activity==='mixed'?[c.difficulty==='easy'?'picture':'listen','listen','complete','listen','complete'][i]:c.activity;
 const complete=type==='complete';
 return {id:'spell-'+w.word,input:'text',prompt:complete?'Complete the word: '+w.fragment[0]:'Spell the word: '+w.definition,answer:complete?w.fragment[2]:w.word,word:w.word,definition:w.definition,hint:w.hint,image:w.image,type,tiles:complete?w.fragment[1]:[...w.word,...w.wrong[0].slice(0,2)]};
});}
