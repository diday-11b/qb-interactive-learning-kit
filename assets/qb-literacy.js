(function () {
  "use strict";
  const app = document.getElementById("literacy-app");
  if (!app) return;
  const labels = { alphabet: "Alphabet", phonics: "Letter sounds", sight_words: "Sight words", vocabulary: "Picture words", word_formation: "Word building", spelling: "Spelling", listening: "Listening", reading: "Reading" };
  const params = new URLSearchParams(window.location.search);
  const requestedLanguage = params.get("language");
  const requestedArea = params.get("area");
  const state = {
    language: requestedLanguage === "km" ? "km" : "en",
    area: requestedArea === "all" || Object.hasOwn(labels, requestedArea || "") ? requestedArea : "all",
    activities: [], attempts: [], selected: null, questions: [], answers: [], attemptId: null,
    index: 0, feedback: null, errorMessage: "", busy: false
  };
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined) node.textContent = text; return node; };
  const button = (text, cls, onClick) => { const node = el("button", `literacy-button ${cls || ""}`, text); node.type = "button"; node.addEventListener("click", onClick); return node; };
  const empty = (message, error = false) => el("div", `literacy-state${error ? " error" : ""}`, message);
  const activityById = id => state.activities.find(item => item.id === id);
  const latestAttempt = id => state.attempts.find(item => item.activity_id === id && item.status === "in_progress");
  const attemptsFor = id => state.attempts.filter(item => item.activity_id === id);
  function heading(text, level="h2") { const node=el(level,"",text); node.tabIndex=-1; return node; }

  function render() {
    document.documentElement.lang = state.language;
    document.documentElement.setAttribute("lang", state.language);
    app.replaceChildren();
    if (state.selected) { renderActivity(); return; }
    const hero=el("section","literacy-hero");
    const intro=el("div"); intro.append(el("span","literacy-kicker",state.language === "km" ? "សួនរៀនភាសាខ្មែរ" : "Your literacy garden"));
    intro.append(heading(state.language === "km" ? "រៀនអក្សរ និងពាក្យថ្មីៗ!" : "Grow your word power!","h1"));
    intro.append(el("p","",state.language === "km" ? "ស្វែងយល់អក្សរ សំឡេង និងពាក្យថ្មីៗ តាមរយៈសកម្មភាពខ្លីៗ។" : "Explore letters, first sounds, and picture words with short activities made for little learners."));
    const art=el("div","literacy-hero-art","📚🌱");art.setAttribute("aria-hidden","true");hero.append(intro,art);app.append(hero);
    const toolbar=el("div","literacy-toolbar");
    const switcher=el("div","literacy-language");switcher.setAttribute("role","group");switcher.setAttribute("aria-label","Choose activity language");
    [["en","English"],["km","ខ្មែរ · Khmer"]].forEach(([code,label])=>{const b=button(label,"",()=>{state.language=code;state.area="all";render();});b.setAttribute("aria-pressed",String(state.language===code));b.lang=code;switcher.append(b);});
    const areas=el("div","literacy-areas");areas.setAttribute("aria-label","Filter learning area");
    const choices=[["all",state.language==="km"?"ទាំងអស់":"All areas"],...[...new Set(state.activities.filter(a=>a.language===state.language).map(a=>a.learning_area))].map(area=>[area,labels[area]||area])];
    choices.forEach(([value,label])=>{const b=button(label,"",()=>{state.area=value;render();});b.className="";b.setAttribute("aria-pressed",String(state.area===value));areas.append(b);});
    toolbar.append(switcher,areas);app.append(toolbar);
    const available=state.activities.filter(a=>a.language===state.language&&(state.area==="all"||a.learning_area===state.area));
    const title=el("div","literacy-section-title");title.append(heading(state.language==="km"?"ជ្រើសរើសសកម្មភាព":"Choose an activity"));
    title.append(el("p","",`${available.length} ${state.language==="km"?"សកម្មភាព":"activities"}`));app.append(title);
    if (!available.length) { app.append(empty(state.language==="km"?"មិនទាន់មានសកម្មភាពក្នុងប្រភេទនេះទេ។ សូមសាកល្បងភាសា ឬប្រភេទផ្សេង។":"No activities in this area yet. Try another area or language.")); }
    else { const grid=el("div","literacy-grid");available.forEach(activity=>grid.append(activityCard(activity)));app.append(grid); }
    renderHistory();
  }

  function activityCard(activity) {
    const card=el("article","literacy-card");
    const illustration=el("div","literacy-art",activity.illustration||"📖");illustration.setAttribute("aria-hidden","true");card.append(illustration);
    const category=el("span","literacy-pill",labels[activity.learning_area]||activity.learning_area);category.lang=activity.language;card.append(category);
    const title=heading(activity.title,"h3");title.lang=activity.language;card.append(title);
    const objective=el("p","",activity.learning_objective);objective.lang=activity.language;card.append(objective);
    const meta=el("div","literacy-meta",`${activity.language==="km"?"Khmer":"English"} · Ages ${activity.min_age}–${activity.max_age}${activity.estimated_minutes?` · ${activity.estimated_minutes} min`:""}`);card.append(meta);
    const previous=attemptsFor(activity.id).find(item=>item.status==="completed");
    if(previous){const status=el("span","literacy-pill",`${activity.language==="km"?"បានបញ្ចប់":"Completed"} · ${previous.score}%`);card.append(status);}
    const start=button(latestAttempt(activity.id)?(activity.language==="km"?"បន្តរៀន →":"Continue activity →"):(activity.language==="km"?"ចាប់ផ្តើម →":"Start activity →"),"primary",()=>selectActivity(activity));start.lang=activity.language;card.append(start);return card;
  }

  async function selectActivity(activity) {
    if(state.busy)return;state.busy=true;state.selected=activity;state.errorMessage="";render();
    try {
      state.questions=await QBSupabase.getLiteracyQuestions(activity.id);
      if(!state.questions.length)throw new Error("This activity does not have any questions yet.");
      const active=latestAttempt(activity.id);
      if(active){state.attemptId=active.id;state.answers=await QBSupabase.getLiteracyAnswers(active.id);}
      else {state.attemptId=await QBSupabase.startLiteracyAttempt(activity.id);state.answers=[];state.attempts=await QBSupabase.getLiteracyAttempts();}
      state.index=state.answers.length;state.feedback=null;
      if(state.index>=state.questions.length){state.selected=null;render();return;}
    }catch(error){state.selected=null;render();app.append(empty(error.message||"We couldn’t start this activity. Please try again.",true));}
    finally{state.busy=false;}
    if(state.selected)render();
  }

  function renderActivity() {
    const activity=state.selected;
    if(state.busy){app.append(empty("Getting your activity ready…"));return;}
    const shell=el("section","literacy-player");
    const top=el("div","literacy-player-top");const back=button("← Activities","",()=>{state.selected=null;state.feedback=null;render();});top.append(back);
    const progressed=state.index+(state.feedback?1:0);
    const count=el("span","literacy-pill",`${Math.min(state.index+1,state.questions.length)} / ${state.questions.length}`);top.append(count);shell.append(top);
    if(state.index>=state.questions.length){
      const attempt=state.attempts.find(item=>item.id===state.attemptId);
      const result=el("div","literacy-result");result.append(el("div","literacy-question-art","🎉"));result.append(heading(activity.language==="km"?"អស្ចារ្យណាស់!":"Great learning!","h2"));
      result.append(el("p","",activity.language==="km"?"អ្នកបានបញ្ចប់សកម្មភាពនេះហើយ។":"You completed this activity. Your result is saved."));
      if(attempt?.score!==null&&attempt?.score!==undefined)result.append(el("strong","",`${attempt.score}%`));
      result.append(button(activity.language==="km"?"ត្រឡប់ទៅសកម្មភាព":"Back to activities","primary",()=>{state.selected=null;state.questions=[];state.answers=[];render();}));shell.append(result);app.append(shell);return;
    }
    const progress=el("div","literacy-progress");progress.setAttribute("role","progressbar");progress.setAttribute("aria-label","Activity progress");progress.setAttribute("aria-valuemin","0");progress.setAttribute("aria-valuemax",String(state.questions.length));progress.setAttribute("aria-valuenow",String(progressed));const fill=el("span");fill.style.width=`${progressed/state.questions.length*100}%`;progress.append(fill);shell.append(progress);
    const objective=el("p","literacy-meta",activity.learning_objective);objective.lang=activity.language;shell.append(objective);
    const question=state.questions[state.index];
    const art=el("div","literacy-question-art",question.illustration||activity.illustration||"✨");art.setAttribute("aria-hidden","true");shell.append(art);
    const prompt=el("p","literacy-prompt",question.prompt);prompt.lang=activity.language;shell.append(prompt);
    if(activity.instructions){const instructions=el("p","literacy-meta",activity.instructions);instructions.lang=activity.language;shell.append(instructions);}
    if(question.audio_path){const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.setAttribute("aria-label",activity.language==="km"?"ស្តាប់សំឡេងដែលបានថត":"Play recorded pronunciation");const audioError=empty(activity.language==="km"?"សំឡេងនេះមិនអាចចាក់បានទេ។":"This recording is unavailable right now.");audioError.lang=activity.language;audioError.setAttribute("role","status");audioError.setAttribute("aria-live","polite");const showAudioError=()=>{if(audio.isConnected&&!audioError.isConnected)shell.append(audioError);};audio.addEventListener("error",showAudioError);QBSupabase.resolveQuestionMedia(question.audio_path).then(url=>{if(audio.isConnected)audio.src=url;}).catch(showAudioError);shell.append(audio);}
    const choices=el("div","literacy-choice-grid");
    question.choices.forEach(choice=>{const answer=button(choice.text,"literacy-choice",()=>answerQuestion(question,choice));answer.disabled=state.busy||Boolean(state.feedback);answer.lang=activity.language;choices.append(answer);});shell.append(choices);
    if(state.errorMessage){const error=empty(state.errorMessage,true);error.setAttribute("role","alert");shell.append(error);}
    if(state.feedback){const feedback=el("div",`literacy-feedback${state.feedback.correct?"":" try"}`,state.feedback.message);feedback.setAttribute("role","status");feedback.lang=activity.language;shell.append(feedback);
      if(state.feedback.completed){shell.append(button(activity.language==="km"?"មើលលទ្ធផល":"See my result","primary",()=>{state.index=state.questions.length;render();}));}
      else shell.append(button(activity.language==="km"?"បន្ត →":"Next →","primary",()=>{state.index++;state.feedback=null;render();}));
    }
    app.append(shell);
  }

  async function answerQuestion(question,choice) {
    if(state.busy||state.feedback)return;state.busy=true;render();
    try{
      const result=await QBSupabase.submitLiteracyAnswer(state.attemptId,question.id,choice.id);
      state.answers.push({question_id:question.id,choice_id:choice.id});
      if(result.completed){state.attempts=await QBSupabase.getLiteracyAttempts();}
      state.errorMessage="";
      state.feedback={correct:result.correct,completed:result.completed,message:state.selected.language==="km"?(result.correct?"ត្រឹមត្រូវ! ល្អណាស់!":"ព្យាយាមម្តងទៀត! ការហាត់រៀនធ្វើឱ្យយើងចេះកាន់តែច្រើន។"):result.feedback};
    }catch(error){state.feedback=null;state.errorMessage=error.message||"We couldn’t save that answer. Please choose again to retry.";}
    finally{state.busy=false;render();}
  }

  function renderHistory(){
    const recent=state.attempts.filter(attempt=>attempt.status==="completed").slice(0,5);if(!recent.length)return;
    const section=el("section","literacy-history");const title=el("div","literacy-section-title");title.append(heading(state.language==="km"?"អ្វីដែលអ្នកបានបញ្ចប់":"Your completed activities"));section.append(title);
    const list=el("div","literacy-history-list");recent.forEach(attempt=>{const activity=activityById(attempt.activity_id);if(!activity)return;const row=el("div","literacy-history-row");const name=el("span","",activity.title);name.lang=activity.language;row.append(name,el("span","literacy-pill",`${activity.language==="km"?"បានបញ្ចប់":"Completed"} · ${attempt.score}%`));list.append(row);});section.append(list);app.append(section);
  }

  async function load(){
    try{
      if(!QBSupabase.configured){app.replaceChildren(empty("Literacy activities need a connected Supabase project. Follow supabase/README.md to configure this local app.",true));return;}
      const result=await QBSupabase.getLiteracyActivities();
      if(!result.authenticated){location.replace("/16._qb_unified_sign_in_sign_up/code.html?next=student");return;}
      if(!result.authorized){app.replaceChildren(empty("Please sign in with your student account to open these learning activities.",true));return;}
      state.activities=Array.from(new Map(result.activities.map(activity=>[activity.id,activity])).values());
      state.language=result.preferredLanguage||"en";
      state.attempts=await QBSupabase.getLiteracyAttempts();render();
    }catch(error){app.replaceChildren(empty(error.message||"We couldn’t load the literacy activities. Please try again.",true));const retry=button("Try again","primary",load);app.append(retry);}
  }
  load();
})();
