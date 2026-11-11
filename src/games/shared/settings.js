import {prepareLaunch} from './launch.js?v=11';
import {element,link,applyGameStyles} from './dom.js?v=11';
import {journey,selectedSet} from './navigation.js?v=11';
import {gameHref} from './question-selection.js?v=11';
import {readSettings,saveSettings,changeSetting,validateSettings,describeSettings} from './settings-state.js?v=11';
export function renderSettings(root,game,selection){
 const schema=game.settings;
 document.title=schema.title+' — QB Interactive Learning Kits';
 applyGameStyles(game);
 root.classList.add('game-introduction','game-configuration');root.dataset.game=game.slug;
 const steps=journey(selection,true);steps.querySelector('[aria-current="step"]').href='#game-settings';
 const heading=element('header','game-intro-heading');heading.id='game-settings';
 heading.append(element('span','qb-badge',game.introductionTitle),element('h1','',schema.title),element('p','game-intro-lead','Make it your adventure. Choose your options before play.'));
 const how=element('section','settings-how');how.setAttribute('aria-labelledby','setup-how-title');
 const art=element('img');art.src=game.hero;art.alt=game.heroAlt;art.width=260;art.height=117;
 const howCopy=element('div');const howTitle=element('h2','','How to Play');howTitle.id='setup-how-title';
 const instructions=element('ol');game.steps.forEach(step=>instructions.append(element('li','',step)));howCopy.append(howTitle,instructions);how.append(art,howCopy);
 const form=element('form','settings-sheet');form.setAttribute('aria-label',schema.sectionTitle);
 const title=element('h2','',schema.sectionTitle);form.append(title);
 let values=readSettings(schema,selection);
 const controls=new Map();
 function fieldset(field){
  const section=element('fieldset','settings-field settings-field--'+field.type);section.id='settings-'+field.key;
  section.append(element('legend','',field.label));
  let helper;
  if(field.helper){helper=element('p','settings-help',field.helper);helper.id=section.id+'-help';section.append(helper);}
  const inputs=[];
  if(field.type==='choices'){
   const group=element('div','settings-choices');group.dataset.field=field.key;
   for(const option of field.options){
    const choice=element('label','settings-choice');choice.dataset.value=String(option.value);
    const input=element('input','settings-choice-input');input.type='radio';input.name=field.key;input.value=String(option.value);input.disabled=!!option.disabled;input.required=true;
    const copy=element('span','settings-choice-copy');
    if(option.image){choice.classList.add('settings-ship-choice');const image=element('img');image.src=option.image;image.alt='';image.width=170;image.height=150;copy.append(image);}
    copy.append(element('strong','',option.label));if(option.description)copy.append(element('small','',option.description));
    input.addEventListener('change',()=>{if(input.checked)changed(field,input.value);});
    choice.append(input,copy);group.append(choice);inputs.push(input);
   }section.append(group);
  }else if(field.type==='select'){
   const input=element('select');input.id='control-'+field.key;input.name=field.key;input.required=true;input.setAttribute('aria-label',field.label);
   field.options.forEach(option=>{const node=element('option','',option.label);node.value=String(option.value);node.disabled=!!option.disabled;input.append(node);});
   input.addEventListener('change',()=>changed(field,field.numeric?Number(input.value):input.value));section.append(input);inputs.push(input);
  }else{
   const label=element('label','settings-toggle');const input=element('input');input.type='checkbox';input.name=field.key;
   input.addEventListener('change',()=>changed(field,input.checked));label.append(input,element('span','',field.label));section.append(label);inputs.push(input);
  }
  controls.set(field.key,{field,section,inputs,helper});return section;
 }
 // Keep the topic/activity and mode groups prominent, with compact level/count rows below.
 const grid=element('div','settings-fields');schema.fields.forEach(field=>grid.append(fieldset(field)));form.append(grid);
 const summary=element('p','settings-summary');summary.id='settings-summary';summary.setAttribute('aria-label','Selected game options');
 const feedback=element('p','settings-feedback');feedback.id='settings-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
 const availability=element('p','game-play-status');availability.id='settings-play-status';
 const sourceBox=element('section','practice-bank-panel');const sourceName=element('p');sourceName.setAttribute('aria-live','polite');const consent=element('input');consent.type='checkbox';consent.required=true;const consentLabel=element('label','settings-toggle');consentLabel.append(consent,element('span','','Use these local practice questions'));sourceBox.append(element('h2','','Questions for this round'),sourceName,element('p','',selection.questionSet?'The selected set '+selection.questionSet.name+' is a library preview. This round uses the local practice bank named above.':'This round uses the local practice bank named above.'),consentLabel);
 if(game.gameplay)form.append(sourceBox);let starting=false;
 const actions=element('div','game-intro-actions settings-actions');
 const back=link('Back to Introduction',gameHref(game.slug,selection),'qb-button qb-button--blue');
 const play=element('button','qb-button qb-button--mint','Play');play.type='submit';play.disabled=true;play.setAttribute('aria-disabled','true');play.setAttribute('aria-describedby','settings-play-status settings-feedback');
 actions.append(link('Back to Game Library',gameHref(null,selection),'qb-button'),back,play);
 form.append(summary,feedback,availability,actions);
 function update(saved){
  const errors=validateSettings(schema,values);
  sourceName.textContent=game.practiceLabel?.(values)||'Practice bank not connected.';
  play.disabled=starting||errors.length>0||!consent.checked||!game.gameplay;play.setAttribute('aria-disabled',String(play.disabled));
  availability.textContent=game.gameplay ? 'Review the practice bank above and confirm it to enable Play.' : 'Play is not available for this game yet.';
  for(const {field,section,inputs,helper} of controls.values()){
   const invalid=errors.some(error=>error.fields.includes(field.key));
   section.setAttribute('aria-invalid',String(invalid));
   for(const input of inputs){
    if(field.type==='choices')input.checked=input.value===String(values[field.key]);
    else if(field.type==='toggle')input.checked=values[field.key];
    else input.value=String(values[field.key]);
    input.setAttribute('aria-invalid',String(invalid));
    const ids=[...(helper?[helper.id]:[]),...(invalid?[feedback.id]:[])];
    if(ids.length)input.setAttribute('aria-describedby',ids.join(' '));else input.removeAttribute('aria-describedby');
   }
  }
  summary.textContent=describeSettings(schema,values);
  feedback.textContent=errors.length ? errors.map(error=>error.message).join(' ') : saved===false ? 'These settings apply here, but your browser could not save them.' : 'Your settings are saved for this game and question set on this device.';
  feedback.classList.toggle('settings-feedback--error',errors.length>0);
 }
 function changed(field,value){
  values=changeSetting(schema,values,field.key,value);consent.checked=false;
  const saved=saveSettings(schema,selection,values);update(saved);
 }
 consent.addEventListener('change',()=>update());
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(starting||!game.gameplay||!consent.checked||validateSettings(schema,values).length){update();return;}
  starting=true;update();
  try{saveSettings(schema,selection,values);const launch=prepareLaunch(game,selection,values);const {startGame}=await import('./play.js?v=11');history.pushState({},'',gameHref(game.slug,selection,'play'));await startGame(root,game,selection,launch);}catch(error){starting=false;update();feedback.textContent=error.message||'We could not start. Review your settings and try again.';}
 });
 root.replaceChildren(steps,heading,how,selectedSet(selection),form);
 update(saveSettings(schema,selection,values));
}
