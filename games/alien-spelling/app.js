const pilot=`<svg viewBox="0 0 300 220" aria-label="Friendly alien pilot in a shuttle"><g stroke="#293459" stroke-width="5" stroke-linejoin="round"><path d="m75 135-45 38 60-5m135-33 45 38-60-5" fill="#b6a0f5"/><path d="M70 128q0-85 80-85t80 85" fill="#c6f3ff"/><path d="M120 91q-8-55 30-55t30 55" fill="#9ce0b7"/><path d="m135 42-12-20m42 20 12-20" fill="none"/><circle cx="122" cy="20" r="6" fill="#f9d976"/><circle cx="178" cy="20" r="6" fill="#f9d976"/><ellipse cx="137" cy="63" rx="5" ry="8" fill="#293459"/><ellipse cx="163" cy="63" rx="5" ry="8" fill="#293459"/><path d="M138 82q12 12 24 0" fill="none"/><ellipse cx="150" cy="134" rx="110" ry="38" fill="#8d86de"/><path d="M65 145q85 38 170 0v19q-85 40-170 0Z" fill="#a8a2ed"/><circle cx="105" cy="140" r="9" fill="#ffda71"/><circle cx="150" cy="145" r="9" fill="#7de2db"/><circle cx="195" cy="140" r="9" fill="#ffadba"/></g></svg>`;
const root = document.querySelector('#alien-game');
const screen = document.querySelector('#mission-screen');
const dialog = document.querySelector('#mission-dialog');
const clock = new AlienMissionClock();
const {build, Round, categories} = AlienSpellingMission;
const levels = [
  ['easy','Space Rookie','Three-letter words','🌎'],
  ['medium','Star Explorer','Four- and five-letter words','🌙'],
  ['hard','Galaxy Master','Six letters or more','🪐']
];
const categoryNames = ['Animals','Fruits','Space','Colors','Everyday Objects'];
const categoryIcons = ['🐾','🍓','🚀','🎨','🧸'];
const selection = new URLSearchParams(location.search).get('questionSet');
const back = document.querySelector('#mission-back');
if (selection) back.search = new URLSearchParams({questionSet:selection});
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let level = 0, category, round, motion, sound = true, audio, resumeTarget;
const pause = document.querySelector('#mission-pause');
const soundButton = document.querySelector('#mission-sound');
const full = document.querySelector('#mission-full');

