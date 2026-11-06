(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const signOutButton = $("sign-out");
  signOutButton.hidden = true;
  signOutButton.style.setProperty("display", "none", "important");
  const state = { classes: [], classId: "", students: [], groups: [], scope: "class", games: [], drawn: new Set(), stars: new Map(), rotation: 0, spinning: false, spinTimer: 0, classRequest: 0 };
  const el = (tag, cls, text) => { const node = document.createElement(tag); if (cls) node.className = cls; if (text !== undefined && text !== null) node.textContent = String(text); return node; };
  const status = (text, error = false) => { const node = $("tools-status"); node.textContent = text; node.hidden = false; node.classList.toggle("error", error); };
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rejection sampling avoids modulo bias for each classroom draw.
  function fairInt(max) {
    if (!Number.isSafeInteger(max) || max < 1) throw new Error("There are no choices to draw from.");
    if (!crypto?.getRandomValues) throw new Error("Secure random selection is unavailable in this browser.");
    const ceiling = Math.floor(0x100000000 / max) * max, bucket = new Uint32Array(1);
    do { crypto.getRandomValues(bucket); } while (bucket[0] >= ceiling);
    return bucket[0] % max;
  }
  function shuffled(items) { const copy = items.slice(); for (let i = copy.length - 1; i > 0; i--) { const j = fairInt(i + 1); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; }
  function participants() {
    if (state.scope === "class") return state.students.slice();
    const group = state.groups.find((item) => item.id === state.scope);
    return group ? group.students.slice() : state.students.slice();
  }
  function populateClasses() {
    const select = $("class-select"); select.replaceChildren(new Option("Choose your class", ""));
    state.classes.forEach((item) => select.add(new Option(`${item.name} · ${item.studentCount} learners`, item.id)));
    select.value = state.classId;
  }
  function updateClassControls(ready = false) {
    const hasRoster = ready && state.students.length > 0;
    ["scope-select", "group-count", "generate-groups", "regroup", "reset-groups", "spin-button", "reset-wheel", "reset-stars"].forEach((id) => { $(id).disabled = !hasRoster; });
    $("class-select").disabled = !state.classes.length;
    $("scope-select").disabled = !hasRoster || !state.groups.length;
    $("regroup").disabled = !hasRoster || !state.groups.length;
    $("reset-groups").disabled = !state.groups.length;
    $("spin-button").disabled = !hasRoster || participants().every((student) => state.drawn.has(student.id));
    $("reset-wheel").disabled = !hasRoster || state.drawn.size === 0;
    $("reset-stars").disabled = !hasRoster || state.stars.size === 0;
  }
  function populateScopes() {
    const select = $("scope-select"), previous = state.scope;
    select.replaceChildren(new Option("Whole class", "class"));
    state.groups.forEach((group, index) => select.add(new Option(`${group.name} · ${group.students.length}`, group.id)));
    select.value = state.groups.some((group) => group.id === previous) ? previous : "class";
    state.scope = select.value; drawWheel(); renderStars();
  }
  function drawWheel() {
    const canvas = $("student-wheel"), ctx = canvas.getContext("2d"), roster = participants(), available = roster.filter((student) => !state.drawn.has(student.id));
    const wheelNames = available.length ? available : roster;
    const center = canvas.width / 2, radius = center - 6;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!wheelNames.length) { ctx.fillStyle = "#eaf0f4"; ctx.beginPath(); ctx.arc(center,center,radius,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#52647a"; ctx.font='18px "Luckiest Guy", system-ui'; ctx.textAlign="center"; ctx.fillText("Class roster is empty",center,center+5); return; }
    const colors = ["#75c9f5", "#ffd76a", "#a8e6cf", "#ff9a8b", "#d8c8ff", "#c2efff"];
    const slice = Math.PI * 2 / wheelNames.length;
    wheelNames.forEach((student,index) => {
      const start = -Math.PI / 2 + index * slice, end = start + slice, mid = start + slice/2;
      ctx.beginPath(); ctx.moveTo(center,center); ctx.arc(center,center,radius,start,end); ctx.closePath(); ctx.fillStyle=colors[index%colors.length]; ctx.fill(); ctx.strokeStyle="#253247"; ctx.lineWidth=2; ctx.stroke();
      ctx.save(); ctx.translate(center+Math.cos(mid)*radius*.64,center+Math.sin(mid)*radius*.64); ctx.rotate(mid+Math.PI/2); ctx.fillStyle="#253247"; ctx.font=`${wheelNames.length>16?12:15}px "Luckiest Guy", system-ui`; ctx.textAlign="center"; ctx.textBaseline="middle"; const name=student.displayName.length>15?`${student.displayName.slice(0,13)}…`:student.displayName; ctx.fillText(name,0,0,radius*.57); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(center,center,29,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#253247"; ctx.lineWidth=3; ctx.stroke();
  }
  function clearWheelResult() { $("wheel-result").textContent = "Ready when your class is."; }
  function spinWheel() {
    if (state.spinning) return;
    const roster = participants(), candidates = roster.filter((student) => !state.drawn.has(student.id));
    if (!candidates.length) { status(roster.length ? "Everyone in this group has had a turn. Reset the wheel to start a new round." : "Choose a class with learners before spinning.", !roster.length); return; }
    const winner = candidates[fairInt(candidates.length)], index = candidates.findIndex((student) => student.id === winner.id);
    const sector = 360 / candidates.length, center = -90 + (index + .5) * sector;
    const baseRotation = ((state.rotation % 360) + 360) % 360;
    const target = state.rotation + 4 * 360 + ((-90 - center - baseRotation + 720) % 360);
    state.spinning = true; $("spin-button").disabled = true; $("reset-wheel").disabled = true;
    if (reducedMotion()) { state.rotation = 0; $("student-wheel").style.transform = "rotate(0deg)"; finishSpin(winner); return; }
    requestAnimationFrame(() => { $("student-wheel").style.transform = `rotate(${target}deg)`; });
    state.rotation = target;
    state.spinTimer = window.setTimeout(() => { state.spinTimer = 0; finishSpin(winner); }, 4100);
  }
  function finishSpin(winner) {
    state.drawn.add(winner.id); state.spinning = false;
    $("wheel-result").replaceChildren(el("strong", "", `🎉 ${winner.displayName}`), document.createTextNode(" gets a turn!"));
    drawWheel(); updateClassControls(true); status("Selected fairly from the remaining learners. The draw stays on this page only.");
  }
  function resetWheel() { state.drawn.clear(); state.rotation = 0; $("student-wheel").style.transform = "rotate(0deg)"; drawWheel(); updateClassControls(true); clearWheelResult(); status("Wheel reset. Everyone is available for the next round."); }
  function renderGroups() {
    const host = $("group-results"); host.replaceChildren();
    if (!state.groups.length) { host.append(el("div", "ct-empty", "No groups generated yet. Choose a group count and generate balanced groups.")); updateClassControls(Boolean(state.students.length)); return; }
    state.groups.forEach((group) => {
      const card = el("article", "ct-group"), title = el("h3", "", `${group.name} · ${group.students.length} ${group.students.length===1?"learner":"learners"}`), list=el("div","ct-student-list");
      group.students.forEach((student) => list.append(el("div", "ct-student", student.displayName)));
      card.append(title,list); host.append(card);
    }); updateClassControls(Boolean(state.students.length));
  }
  function makeGroups() {
    const roster = state.students;
    if (!roster.length) { state.groups=[]; renderGroups(); status("Add learners to a class before generating groups.",true); return; }
    const count = Math.min(Number($("group-count").value)||2, roster.length), buckets=Array.from({length:count},(_,i)=>({id:`group-${i+1}`,name:`Group ${i+1}`,students:[]}));
    shuffled(roster).forEach((student,index)=>buckets[index%count].students.push(student));
    state.groups=buckets; state.scope="class"; populateScopes(); renderGroups(); status(`${roster.length} learners were placed once each across ${count} balanced groups.`);
  }
  function renderStars() {
    const host=$("star-chart"), roster=participants(); host.replaceChildren();
    if (!roster.length) { host.append(el("div","ct-empty","Choose a class with learners to use the encouragement chart.")); return; }
    roster.forEach((student)=>{
      const row=el("div","ct-star-row"), name=el("span","",student.displayName), count=el("strong","",`⭐ ${state.stars.get(student.id)||0}`), add=el("button","ct-button ct-button-primary","＋ Star");
      add.type="button"; add.setAttribute("aria-label",`Add one encouragement star for ${student.displayName}`); add.addEventListener("click",()=>{state.stars.set(student.id,(state.stars.get(student.id)||0)+1);count.textContent=`⭐ ${state.stars.get(student.id)}`;$("reset-stars").disabled=false;});
      row.append(name,count,add);host.append(row);
    }); updateClassControls(Boolean(state.students.length));
  }
  function resetStars() { state.stars.clear();renderStars();updateClassControls(Boolean(state.students.length));status("This page’s encouragement chart was reset. No reward records were changed."); }
  function rollDice() {
    const count=Number($("dice-count").value)||1, host=$("dice-result");host.replaceChildren();
    for(let i=0;i<count;i++){const value=fairInt(6)+1,face=el("span","ct-die",["⚀","⚁","⚂","⚃","⚄","⚅"][value-1]);face.setAttribute("role","img");face.setAttribute("aria-label",`Die shows ${value}`);host.append(face);}
    const values=Array.from(host.querySelectorAll(".ct-die"),node=>node.getAttribute("aria-label").replace("Die shows ",""));
    $("dice-total").textContent=count>1?`Total: ${values.reduce((sum,value)=>sum+Number(value),0)}`:"";
  }
  async function loadGames() {
    const result=await QBSupabase.getGameLibrary();
    state.games=(result.games||[]).filter((game)=>game.route==="/game-player.html"&&game.engine_type);
    const select=$("activity-select");select.replaceChildren(new Option("Choose an available class game",""));
    state.games.forEach((game)=>select.add(new Option(game.title,game.id)));
    select.disabled=!state.games.length;$("pick-activity").disabled=!state.games.length;
    if(!state.games.length) $("activity-result").textContent="No published game activities are available to select yet.";
  }
  function pickActivity() {
    if(!state.games.length){status("No published game activities are available yet.",true);return;}
    const activity=state.games[fairInt(state.games.length)];$("activity-select").value=activity.id;
    showActivity(activity);
    status("Random activity selected from the published game library. No classroom record was created.");
  }
  function showActivity(activity) {
    const host=$("activity-result"), title=el("strong","",activity.title), link=el("a","ct-activity-link","Prepare class assignment");
    link.href=`/17._qb_classroom_student_roster_manager/code.html?class_id=${encodeURIComponent(state.classId)}&activity_id=${encodeURIComponent(activity.id)}`;
    host.replaceChildren(title,document.createTextNode(` · ${activity.category||"Learning game"} · `),link);
  }
  async function loadClass(classId) {
    const request=++state.classRequest;
    if(state.spinTimer){window.clearTimeout(state.spinTimer);state.spinTimer=0;}
    state.spinning=false;
    state.classId=classId;state.students=[];state.groups=[];state.scope="class";state.drawn.clear();state.stars.clear();state.rotation=0;populateClasses();populateScopes();renderGroups();renderStars();clearWheelResult();updateClassControls(false);
    $("class-summary").textContent="Loading the selected class roster…";
    if(!classId){state.students=[];$("class-summary").textContent="Choose a class to load its authorized roster.";drawWheel();renderStars();return;}
    try{
      const result=await QBSupabase.getTeacherClassroom(classId);
      if(request!==state.classRequest)return;
      const selected=result.selectedClass;
      if(!selected)throw new Error("This class is unavailable to your teacher account.");
      state.students=Array.from(new Map((selected.students||[]).map(student=>[student.id,student])).values());
      $("class-summary").textContent=`${selected.name} · ${state.students.length} ${state.students.length===1?"learner":"learners"}`;
      populateScopes();renderGroups();renderStars();drawWheel();updateClassControls(true);status("Class roster loaded securely from your teacher account.");
    }catch(error){if(request!==state.classRequest)return;state.students=[];$("class-summary").textContent="Roster could not be loaded.";drawWheel();renderStars();updateClassControls(false);status(error.message||"Could not load this class.",true);}
  }
  async function init(){
    if(!QBSupabase?.configured){status("Connect Supabase to load your real classes and learners. No sample names are shown.",true);return;}
    try{
      const session=await QBSupabase.getSession();if(!session){location.replace("/16._qb_unified_sign_in_sign_up/code.html?next=teacher-tools");return;}
      const profile=await QBSupabase.getProfile(session.user.id);if(profile?.role!=="teacher"){status("Classroom tools are available to teacher accounts only.",true);return;}
      const data=await QBSupabase.getTeacherClassroom();state.classes=data.classes||[];populateClasses();
      signOutButton.hidden=false;signOutButton.style.removeProperty("display");signOutButton.addEventListener("click",async()=>{try{await QBSupabase.signOut();location.assign("/16._qb_unified_sign_in_sign_up/code.html");}catch(error){status(error.message||"Sign out failed.",true);}});
      if(state.classes.length){state.classId=state.classes[0].id;populateClasses();$("class-select").disabled=false;await loadClass(state.classId);}else{state.students=[];$("class-summary").textContent="No classes yet. Create a class and add learners to use the name wheel, groups, or star chart.";populateScopes();renderGroups();renderStars();drawWheel();updateClassControls(false);status("No classes are available yet. These tools use your teacher-owned class roster.");}
      try{await loadGames();}catch(error){status(error.message||"Published activities could not be loaded.",true);}
    }catch(error){status(error.message||"Could not load classroom tools.",true);}
  }
  $("class-select").addEventListener("change",event=>void loadClass(event.target.value));
  $("scope-select").addEventListener("change",event=>{state.scope=event.target.value;state.drawn.clear();state.rotation=0;$("student-wheel").style.transform="rotate(0deg)";clearWheelResult();drawWheel();renderStars();});
  $("spin-button").addEventListener("click",spinWheel);$("reset-wheel").addEventListener("click",resetWheel);
  $("generate-groups").addEventListener("click",makeGroups);$("regroup").addEventListener("click",makeGroups);$("reset-groups").addEventListener("click",()=>{state.groups=[];state.scope="class";populateScopes();renderGroups();status("Generated groups cleared.");});
  $("reset-stars").addEventListener("click",resetStars);$("roll-dice").addEventListener("click",rollDice);$("reset-dice").addEventListener("click",()=>{$("dice-result").replaceChildren(el("span","ct-note","Roll the dice to begin."));$("dice-total").textContent="";});
  $("pick-activity").addEventListener("click",pickActivity);$("activity-select").addEventListener("change",event=>{const activity=state.games.find(game=>game.id===event.target.value);if(activity)showActivity(activity);else $("activity-result").textContent="Select an activity or choose one at random.";});
  init();
})();
