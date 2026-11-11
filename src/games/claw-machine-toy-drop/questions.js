import {WORDS} from '../shared/content/words.js?v=11';
export const practiceName=c=>'Word meanings practice · '+c.difficulty+' · 5 words';
export function buildQuestions(c){const words=WORDS[c.difficulty];return words.map((w,i)=>({
 id:'word-'+w.word,input:'choice',word:w.word,definition:w.definition,image:w.image,hint:w.hint,
 prompt:false?'Match each word to its meaning.':w.definition,
 answer:false?w.word:w.word,
 options:(false?words:words.filter((_,j)=>j!==((i+4)%5))).map(other=>({value:other.word,label:false?other.definition:other.word,image:other.image}))
}));}
