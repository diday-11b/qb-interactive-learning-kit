import {isAvailable} from './availability.js?v=11';
import {element,link,applyGameStyles} from './dom.js?v=11';
import {journey} from './navigation.js?v=11';
import {gameHref} from './question-selection.js?v=11';
import {validateSettings} from './settings-state.js?v=11';
import {takeLaunch} from './launch.js?v=11';
import {Session,shuffle} from './session.js?v=11';
let disposeCurrent=()=>{};
export async function startGame(root,game,selection,suppliedLaunch){
 if(!isAvailable(game)){
  root.replaceChildren(element('h1','',game.title),element('p','','Coming Soon'),link('Back to Game Library',gameHref(null,selection)));return;
 }
 disposeCurrent();
 const storedLaunch=takeLaunch(game,selection);
 const launch=suppliedLaunch||storedLaunch;
 if(!launch?.accepted||!game.gameplay||validateSettings(game.settings,launch.config).length){
  root.replaceChildren(element('h1','','Choose your game options first'),element('p','','Review the local practice bank and confirm it before starting.'),link('Review Game Settings',gameHref(game.slug,selection,'settings')));return;
 }
 const config=structuredClone(launch.config);applyGameStyles(game);
 const engine=await game.gameplay();
 function begin(){
  disposeCurrent();
  let questions=engine.buildQuestions(config);if(config.randomize)questions=shuffle(questions);if(questions.length<config.count)throw Error('This bank does not have enough reviewed questions.');
  questions=questions.slice(0,config.count).map(q=>({...q,...(q.options?{options:shuffle(q.options)}:{})}));
  const session=new Session(questions),source=game.practiceLabel(config);
  let sound=config.sound!==false,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,timer=null,deadline=0,remaining=0,callback=null,disposed=false,last='';
  const abort=new AbortController();
  const steps=journey(selection,true);steps.querySelector('[aria-current="step"]').href='#active-game';
  const heading=element('header','play-heading');heading.id='active-game';heading.append(element('h1','',game.introductionTitle),element('p','practice-source',source+' · Local practice'));
  const context=element('p','play-context',selection.questionSet ? 'Library preview: '+selection.questionSet.name+' (not the active question bank).' : 'Using the local practice bank selected in Game Settings.');
  const hud=element('div','play-hud');const progress=element('strong');progress.setAttribute('aria-live','polite');const tools=element('div','play-tools');
  const wrap=element('div','play-stage');const area=element('div','play-area');const cover=element('div','pause-cover','Game paused');cover.hidden=true;wrap.append(area,cover);
  const feedback=element('section','play-feedback');feedback.setAttribute('aria-live','polite');
  root.classList.remove('game-configuration');root.classList.add('game-introduction','playing-game');root.dataset.game=game.slug;root.replaceChildren(steps,heading,context,hud,wrap,feedback);
  function button(text,action,className='qb-button'){const b=element('button',className,text);b.type='button';b.addEventListener('click',action);return b;}
  function stop(){disposed=true;clearTimeout(timer);abort.abort();engineView.dispose?.();if('speechSynthesis'in window)speechSynthesis.cancel();}
  disposeCurrent=stop;window.addEventListener('pagehide',stop,{signal:abort.signal});
  function schedule(){deadline=performance.now()+remaining;timer=setTimeout(()=>{if(disposed||session.paused)return;const done=callback;callback=null;done?.();},remaining);}
  function setPaused(){
   session.paused=!session.paused;pause.textContent=session.paused?'Resume':'Pause';root.classList.toggle('is-paused',session.paused);cover.hidden=!session.paused;area.inert=session.paused;feedback.inert=session.paused;
   if(session.paused){if(callback){clearTimeout(timer);remaining=Math.max(0,deadline-performance.now());}if('speechSynthesis'in window)speechSynthesis.cancel();}else if(callback)schedule();
  }
  const pause=button('Pause',setPaused);const audio=button(sound?'Sound on':'Sound off',()=>{sound=!sound;audio.textContent=sound?'Sound on':'Sound off';audio.setAttribute('aria-pressed',String(sound));if(!sound&&'speechSynthesis'in window)speechSynthesis.cancel();});audio.setAttribute('aria-pressed',String(sound));
  const motion=button(reduced?'Motion off':'Reduce motion',()=>{reduced=!reduced;root.classList.toggle('reduce-motion',reduced);motion.textContent=reduced?'Motion off':'Reduce motion';motion.setAttribute('aria-pressed',String(reduced));});motion.setAttribute('aria-pressed',String(reduced));root.classList.toggle('reduce-motion',reduced);
  tools.append(pause,audio,motion,link('Exit Game',gameHref(null,selection),'qb-button'));hud.append(progress,tools);
  const rt={session,config,game,element,button,paint,
   answer(value){const answer=session.submit(value);if(answer.accepted)last=answer.correct?'Correct! Your game action is unlocked.':'Not quite. Try again—you can do this.';return answer;},
   reward(bonus=0){if(!session.reward(bonus))return false;progress.textContent=`Turn ${Math.min(session.solved+1,session.total)} / ${session.total} · Stars ${session.solved} / ${session.total}`;area.querySelectorAll('button,input').forEach(b=>b.disabled=true);feedback.replaceChildren(element('p','correct-answer-message','Correct! +1 star'+(bonus?' · '+bonus+' bonus points':'')));return true;},
   animate(ms,fn){remaining=reduced?0:ms;callback=fn;schedule();},
   next(){if(!session.advance())return;last=session.phase==='complete'?'Round complete!':'Great work! Your next turn is ready.';paint();},
   hint(panel,q){if(config.mode==='practice'&&q.hint)panel.append(element('p','play-hint',q.hint));},
   speak(text){if(!sound)return false;if(!('speechSynthesis'in window)){last='Audio is unavailable in this browser. Use the written clue.';paint();return false;}speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';speechSynthesis.speak(utterance);return true;}
  };
  const engineView=engine.mount(rt);
  function results(){
   const result=session.result();
   const card=element('section','play-card results-card');card.setAttribute('aria-label','Round results');card.append(element('h2','','Game Completed'),element('p','results-intro',game.title+' · You completed every turn. Well done!'));
   const stats=element('dl','result-stats');for(const [label,value]of [['Stars earned',result.completed+' / '+result.total],['Correct first try',result.firstTry+' / '+result.total],['Wrong attempts',String(result.wrongAttempts)],['First-try accuracy',result.accuracy+'%'],...(result.bonus?[['Bonus points',String(result.bonus)]]:[])]){const tile=element('div');tile.append(element('dt','',label),element('dd','',value));stats.append(tile);}card.append(stats);
   const actions=element('div','play-result-actions');
   const retry=link('Retry',gameHref(game.slug,selection,'settings'),'qb-button qb-button--mint');
   const exit=link('Exit','/','qb-button qb-button--blue');
   actions.append(retry,exit);card.append(element('p','practice-source',source),actions);
   area.replaceChildren(card);feedback.replaceChildren();tools.hidden=true;progress.textContent='Completed · '+result.completed+' / '+result.total+' stars';
   retry.focus();
  }
  function paint(){
   if(disposed)return;if(session.phase==='complete'){results();return;}
   progress.textContent=`Turn ${Math.min(session.solved+1,session.total)} / ${session.total} · Stars ${session.solved} / ${session.total}`;
   area.replaceChildren();engineView.render(area);feedback.replaceChildren(element('p','',last));
   if(session.phase==='question')feedback.append(button('Hear question',()=>rt.speak(session.question.prompt)));
   if(session.phase==='feedback')feedback.append(button('Try again',()=>{if(!session.retry())return;last='Try again. Read the clue carefully.';paint();},'qb-button qb-button--blue'));
  }
  paint();root.scrollIntoView({block:'start',behavior:'auto'});
 }
 begin();
}
