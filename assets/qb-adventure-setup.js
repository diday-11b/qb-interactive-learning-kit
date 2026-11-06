(() => {
'use strict';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
const profiles={picture:['🖼️','Match pictures and spelling.'],listen:['🔊','Listen carefully and choose a word.'],complete:['✏️','Find the missing letters.'],mixed:['🚀','Explore different spelling challenges.'],practice:['','Helpful hints from the start.'],adventure:['','Complete the journey and collect rewards.'],challenge:['','Hard difficulty and an accuracy badge.']};
const preferences=new WeakMap();
function cards(select,kind='subject'){
 const group=el('div',kind==='mode'?'setup-modes':'setup-subjects');group.setAttribute('role','group');group.setAttribute('aria-label',kind==='mode'?'Choose your way to play':'What will we discover?');
 const buttons=Array.from(select.options).map(o=>{const b=el('button','setup-option');b.type='button';const parts=o.textContent.split(' · '),info=profiles[o.value];if(kind!=='mode')b.append(el('span','setup-icon',info?.[0]||'🎮'));b.append(el('strong','',parts[0]),el('small','',info?.[1]||parts.slice(1).join(' · ')||(kind==='mode'?'Play at your own pace.':'Practice one thoughtful answer at a time.')));b.onclick=()=>{select.value=o.value;select.dispatchEvent(new Event('change',{bubbles:true}));};group.append(b);return[b,o];});
 const sync=()=>buttons.forEach(([b,o])=>{b.disabled=select.disabled||o.disabled;b.setAttribute('aria-pressed',String(o.value===select.value));});select.addEventListener('change',sync);new MutationObserver(sync).observe(select,{attributes:true,subtree:true,attributeFilter:['disabled']});sync();return group;
}
function normalize(settings){
 const fields=Array.from(settings.querySelectorAll('label')).filter(n=>n.querySelector('select'));const container=el('div','setup-structured'),hidden=el('div');hidden.hidden=true;
 let subject,mode;const challenge=el('div','setup-challenge');
 for(const field of fields){const select=field.querySelector('select'),key=select.dataset.config||field.firstChild?.textContent.toLowerCase()||'';
 if(/activity|choose a game/.test(key)){subject=select;hidden.append(field);}else if(/mode/.test(key)){mode=select;hidden.append(field);}else if(/timer/.test(key)){hidden.append(field);}else challenge.append(field);}
 if(subject)container.append(el('h2','','1. What will we discover?'),cards(subject));
 if(mode)container.append(el('h2','','2. Choose your way to play'),cards(mode,'mode'));
 container.append(el('h2','','3. Pick your challenge'),challenge,hidden);settings.replaceChildren(...container.childNodes);settings.className='setup-structured';return settings;
}
function shuffle(items){for(let i=items.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[items[i],items[j]]=[items[j],items[i]];}return items;}
function speak(root,text){if(!preferences.get(root)?.sound||!('speechSynthesis'in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';speechSynthesis.speak(u);}
function mount({root,title,art,artNode,instructions,settings,status,actions,characters,characterTitle,notice,structured=false,toggles,onPreferences}) {
 if('speechSynthesis'in window)speechSynthesis.cancel();document.body.classList.add('qb-adventure-page');root.classList.add('qb-setup-host');const shell=el('section','qb-adventure-setup');shell.setAttribute('aria-label',title);
 shell.append(el('div','setup-eyebrow','Make it your adventure'),el('h1','','Choose your adventure'));
 const how=el('section','setup-how');if(artNode)how.append(artNode);else if(art){const image=el('img');image.src=art;image.alt=title+' preview';image.width=260;image.height=117;how.append(image);}
 const copy=el('div');copy.append(el('h2','','How to Play'));instructions.forEach(t=>copy.append(el('p','',t)));how.append(copy);shell.append(how);
 const selection=new URLSearchParams(location.search).get('questionSet'),questions=el('details','setup-questions');questions.append(el('summary','','Questions for this adventure'),el('p','',notice||(selection?selection+' was selected in the library. This game uses its local practice bank; the selected set is not loaded.':'Choose a learning activity below. This game uses its local practice bank.')));shell.append(questions);
 const sheet=el('section','setup-sheet'),details=el('details','setup-settings');details.open=true;details.append(el('summary','','Adventure Settings'));const content=el('div','setup-content');if(settings)content.append(structured?settings:normalize(settings));
 const prefs=preferences.get(root)||{randomize:false,sound:true};preferences.set(root,prefs);
 const toggleList=toggles||[{label:'Randomize questions',checked:prefs.randomize,onChange:v=>{prefs.randomize=v;onPreferences?.(prefs);}},{label:'Question sound',checked:prefs.sound,onChange:v=>{prefs.sound=v;if(!v&&'speechSynthesis'in window)speechSynthesis.cancel();onPreferences?.(prefs);}}];
 if(toggleList.length){const row=el('div','setup-toggles');toggleList.forEach(t=>{const label=el('label'),input=el('input');input.type='checkbox';input.checked=t.checked;input.onchange=()=>{t.onChange(input.checked);};label.append(el('span','',t.label),input);row.append(label);});content.append(row);}
 details.append(content);sheet.append(details);
 if(!characters&&art){root.style.setProperty('--adventure-character-filter','none');characters=el('div','setup-character-options');[['original','Original Explorer','none'],['mint','Mint Explorer','hue-rotate(100deg)'],['violet','Violet Voyager','hue-rotate(245deg)']].forEach(([id,label,filter],i)=>{const b=el('button');b.type='button';b.setAttribute('aria-pressed',String(i===0));const image=el('img');image.src=art;image.alt='';image.style.filter=filter;b.append(image,el('span','',label));b.onclick=()=>{root.style.setProperty('--adventure-character-filter',filter);characters.querySelectorAll('button').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));};characters.append(b);});}
 if(characters){characters.classList.add('setup-character-options');const section=el('section','setup-characters');section.append(el('h2','',characterTitle||'Choose your character!'),characters);sheet.append(section);}
 if(status){status.classList.add('setup-status');status.setAttribute('role','status');sheet.append(status);}
 const bar=el('div','setup-playbar'),back=el('a','','Back to Game Library');const url=new URL('/07._qb_game_library_arena_selection/code.html',location.origin);if(selection)url.searchParams.set('questionSet',selection);back.href=url.pathname+url.search;actions.classList.add('setup-actions');Array.from(actions.querySelectorAll('button')).forEach((b,i)=>{if(i===0)b.classList.add('setup-primary');else b.textContent='Back';});bar.append(back,actions);sheet.append(bar);shell.append(sheet);root.replaceChildren(shell);if(status&&!structured){const sync=()=>{const base=status.textContent.split(' · Order:')[0],selected=characters?.querySelector('button[aria-pressed="true"]'),name=selected?.querySelector('strong,span')?.textContent||'';status.textContent=base+' · Order: '+(prefs.randomize?'Random':'Original')+' · Sound '+(prefs.sound?'on':'off')+(name?' · '+name:'');};shell.addEventListener('change',sync);shell.addEventListener('click',sync);sync();}return shell;
}
window.QBAdventureSetup={mount,cards,shuffle,speak,preferences:root=>preferences.get(root)||{randomize:false,sound:true}};
})();
