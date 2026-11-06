(() => {
'use strict';
const {Race,TOTAL,STEP}=RabbitRacing;
const voice=RabbitRaceVoice;
const race=new Race(),clock=new RabbitRaceClock();
const root=document.querySelector('#rabbit-game'),screen=document.querySelector('#rr-screen');
const dialog=document.querySelector('#rr-exit-dialog'),fullButton=document.querySelector('#rr-fullscreen');
const selection=new URLSearchParams(location.search).get('questionSet');
const library='/02._qb_explore_games_catalog/code.html'+(selection?'?'+new URLSearchParams({questionSet:selection}):'');
const characters=[{id:'clover',name:'Clover',color:'#74cbb2',description:'The meadow explorer'},{id:'poppy',name:'Poppy',color:'#ff9e91',description:'The sunshine racer'},{id:'luna',name:'Luna',color:'#b8a0eb',description:'The starlight adventurer'}];
let selected='clover',movement=null,confirming=false,destination=library,returnFocus=null;
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(text,fn,cls=''){const b=node('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;}
function chosen(){return characters.find(c=>c.id===selected)||characters[0];}
function active(){return !['intro','results'].includes(race.phase);}
function car(color){return `<svg viewBox="0 0 180 135" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#273e50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="76" cy="28" rx="10" ry="24" fill="#fff7e9" transform="rotate(-10 76 28)"/><ellipse cx="102" cy="28" rx="10" ry="24" fill="#fff7e9" transform="rotate(9 102 28)"/><path d="M75 12v25m28-24-2 24" stroke="#f8b2b0" stroke-width="5"/><ellipse cx="90" cy="55" rx="30" ry="27" fill="#fff7e9"/><path d="M62 51q26-35 54 0" fill="${color}"/><circle cx="80" cy="57" r="2" fill="#273e50"/><circle cx="101" cy="57" r="2" fill="#273e50"/><path d="m86 66 4 3 4-3m-10 8q6 5 12 0" fill="none"/><path d="M28 84q4-16 28-16h63l26 19 15 4v22H24Z" fill="${color}"/><path d="M55 78h53l17 15H45Z" fill="#d9f5ff"/><path d="M22 98h137" fill="none"/><circle cx="52" cy="111" r="17" fill="#273e50"/><circle cx="132" cy="111" r="17" fill="#273e50"/><circle cx="52" cy="111" r="7" fill="#fff7e9"/><circle cx="132" cy="111" r="7" fill="#fff7e9"/><path d="M145 94h12" stroke="#fff4a2" stroke-width="6"/></g></svg>`;}
function preserveContext(){const scopes=[document,...Array.from(document.querySelectorAll('qb-site-header')).map(n=>n.shadowRoot).filter(Boolean)];for(const scope of scopes)scope.querySelectorAll('a[href]').forEach(a=>{const url=new URL(a.getAttribute('href'),location.href);if(url.origin===location.origin&&['/07._qb_game_library_arena_selection/code.html','/02._qb_explore_games_catalog/code.html'].includes(url.pathname))a.href=library;});}
function renderHeading(eyebrow,title,lead){screen.replaceChildren();root.dataset.phase=race.phase;screen.append(node('p','rr-eyebrow',eyebrow),node('h1','',title));if(lead)screen.append(node('p','rr-lead',lead));preserveContext();}
function focusHeading(){
 const h=screen.querySelector('h1,h2');
 if(!h)return;
 h.tabIndex=-1;
 h.focus({preventScroll:true});
 const bounds=h.getBoundingClientRect();
 if(bounds.top<0||bounds.bottom>window.innerHeight)h.scrollIntoView({block:'start'});
}
function syncVoice(){
 const enabled=QBAdventureSetup.preferences(screen).sound;
 const toggle=document.querySelector('#rr-voice');
 toggle.hidden=!voice.available||!active();
 toggle.textContent=enabled?'Voice on':'Voice off';
 toggle.setAttribute('aria-pressed',String(enabled));
 const replay=screen.querySelector('#rr-repeat');
 if(replay)replay.disabled=!enabled||race.phase!=='question';
}
function readQuestion(){
 if(race.phase==='question'&&QBAdventureSetup.preferences(screen).sound){
  voice.speakQuestion(race.questions[race.completed].prompt);
 }
}
document.querySelector('#rr-voice').addEventListener('click',()=>{
 const preferences=QBAdventureSetup.preferences(screen);
 preferences.sound=!preferences.sound;
 if(preferences.sound)readQuestion();
 else voice.stop();
 syncVoice();
});
function intro(){if('speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.resume();}clock.reset();movement?.cancel();movement=null;race.reset();renderHeading('QB Interactive Learning Kits · A little learning. A big leap.','Rabbit Racing','Think it through. Pick an answer. See who hops ahead!');
 const hero=node('div','rr-intro-art');hero.innerHTML=`<div class="rr-sun"></div><div class="rr-hill rr-hill-one"></div><div class="rr-hill rr-hill-two"></div><div class="rr-intro-road"></div><div class="rr-intro-car">${car(chosen().color)}</div><span class="rr-art-flag" aria-hidden="true">⚑</span><span class="rr-art-label">MEADOW GRAND PRIX · 30 QUESTIONS</span>`;hero.setAttribute('role','img');hero.setAttribute('aria-label','A friendly rabbit in a colourful racing car on a meadow track');screen.append(hero);
 const panel=node('section','rr-panel');panel.append(node('h2','','Choose your rabbit racer'));const options=node('div','rr-characters');options.setAttribute('role','group');options.setAttribute('aria-label','Choose your character');for(const character of characters){const b=button('',()=>{selected=character.id;options.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));hero.querySelector('.rr-intro-car').innerHTML=car(character.color);});b.setAttribute('aria-pressed',String(selected===character.id));b.innerHTML=car(character.color);b.append(node('strong','',character.name),node('span','',character.description));options.append(b);}panel.append(options);
 const instructions=node('ol','rr-instructions');['Solve 30 maths questions at your own pace. Each question has four answers.','A correct answer earns 100 points and moves only your rabbit 100 metres.','An incorrect answer earns no points and moves only Dash, your opponent, 100 metres.','Watch the race automatically after 2 seconds of feedback. Then choose Next Question.','The greatest distance wins after question 30. If you tie, you win!'].forEach(text=>instructions.append(node('li','',text)));panel.append(instructions);
 const actions=node('div','rr-actions');actions.append(button('Start Game',start,'rr-primary'),button('Back to Games',()=>leave(library),'rr-secondary'));panel.append(actions);screen.append(panel);const settings=node('div','setup-fields');[['Learning activity','Mixed mathematics · addition, subtraction and multiplication'],['Game mode','Rabbit race · correct moves you; incorrect moves Dash'],['Difficulty','Standard · mixed mathematics'],['Questions','30 questions · four answers each'],['Answer timer','No time limit']].forEach(([label,value])=>{const field=node('label','',label),input=node('select');input.append(node('option','',value));field.append(input);settings.append(field);});const status=node('p','',chosen().name+' · 30 questions · 100 metres per answer');options.addEventListener('click',()=>{status.textContent=chosen().name+' · 30 questions · 100 metres per answer';});actions.children[0].textContent='Play ▶';QBAdventureSetup.mount({root:screen,title:'Choose your adventure · Rabbit Racing',artNode:hero,instructions:['Correct answers: +100 points and only your rabbit moves 100 metres.','Incorrect answers: only Dash moves 100 metres. Answer at your own pace.','After 30 questions, the longest distance wins. A tie favors you.'],settings,status,actions,characters:options,characterTitle:'Choose your rabbit racer!'});document.querySelector('#rr-exit').hidden=true;syncVoice();focusHeading();}
function start(){race.questions=RabbitRacing.buildQuestions();if(QBAdventureSetup.preferences(screen).randomize)race.questions=QBAdventureSetup.shuffle([...race.questions]);if(!race.start(selected))return;syncVoice();document.querySelector('#rr-exit').hidden=false;renderTrack('Get ready!','Both racers are waiting at the start. Your first question opens in 2 seconds.');clock.schedule(2000,openQuestion);}
function hud(){
 const h=node('div','rr-hud');
 const questionView=race.phase==='question';
 const label=questionView?`Question ${race.completed+1} of ${TOTAL}`:`${race.answered} of ${TOTAL} answered`;
 const progress=node('progress','rr-progress');
 progress.max=TOTAL;
 progress.value=race.completed;
 progress.setAttribute('aria-label','Race turns completed');
 h.append(node('span','',label),node('strong','',`${race.score.toLocaleString()} points`),progress,
  node('span','rr-turn-count',`${race.completed} of ${TOTAL} turns complete`));
 screen.append(h);
}
function lane(name,color,distance,kind){const section=node('section','rr-lane rr-lane-'+kind);section.setAttribute('aria-label',`${name}: ${distance} metres`);const label=node('div','rr-lane-label');label.append(node('strong','',name),node('span','',`${distance.toLocaleString()} m`));const roadway=node('div','rr-roadway');const vehicle=node('div','rr-vehicle');vehicle.dataset.racer=kind;vehicle.style.left=position(distance);vehicle.innerHTML=car(color);roadway.append(vehicle);section.append(label,roadway);return section;}
function position(distance){const part=distance/(TOTAL*STEP);return `calc(${part*100}% - var(--rr-vehicle-width) * ${part})`;}
function renderTrack(title,message,positions=race){renderHeading('Meadow Grand Prix','Rabbit Racing');hud();const stage=node('div','rr-track');stage.innerHTML='<div class="rr-track-sky"><span>THE MEADOW CIRCUIT</span><span>FINISH · 3,000 m ⚑</span></div>';const ruler=node('div','rr-distance-ruler');ruler.setAttribute('aria-label','Equal distance scale for both lanes');['0 m','1,000 m','2,000 m','3,000 m'].forEach(text=>ruler.append(node('span','',text)));stage.append(ruler);stage.append(lane(chosen().name+' · You',chosen().color,positions.player,'player'),lane('Dash · Opponent','#ffd36f',positions.opponent,'opponent'));screen.append(stage);const status=node('section','rr-panel rr-track-status');status.append(node('h2','',title),node('p','',message));const action=button('Next Question',openQuestion,'rr-primary');action.id='rr-next';action.disabled=true;status.append(action);screen.append(status);focusHeading();return action;}
function openQuestion(){if(confirming||!race.openQuestion())return;renderHeading('Take your time · No answer timer','Solve the next challenge');hud();const q=race.questions[race.completed];const panel=node('section','rr-panel rr-question');const heading=node('h2','rr-problem',q.prompt);heading.id='rr-problem';panel.append(heading);if(voice.available){const replay=button('Read question again',readQuestion,'rr-repeat');replay.id='rr-repeat';panel.append(replay);}const choices=node('div','rr-answers');choices.setAttribute('role','group');choices.setAttribute('aria-labelledby','rr-problem');q.options.forEach((answer,i)=>{const b=button('',()=>submit(answer,b));b.append(node('span','rr-letter',String.fromCharCode(65+i)),node('span','',answer));b.setAttribute('aria-label',String.fromCharCode(65+i)+' · '+answer);choices.append(b);});const feedback=node('div','rr-feedback');feedback.id='rr-feedback';feedback.setAttribute('aria-live','polite');panel.append(choices,feedback);screen.append(panel);syncVoice();focusHeading();readQuestion();}
function submit(value,selectedButton){if(confirming)return;const result=race.submit(value);if(!result)return;voice.stop();root.dataset.phase=race.phase;syncVoice();screen.querySelectorAll('.rr-answers button').forEach(b=>b.disabled=true);selectedButton.classList.add(result.correct?'is-correct':'is-incorrect');if(!result.correct){const q=race.questions[race.completed];screen.querySelectorAll('.rr-answers button').forEach((b,i)=>{if(q.options[i]===result.answer)b.classList.add('is-correct');});}
 const feedback=document.querySelector('#rr-feedback');feedback.className='rr-feedback '+(result.correct?'is-success':'is-retry');feedback.append(node('strong','',result.correct?'Correct! +100 points':'Good effort! The answer is '+result.answer+'.'),node('p','',result.correct?`${chosen().name} will move 100 metres. Dash stays still.`:'Dash will move 100 metres. Your rabbit stays still.'),node('small','','Back to the track in 2 seconds…'));feedback.append(node('span','rr-feedback-timer'));screen.querySelector('.rr-hud strong').textContent=`${race.score.toLocaleString()} points`;clock.schedule(2000,animateRace);}
function animateRace(){
 const result=race.beginRace();
 if(!result)return;
 const mover=result.correct?chosen().name:'Dash';
 const next=renderTrack(`${mover} moves forward!`,`${mover} gains 100 metres. ${result.correct?'Dash':'Your rabbit'} stays in place.`,{
  player:result.beforePlayer,opponent:result.beforeOpponent
 });
 next.textContent='Racing…';
 const vehicle=screen.querySelector(`[data-racer="${result.mover}"]`);
 const lane=vehicle.closest('.rr-lane');
 const before=result.correct?result.beforePlayer:result.beforeOpponent;
 const after=result.correct?race.player:race.opponent;
 const duration=!reduced()&&vehicle.animate?900:0;
 if(duration){
  movement=vehicle.animate([{left:position(before)},{left:position(after)}],{
   duration,easing:'cubic-bezier(.3,.08,.25,1)',fill:'both'
  });
 }
 clock.schedule(duration,()=>{
  vehicle.style.left=position(after);
  movement?.cancel();
  movement=null;
  lane.querySelector('.rr-lane-label span').textContent=`${after.toLocaleString()} m`;
  lane.setAttribute('aria-label',`${lane.querySelector('strong').textContent}: ${after} metres`);
  if(!race.finishRace())return;
  root.dataset.phase=race.phase;
  next.textContent=race.phase==='finished'?'See Results':'Next Question';
  next.disabled=false;
  next.onclick=race.phase==='finished'?showResults:null;
  if(race.phase==='finished')screen.querySelector('.rr-track-status p').textContent='All 30 questions are complete. Your final positions are locked in.';
  screen.querySelector('.rr-turn-count').textContent=`${race.completed} of ${TOTAL} turns complete`;
  screen.querySelector('.rr-progress').value=race.completed;
  if(document.activeElement===screen.querySelector('h1'))next.focus({preventScroll:true});
 });
}
function showResults(){if(confirming||!race.showResults())return;const r=race.result();renderHeading('Meadow Grand Prix · Race complete',r.winner==='player'?'You win!':'Dash wins this race!',r.tie?'A perfect tie in distance — the win goes to you.':'Every question was a chance to learn. Thanks for racing!');const podium=node('div','rr-podium');podium.innerHTML=car(r.winner==='player'?chosen().color:'#ffd36f');screen.append(podium);const panel=node('section','rr-panel');panel.append(node('h2','','Your race results'));const stats=node('dl','rr-results');[['Your distance',r.player+' m'],['Dash’s distance',r.opponent+' m'],['Score',r.score+' points'],['Correct answers',r.correct+' / 30'],['Accuracy',r.accuracy+'%'],['Questions answered',r.answered+' / 30'],['Turns completed',r.completed+' / 30'],['Incorrect answers',String(r.incorrect)]].forEach(([key,value])=>{const item=node('div');item.append(node('dt','',key),node('dd','',value));stats.append(item);});panel.append(stats);const actions=node('div','rr-actions');actions.append(button('Play Again',()=>{selected='clover';intro();},'rr-primary'),button('Back to Games',()=>leave(library),'rr-secondary'));panel.append(actions);screen.append(panel);document.querySelector('#rr-exit').hidden=true;syncVoice();focusHeading();}
function askExit(href=library){if(confirming)return;if(!active()){leave(href);return;}confirming=true;destination=href;returnFocus=document.activeElement;clock.pause();movement?.pause();if('speechSynthesis'in window)speechSynthesis.pause();root.classList.add('rr-confirming');if(dialog.showModal)dialog.showModal();else{dialog.setAttribute('open','');dialog.classList.add('rr-dialog-fallback');}document.querySelector('#rr-keep').focus();}
function keepRacing(){if(!confirming)return;confirming=false;if(dialog.close)dialog.close();else dialog.removeAttribute('open');dialog.classList.remove('rr-dialog-fallback');root.classList.remove('rr-confirming');clock.resume();movement?.play();if('speechSynthesis'in window)speechSynthesis.resume();if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});}
async function leave(href){clock.reset();movement?.cancel();movement=null;race.reset();confirming=false;root.classList.remove('rr-expanded','rr-confirming');document.body.classList.remove('rr-view-lock');if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}if(document.fullscreenElement===root){try{await document.exitFullscreen();}catch{}}intro();location.assign(href);}
function fullState(){return document.fullscreenElement===root||root.classList.contains('rr-expanded');}
function syncView(){const full=fullState();fullButton.textContent=full?'Normal screen':'Full screen';fullButton.setAttribute('aria-pressed',String(full));document.querySelector('#rr-view-status').textContent=root.classList.contains('rr-expanded')?'Expanded view · native fullscreen is unavailable':full?'Full screen view':'Normal view';}
fullButton.addEventListener('click',async()=>{if(fullState()){if(document.fullscreenElement===root){try{await document.exitFullscreen();}catch{}}root.classList.remove('rr-expanded');document.body.classList.remove('rr-view-lock');document.querySelector('#rr-view-status').textContent='Normal view';}else{let native=false;if(root.requestFullscreen){try{await root.requestFullscreen();native=document.fullscreenElement===root;}catch{}}if(!native){root.classList.add('rr-expanded');document.body.classList.add('rr-view-lock');}document.querySelector('#rr-view-status').textContent=native?'Full screen view':'Expanded view · native fullscreen is unavailable';}syncView();});
document.addEventListener('fullscreenchange',syncView);
document.querySelector('#rr-exit').addEventListener('click',()=>askExit());document.querySelector('#rr-keep').addEventListener('click',keepRacing);document.querySelector('#rr-leave').addEventListener('click',()=>leave(destination));dialog.addEventListener('cancel',event=>{event.preventDefault();keepRacing();});
dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();keepRacing();}if(event.key==='Tab'){const first=document.querySelector('#rr-keep'),last=document.querySelector('#rr-leave');if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
document.addEventListener('click',event=>{if(!active()||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;const a=event.composedPath().find(n=>n?.tagName==='A'&&n.href);if(a&&!a.getAttribute('href').startsWith('#')){event.preventDefault();askExit(a.href);}},true);
window.addEventListener('pagehide',()=>{if('speechSynthesis'in window){speechSynthesis.cancel();speechSynthesis.resume();}clock.reset();movement?.cancel();});
window.addEventListener('pageshow',event=>{if(event.persisted){confirming=false;if(dialog.open){if(dialog.close)dialog.close();else dialog.removeAttribute('open');}root.classList.remove('rr-expanded','rr-confirming');document.body.classList.remove('rr-view-lock');selected='clover';intro();syncView();}});
document.querySelector('#rr-source').textContent=(selection?`Library selection: ${selection}. Its questions are not connected to this race. `:'')+'Active bank: 30 local addition, subtraction and multiplication questions. Results are not saved to an account.';
intro();syncView();if(window.customElements)customElements.whenDefined('qb-site-header').then(preserveContext);
})();
