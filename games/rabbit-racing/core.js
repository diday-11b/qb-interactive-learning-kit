(function(root){
'use strict';
const TOTAL=30,STEP=100;
function buildQuestions(){
 const questions=[];
 for(let i=0;i<TOTAL;i++){
  let a,b,answer,prompt;
  if(i<10){a=i+2;b=i+3;answer=a+b;prompt=`${a} + ${b} = ?`;}
  else if(i<20){a=i+12;b=(i-9)*2;answer=a-b;prompt=`${a} − ${b} = ?`;}
  else{a=i-18;b=3;answer=a*b;prompt=`${a} × ${b} = ?`;}
  const options=[answer,answer+1,answer+2,answer-1].map(String);
  // Rotate the stable choices so the correct answer is not always first.
  const shift=i%4;options.push(...options.splice(0,shift));
  questions.push(Object.freeze({id:`rabbit-${i+1}`,prompt,answer:String(answer),options:Object.freeze(options)}));
 }
 return Object.freeze(questions);
}
class Race {
 constructor(questions=buildQuestions()){
  if(questions.length!==TOTAL||questions.some(q=>!q||q.options.length!==4||new Set(q.options).size!==4||!q.options.includes(q.answer)))throw Error('A race needs 30 valid four-choice questions.');
  this.questions=questions;this.reset();
 }
 reset(){this.phase='intro';this.character=null;this.player=0;this.opponent=0;this.score=0;this.correct=0;this.answered=0;this.completed=0;this.last=null;}
 start(character){if(this.phase!=='intro')return false;this.character=character;this.phase='starting';return true;}
 openQuestion(){if(!['starting','between'].includes(this.phase)||this.completed>=TOTAL)return false;this.phase='question';return true;}
 submit(choice){if(this.phase!=='question')return null;const q=this.questions[this.completed];if(!q.options.includes(choice))return null;
  const correct=choice===q.answer;this.answered++;if(correct){this.correct++;this.score+=100;}
  this.last=Object.freeze({correct,choice,answer:q.answer,mover:correct?'player':'opponent',beforePlayer:this.player,beforeOpponent:this.opponent});
  this.phase='feedback';return this.last;
 }
 beginRace(){if(this.phase!=='feedback')return null;this.phase='racing';if(this.last.correct)this.player+=STEP;else this.opponent+=STEP;return this.last;}
 finishRace(){if(this.phase!=='racing')return false;this.completed++;this.phase=this.completed===TOTAL?'finished':'between';return true;}
 showResults(){if(this.phase!=='finished')return false;this.phase='results';return true;}
 result(){if(!['finished','results'].includes(this.phase))return null;return Object.freeze({winner:this.player>=this.opponent?'player':'opponent',tie:this.player===this.opponent,player:this.player,opponent:this.opponent,score:this.score,correct:this.correct,incorrect:this.answered-this.correct,answered:this.answered,completed:this.completed,total:TOTAL,accuracy:Math.round(this.correct/TOTAL*100)});}
}
root.RabbitRacing={Race,buildQuestions,TOTAL,STEP};
if(typeof module!=='undefined')module.exports=root.RabbitRacing;
})(typeof window!=='undefined'?window:globalThis);
