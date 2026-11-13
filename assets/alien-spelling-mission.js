const AlienSpellingMission = (() => {
  const banks = {
    easy: {Animals:'CAT🐱 DOG🐶 FOX🦊 BAT🦇 RAT🐀 COW🐄 PIG🐷 HEN🐔 ANT🐜 BEE🐝'},
    medium: {Animals:'BEAR🐻 LION🦁 WOLF🐺 FROG🐸 DUCK🦆 HORSE🐴 SHEEP🐑 TIGER🐯 ZEBRA🦓 MOUSE🐭',
      'Everyday Objects':'BOOK📕 CHAIR🪑 CLOCK🕰️ PHONE📱 SPOON🥄 BRUSH🪥 RULER📏 PLATE🍽️ SHOE👟 KNIFE🔪'},
    hard: {Animals:'RABBIT🐇 TURTLE🐢 MONKEY🐒 DONKEY🫏 PARROT🦜 PENGUIN🐧 DOLPHIN🐬 GORILLA🦍 GIRAFFE🦒 ELEPHANT🐘',
      Fruits:'ORANGE🍊 BANANA🍌 CHERRY🍒 COCONUT🥥 PINEAPPLE🍍 STRAWBERRY🍓 BLUEBERRY🫐 WATERMELON🍉 AVOCADO🥑 PEACHES🍑',
      Space:'PLANET🪐 ROCKET🚀 SATELLITE🛰️ TELESCOPE🔭 GALAXY🌌 ASTRONAUT🧑‍🚀 CRESCENT🌙 FULL MOON🌕 FLYING SAUCER🛸 SHOOTING STAR🌠'}
  };
  function shuffle(items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }
  function build(level, category) {
    const bank = banks[level]?.[category];
    if (!bank) throw new Error('This category is coming soon.');
    const entries = [...bank.matchAll(/([A-Z]+(?: [A-Z]+)*)([^A-Z]+?)(?= [A-Z]|$)/gu)]
      .map(([, word, picture]) => ({word, picture}));
    return shuffle(entries.map(entry => ({...entry, choices:shuffle([entry.word,
      ...shuffle(entries.filter(other => other !== entry)).slice(0,3).map(other => other.word)
    ])})));
  }
  class Round {
    constructor(questions) {
      this.questions = questions;
      this.phase = 'launch';
      this.completed = this.score = this.firstTry = 0;
      this.missed = false;
    }
    open() {
      if (!['ready','travel'].includes(this.phase) || this.completed === this.questions.length) return false;
      this.missed = false;
      this.phase = 'question';
      return true;
    }
    answer(choice) {
      if (this.phase !== 'question' || !this.questions[this.completed].choices.includes(choice)) return null;
      if (choice !== this.questions[this.completed].word) {
        this.missed = true;
        return {correct:false};
      }
      const points = this.missed ? 5 : 10;
      this.score += points;
      this.firstTry += Number(!this.missed);
      this.phase = 'feedback';
      return {correct:true, points};
    }
    travel() {
      if (this.phase !== 'feedback') return false;
      this.completed++;
      this.phase = 'travel';
      return true;
    }
  }
  return {build, Round, categories:level => Object.keys(banks[level] || {})};
})();
if (typeof module !== 'undefined') module.exports = AlienSpellingMission;
