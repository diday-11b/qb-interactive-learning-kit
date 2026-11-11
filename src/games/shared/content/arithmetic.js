// Procedural arithmetic adapted from the original Ocean arithmetic generator.
export const practiceName = config => 'Arithmetic practice · '+config.difficulty+' · 5 questions';
export const buildQuestions = config => arithmetic(config.difficulty);

export function arithmetic(level='easy'){
 if(!['easy','medium','hard','advanced'].includes(level))throw Error('Choose a valid level.');
 const hard=level==='hard'||level==='advanced';
 return Array.from({length:5},(_,i)=>{
  const a=i+(hard?12:level==='medium'?8:3),b=i+2,answer=hard?a*b:a+b;
  return {id:'math-'+level+'-'+i,input:'choice',prompt:`${a} ${hard?'×':'+'} ${b} = ?`,answer:String(answer),options:[answer,answer+1,answer-1,answer+2].map(n=>({value:String(n),label:String(n)})),hint:hard?'Use your multiplication facts.':'Count on from the larger number.'};
 });
}