function element(tag, text = '', cls = '') {
  const node = document.createElement(tag);
  node.textContent = text;
  node.className = cls;
  return node;
}
function button(label, action, cls = '') {
  const node = element('button',label,cls);
  node.type = 'button';
  node.addEventListener('click',action);
  return node;
}
function view(title) {
  const heading = element('h1',title);
  heading.tabIndex = -1;
  screen.replaceChildren(heading);
  pause.hidden = !active();
  heading.focus({preventScroll:true});
}
function active() {
  return Boolean(round && round.phase !== 'results');
}
function stop() {
  clock.cancel();
  motion?.cancel();
  motion = null;
  if (dialog.open) dialog.close();
  clock.resume();
  window.QBCorrectConfetti?.clear();
  window.speechSynthesis?.cancel();
}
function stage(position, from = position) {
  const scene = element('div','','alien-stage');
  scene.innerHTML = '<div class="alien-nebula"></div><div class="alien-planet alien-planet-one"></div><div class="alien-planet alien-planet-two"></div><div class="alien-planet alien-destination"></div><div class="alien-orbit-path"></div><div class="alien-shuttle"><span class="alien-exhaust"></span>'+pilot+'</div>';
  const shuttle = scene.querySelector('.alien-shuttle');
  const left = point => (6 + point * 6.8) + '%';
  shuttle.style.left = left(position);
  screen.append(scene);
  if (from !== position && !reduced.matches && shuttle.animate) {
    scene.classList.add('mission-moving');
    motion = shuttle.animate([{left:left(from)},{left:left(position)}],{duration:1100,easing:'ease-in-out'});
  }
}
function intro() {
  stop();
  round = null;
  view('Alien Spelling Shuttle');
  screen.append(element('p','Help our alien friend spell words and explore the galaxy!','alien-lead'));
  stage(0);
  const actions = element('div','','alien-buttons');
  actions.append(button('Start Adventure',selectLevel,'alien-primary'));
  const exit = element('a','Back');
  exit.href = back.href;
  actions.append(exit);
  screen.append(actions);
}
function selectLevel() {
  round = null;
  view('Choose your level');
  const grid = element('div','','mission-grid');
  levels.forEach(([,title,description,icon],index) => {
    const card = element('section','','alien-panel mission-card');
    const art = element('p',icon,'mission-icon');
    art.setAttribute('aria-hidden','true');
    card.append(art,element('h2',title),element('p',description),
      button('Start '+title,() => { level = index; selectCategory(); },'alien-primary'));
    grid.append(card);
  });
  screen.append(grid,button('Back',intro,'alien-primary'));
}
function selectCategory() {
  round = null;
  view(levels[level][1]+' · Choose a category');
  const available = categories(levels[level][0]);
  const grid = element('div','','mission-grid');
  categoryNames.forEach((name,index) => {
    const card = element('section','','alien-panel mission-card');
    const art = element('p',categoryIcons[index],'mission-icon');
    art.setAttribute('aria-hidden','true');
    const ready = available.includes(name);
    const action = button(ready?'Start Space Adventure':'Coming Soon',() => { category = name; start(); },'alien-primary');
    action.disabled = !ready;
    action.setAttribute('aria-label',name+' · '+action.textContent);
    card.append(art,element('h2',name),action);
    grid.append(card);
  });
  screen.append(grid,button('Back',selectLevel,'alien-primary'));
}
function hud() {
  const bar = element('div','','mission-hud');
  bar.append(element('span',levels[level][1]),element('span',round.completed+' / 10 checkpoints'),
    element('strong',round.score+' points','mission-score'));
  const meter = element('progress','','mission-meter');
  meter.max = 10;
  meter.value = round.completed;
  meter.setAttribute('aria-label','Checkpoints completed');
  screen.append(bar,meter);
}
function start() {
  stop();
  prepareAudio();
  round = new Round(build(levels[level][0],category));
  view('Launching your shuttle');
  hud();
  stage(0,-.6);
  clock.schedule(reduced.matches?0:1100,() => {
    round.phase = 'ready';
    view("Mission Ready! Let’s spell a word!");
    hud();
    stage(0);
    screen.append(button('Continue',openQuestion,'alien-primary'));
  });
}
function openQuestion() {
  if (!round.open()) return;
  const q = round.questions[round.completed];
  view('Question '+(round.completed+1)+' of 10');
  hud();
  const card = element('section','','alien-panel mission-question');
  const picture = element('div',q.picture,'mission-picture');
  picture.setAttribute('role','img');
  picture.setAttribute('aria-label','Picture clue');
  const heading = element('h2','What is the correct spelling?');
  const speaker = button('🔊 Hear the word',() => speak(q.word));
  speaker.disabled = !sound || !window.speechSynthesis;
  speaker.id = 'mission-speaker';
  const choices = element('div','','alien-answers');
  choices.setAttribute('role','group');
  choices.setAttribute('aria-label','Answer choices');
  q.choices.forEach((choice,index) => {
    const answer = button(String.fromCharCode(65+index)+'. '+choice,() => submit(choice,answer),'mission-answer');
    choices.append(answer);
  });
  const feedback = element('p','','mission-feedback');
  feedback.id = 'mission-feedback';
  feedback.setAttribute('role','status');
  card.append(picture,heading,speaker,choices,feedback);
  screen.append(card);
}
function submit(choice, selected) {
  if (dialog.open) return;
  const result = round.answer(choice);
  if (!result) return;
  window.speechSynthesis?.cancel();
  const feedback = document.querySelector('#mission-feedback');
  if (!result.correct) {
    selected.classList.add('wrong');
    feedback.textContent = 'Try Again!';
    tone([330]);
    return;
  }
  screen.querySelectorAll('.mission-answer').forEach(answer => { answer.disabled = true; });
  selected.classList.remove('wrong');
  selected.classList.add('correct');
  feedback.textContent = 'Great Job! +'+result.points+' points';
  document.querySelector('.mission-score').textContent = round.score+' points';
  window.QBCorrectConfetti?.play();
  tone([523,659,784]);
  clock.schedule(2000,travel);
}
function travel() {
  window.QBCorrectConfetti?.clear();
  if (!round.travel()) return;
  view('Shuttle powered up!');
  hud();
  stage(round.completed,round.completed-1);
  clock.schedule(reduced.matches?0:1150,round.completed === 10 ? results : openQuestion);
}
function results() {
  round.phase = 'results';
  view('Mission Complete!');
  hud();
  stage(10);
  const panel = element('section','','alien-panel');
  panel.append(element('h2','You explored the galaxy!'),
    element('p',round.score+' / 100 points · '+round.firstTry+' correct on the first try · 10 questions completed'),
    element('p','Every word helped your shuttle reach a new checkpoint.'));
  const actions = element('div','','alien-buttons');
  const hasNext = level < levels.length-1;
  const next = button(hasNext?'Next Level':'Coming Soon',() => { level++; selectCategory(); },'alien-primary');
  next.disabled = !hasNext;
  const exit = element('a','Exit');
  exit.href = back.href;
  actions.append(button('Retry',start,'alien-primary'),next,exit);
  panel.append(actions);
  screen.append(panel);
  window.QBCorrectConfetti?.play();
  tone([523,659,784]);
}
function prepareAudio() {
  if (!sound) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ??= new Audio();
    audio.resume().catch(() => {});
  } catch {}
}
function tone(notes) {
  if (!sound || audio?.state !== 'running') return;
  notes.forEach((note,index) => {
    const oscillator = audio.createOscillator();
    const volume = audio.createGain();
    const start = audio.currentTime+index*.09;
    oscillator.frequency.value = note;
    volume.gain.setValueAtTime(.08,start);
    volume.gain.exponentialRampToValueAtTime(.001,start+.2);
    oscillator.connect(volume).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start+.2);
  });
}
function speak(word) {
  if (!sound || !window.speechSynthesis) return;
  speechSynthesis.cancel();
  const speech = new SpeechSynthesisUtterance(word.toLowerCase());
  speech.lang = 'en-US';
  speech.rate = .8;
  speechSynthesis.speak(speech);
}
function toggleSound() {
  sound = !sound;
  soundButton.textContent = sound?'Sound on':'Sound off';
  soundButton.setAttribute('aria-pressed',String(sound));
  const speaker = document.querySelector('#mission-speaker');
  if (speaker) speaker.disabled = !sound || !window.speechSynthesis;
  if (sound) prepareAudio();
  else { window.speechSynthesis?.cancel(); audio?.suspend().catch(() => {}); }
}
function showPause() {
  if (!active() || dialog.open) return;
  resumeTarget = document.activeElement;
  clock.pause();
  motion?.pause();
  window.speechSynthesis?.cancel();
  window.QBCorrectConfetti?.clear();
  root.classList.add('alien-paused');
  dialog.showModal();
  pauseMenu();
}
function pauseMenu() {
  document.querySelector('#pause-title').textContent = 'Mission paused';
  document.querySelector('#pause-actions').replaceChildren(
    button('Resume',() => dialog.close()),
    button('Restart',() => confirmAction('Restart this mission?',start)),
    button(sound?'Sound On':'Sound Off',() => { toggleSound(); pauseMenu(); }),
    button('Exit Game',() => confirmAction('Leave this mission?',() => { stop(); location.assign(back.href); })));
}
function confirmAction(title, action) {
  document.querySelector('#pause-title').textContent = title;
  document.querySelector('#pause-actions').replaceChildren(button('Cancel',pauseMenu),button('Confirm',action));
}
dialog.addEventListener('close',() => {
  root.classList.remove('alien-paused');
  clock.resume();
  motion?.play();
  if (dialog.returnValue === 'resume') resumeTarget?.focus();
});
pause.addEventListener('click',() => { dialog.returnValue = 'resume'; showPause(); });
back.addEventListener('click',event => {
  if (!active() || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  dialog.returnValue = 'resume';
  showPause();
  confirmAction('Leave this mission?',() => { stop(); location.assign(back.href); });
});
soundButton.addEventListener('click',toggleSound);
function syncFull() {
  const expanded = document.fullscreenElement === root || root.classList.contains('mission-expanded');
  full.textContent = expanded?'Normal screen':'Full screen';
  full.setAttribute('aria-pressed',String(expanded));
}
full.addEventListener('click',async () => {
  if (document.fullscreenElement === root) await document.exitFullscreen();
  else if (root.classList.contains('mission-expanded')) root.classList.remove('mission-expanded');
  else {
    try {
      if (!root.requestFullscreen) throw new Error('Fullscreen unavailable');
      await root.requestFullscreen();
    } catch { root.classList.add('mission-expanded'); }
  }
  syncFull();
});
document.addEventListener('fullscreenchange',syncFull);
window.addEventListener('pagehide',stop);
intro();
