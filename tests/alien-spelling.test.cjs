const test=require('node:test');const assert=require('node:assert/strict');const Q=require('../assets/alien-spelling-questions.js');const State=require('../assets/ocean-state.js');
for(const level of ['easy','medium','hard'])for(const activity of ['picture','listen','complete','mixed']){
 test(level+' / '+activity,()=>{
  if(activity==='picture'&&level!=='easy'){assert.throws(()=>Q.build(level,activity));return;}
  const questions=Q.build(level,activity);assert.equal(questions.length,5);assert.equal(new Set(questions.map(q=>q.word)).size,5);
  for(const q of questions){assert.ok(Q.validate(q));assert.equal(q.choices.length,4);const before=q.choices.find(c=>c.id===q.correctId).text;q.choices.reverse();assert.ok(Q.validate(q));assert.equal(q.choices.find(c=>c.id===q.correctId).text,before);}
 });
}
test('Difficulty changes words, not labels',()=>{const sets=['easy','medium','hard'].map(l=>Q.build(l,'listen').map(q=>q.word));assert.notDeepEqual(sets[0],sets[1]);assert.notDeepEqual(sets[1],sets[2]);});
test('State requires intro and configuration before game',()=>{const s=new State('INTRO');assert.equal(s.go('QUESTION_ACTIVE'),false);for(const n of ['CONFIGURATION','GAME_READY','QUESTION_ACTIVE'])assert.ok(s.go(n));});
test('Wrong answer remains on same question state',()=>{const s=new State('QUESTION_ACTIVE');assert.ok(s.go('ANSWER_INCORRECT'));assert.equal(s.go('GAME_ACTION'),false);assert.ok(s.go('QUESTION_ACTIVE'));});
test('Success locks duplicate answers and waits for final action',()=>{const s=new State('QUESTION_ACTIVE');assert.ok(s.go('ANSWER_CORRECT'));assert.equal(s.go('ANSWER_CORRECT'),false);assert.equal(s.go('GAME_COMPLETED'),false);for(const n of ['SUCCESS_FEEDBACK','GAME_ACTION','GAME_COMPLETED'])assert.ok(s.go(n));assert.equal(s.go('GAME_ACTION'),false);});
test('Invalid choices fail review',()=>{const q=Q.build('easy','listen')[0];assert.equal(Q.validate({...q,choices:q.choices.slice(0,3)}),false);assert.equal(Q.validate({...q,correctId:'missing'}),false);});
