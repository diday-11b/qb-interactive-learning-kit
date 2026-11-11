// Authoritative local-round state. UI events cannot award twice or advance past completion.
export function validQuestion(q){
 if(!q || typeof q.id!=='string'||!q.id||typeof q.prompt!=='string'||!q.prompt||typeof q.answer!=='string'||!q.answer)return false;
 if(q.input==='text')return true;
 return Array.isArray(q.options)&&q.options.length>=2&&q.options.every(o=>typeof o.value==='string'&&typeof o.label==='string')&&new Set(q.options.map(o=>o.value)).size===q.options.length&&q.options.filter(o=>o.value===q.answer).length===1;
}
export class Session{
 constructor(questions){
  if(!Array.isArray(questions)||!questions.length||questions.some(q=>!validQuestion(q))||new Set(questions.map(q=>q.id)).size!==questions.length)throw Error('This question bank needs review.');
  this.questions=structuredClone(questions);this.index=0;this.phase='question';this.paused=false;this.completed=new Set();this.attempts=new Map();this.wrongAttempts=0;this.bonus=0;
 }
 get question(){return this.questions[this.index];}
 get total(){return this.questions.length;}
 get solved(){return this.completed.size;}
 get firstTry(){return this.questions.filter(q=>this.completed.has(q.id)&&this.attempts.get(q.id)===1).length;}
 activate(id){if(this.paused||this.phase!=='question'||this.completed.has(id))return false;const i=this.questions.findIndex(q=>q.id===id);if(i<0)return false;this.index=i;return true;}
 submit(value){
  if(this.paused||this.phase!=='question'||typeof value!=='string'||!value.trim()||value.length>64)return {accepted:false};
  const q=this.question;if(q.input!=='text'&&!q.options.some(o=>o.value===value))return {accepted:false};
  const correct=q.input==='text'?value.trim().toLowerCase()===q.answer.toLowerCase():value===q.answer;
  this.attempts.set(q.id,(this.attempts.get(q.id)||0)+1);this.phase=correct?'ready':'feedback';if(!correct)this.wrongAttempts++;
  return {accepted:true,correct};
 }
 retry(){if(this.paused||this.phase!=='feedback')return false;this.phase='question';return true;}
 reward(bonus=0){if(this.paused||this.phase!=='ready'||!Number.isSafeInteger(bonus)||bonus<0||bonus>1000)return false;this.completed.add(this.question.id);this.bonus+=bonus;this.phase='animating';return true;}
 advance(){if(this.paused||this.phase!=='animating')return false;if(this.solved===this.total){this.phase='complete';this.index=-1;}else{this.index=this.questions.findIndex(q=>!this.completed.has(q.id));this.phase='question';}return true;}
 result(){if(this.phase!=='complete')throw Error('The round is not complete.');return {completed:this.solved,total:this.total,firstTry:this.firstTry,wrongAttempts:this.wrongAttempts,accuracy:Math.round(this.firstTry/this.total*100),bonus:this.bonus};}
}
export function shuffle(items,random=Math.random){const copy=structuredClone(items);for(let i=copy.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
