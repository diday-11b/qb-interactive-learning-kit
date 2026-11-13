const test = require('node:test');
const assert = require('node:assert/strict');
const {build, categories, Round} = require('../assets/alien-spelling-mission.js');

for (const [level, length] of Object.entries({easy:/^[A-Z]{3}$/,medium:/^[A-Z]{4,5}$/,hard:/^(?:[A-Z] *){6,}$/})) {
  for (const category of categories(level)) {
    test(level+' '+category+' completes a ten-question mission', () => {
      const questions = build(level,category);
      assert.equal(questions.length,10);
      assert.equal(new Set(questions.map(q => q.word)).size,10);
      const round = new Round(questions);
      assert.equal(round.open(),false);
      round.phase = 'ready';
      questions.forEach((q,index) => {
        assert.match(q.word,length);
        assert.ok(q.picture.trim());
        assert.equal(new Set(q.choices).size,4);
        assert.equal(q.choices.filter(choice => choice === q.word).length,1);
        assert.ok(round.open());
        assert.equal(round.completed,index);
        if (index === 0) {
          assert.deepEqual(round.answer(q.choices.find(choice => choice !== q.word)),{correct:false});
          assert.equal(round.travel(),false);
        }
        assert.deepEqual(round.answer(q.word),{correct:true,points:index === 0 ? 5 : 10});
        assert.equal(round.answer(q.word),null);
        assert.ok(round.travel());
        assert.equal(round.travel(),false);
      });
      assert.equal(round.open(),false);
      assert.equal(round.score,95);
      assert.equal(round.firstTry,9);
      assert.equal(round.completed,10);
    });
  }
}
