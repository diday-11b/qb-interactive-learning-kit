(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = $("status"), app = $("app"), classDialog = $("class-dialog"), assignDialog = $("assign-dialog");
  const model = { classes: [], selected: null, students: [], student: null, search: "", page: 0, pageSize: 10, activities: [], assignmentProgress: [], classRequest: 0, studentRequest: 0 };
  const el = (tag, className, text) => { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined && text !== null) node.textContent = String(text); return node; };
  const empty = (message) => el("p", "empty-row", message);
  const date = (value) => { if (!value) return "No activity yet"; const time = new Date(value); return Number.isNaN(time.valueOf()) ? "Date unavailable" : time.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); };
  const activeLabel = (value) => {
    if (!value) return "Not started yet";
    const time = new Date(value);
    if (Number.isNaN(time.valueOf())) return "Date unavailable";
    return Date.now() - time.valueOf() > 30 * 86400000 ? `Inactive · ${date(value)}` : date(value);
  };
  const message = (target, text, error) => { target.textContent = text || ""; target.classList.toggle("error", Boolean(error)); };
  function listButton(text, action, className) { const b = el("button", className || "small-action", text); b.type = "button"; b.addEventListener("click", action); return b; }
  function setStatus(text, error) { state.hidden = false; state.textContent = text; state.classList.toggle("error", Boolean(error)); }
  async function refresh(selectedId) {
    const data = await QBSupabase.getTeacherClassroom();
    model.classes = data.classes || [];
    $("class-total").textContent = String(model.classes.length);
    renderClasses();
    app.hidden = false; state.hidden = true;
    const choice = model.classes.find((item) => item.id === (selectedId || model.selected)) || model.classes[0];
    if (choice) await selectClass(choice.id);
    else { model.selected = null; model.students = []; renderDetail(null); }
  }
  function renderClasses() {
    const root = $("class-list"); root.replaceChildren();
    model.classes.forEach((item) => {
      const button = el("button", "class-choice", ""); button.type = "button"; button.setAttribute("aria-current", String(item.id === model.selected));
      button.append(el("b", "", item.name), el("small", "", `${item.gradeLevel || "Class"} · ${item.studentCount} learners`));
      button.addEventListener("click", () => selectClass(item.id)); root.append(button);
    });
    if (!model.classes.length) root.append(empty("No classes yet. Create your first class to invite learners."));
  }
  async function selectClass(id) {
    const request = ++model.classRequest;
    model.selected = id; model.student = null; model.studentDetail = null; model.search = ""; model.page = 0; renderClasses();
    const root = $("class-detail"); root.replaceChildren(empty("Loading class roster…"));
    try {
      const data = await QBSupabase.getTeacherClassroom(id);
      if (request !== model.classRequest) return;
      if (!data.selectedClass) throw new Error("This class is unavailable.");
      model.selectedClass = data.selectedClass; model.students = data.selectedClass.students || [];
      try { model.assignmentProgress = await QBSupabase.getTeacherAssignmentProgress(id); }
      catch (progressError) { model.assignmentProgress = []; setStatus(progressError.message || "Assignment progress is unavailable. Apply the latest assignment migration.", true); }
      if (request !== model.classRequest) return;
      renderDetail(data.selectedClass);
    } catch (error) { if (request === model.classRequest) root.replaceChildren(empty(error.message || "Could not load this class.")); }
  }
  function renderDetail(cls) {
    const root = $("class-detail"); root.replaceChildren();
    if (!cls) { root.append(empty("Choose a class to view its roster, or create one to get started.")); return; }
    const header = el("div", "class-detail-head"), heading = el("div");
    heading.append(el("p", "eyebrow", cls.gradeLevel || "CLASS ROSTER"));
    const title = el("h2", "", cls.name); title.id = "selected-class-name"; heading.append(title);
    heading.append(el("p", "", `${model.students.length} ${model.students.length === 1 ? "learner" : "learners"} · Only learners joined to this class are shown.`));
    const actions = el("div", "class-actions");
    actions.append(listButton("Edit class", () => openClassDialog(cls), "small-action"));
    actions.append(listButton("＋ Assign activity", () => openAssignDialog(null), "small-action mint"));
    header.append(heading, actions); root.append(header);

    const invitation = el("div", "invite-box"), inviteCopy = el("div");
    inviteCopy.append(el("b", "", "Class invitation code"), el("p", "", "Share with a learner. They sign in to their student account and enter this code to join."));
    const code = el("strong", "invite-code", cls.joinCode); code.setAttribute("aria-label", `Class code ${cls.joinCode}`); inviteCopy.append(code);
    const inviteActions = el("div", "class-actions");
    inviteActions.append(listButton("Copy code", async () => { try { await navigator.clipboard.writeText(cls.joinCode); setStatus("Class code copied."); setTimeout(() => state.hidden = true, 2400); } catch (_) { setStatus(`Copy this code: ${cls.joinCode}`); } }, "small-action"));
    inviteActions.append(listButton("Make a new code", async () => { if (!window.confirm("Replace this invitation code? The current code will stop working.")) return; try { await QBSupabase.rotateTeacherClassCode(cls.id); await refresh(cls.id); } catch (error) { setStatus(error.message, true); } }, "small-action"));
    invitation.append(inviteCopy, inviteActions); root.append(invitation);

    const progress = el("section", "assignment-progress"), progressTitle = el("div", "class-detail-head");
    progressTitle.append(el("div", "", ""));
    progressTitle.firstChild.append(el("p", "eyebrow", "REAL LEARNER RESULTS"), el("h3", "", "Assignment progress"));
    progress.append(progressTitle);
    const groups = new Map();
    model.assignmentProgress.forEach((item) => {
      if (!groups.has(item.id)) groups.set(item.id, []);
      groups.get(item.id).push(item);
    });
    if (!groups.size) progress.append(empty("Assignments and learner results will appear here after activities are assigned."));
    groups.forEach((learners) => {
      const first = learners[0], card = el("article", "assignment-progress-card");
      const top = el("div", "assignment-progress-head"), copy = el("div");
      copy.append(el("h4", "", first.title), el("p", "", `${first.activityTitle}${first.dueAt ? ` · Due ${date(first.dueAt)}` : " · No due date"}`));
      const counts = { assigned: 0, in_progress: 0, completed: 0 };
      learners.forEach((learner) => counts[learner.status] = (counts[learner.status] || 0) + 1);
      top.append(copy, el("span", "progress-count", `${counts.completed} of ${learners.length} completed`)); card.append(top);
      if (first.instructions) card.append(el("p", "assignment-instructions", first.instructions));
      const summary = el("div", "progress-states");
      summary.append(el("span", "status-pill", `${counts.assigned} assigned`), el("span", "status-pill", `${counts.in_progress} in progress`), el("span", "status-pill", `${counts.completed} completed`)); card.append(summary);
      const roster = el("div", "assignment-learners");
      learners.forEach((learner) => {
        const row = el("div", "assignment-learner"), identity = el("span", "", learner.studentName);
        row.append(identity, el("span", `status-pill${learner.status === "completed" ? "" : " inactive"}`, learner.status.replace("_", " ")));
        if (learner.status === "completed" && learner.score != null) row.append(el("strong", "", `${learner.score}%`));
        row.append(listButton("View results", () => showStudent(learner.studentId), "small-action")); roster.append(row);
      });
      card.append(roster); progress.append(card);
    });
    root.append(progress);

    const toolbar = el("div", "table-toolbar"), search = el("input", "search-input");
    search.type = "search"; search.placeholder = "Search students in this class"; search.setAttribute("aria-label", "Search students in this class"); search.value = model.search;
    search.addEventListener("input", () => { model.search = search.value.trim().toLocaleLowerCase(); model.page = 0; renderRoster(root); });
    const note = el("span", "section-note", "Activity scores are recorded results for assignments in this class."); toolbar.append(search, note); root.append(toolbar);
    const area = el("div", "roster-area"); root.append(area); renderRoster(root);
  }
  function renderRoster(root) {
    let area = root.querySelector(".roster-area"); if (!area) return;
    area.replaceChildren();
    const filtered = model.students.filter((p) => `${p.displayName} ${p.language || ""}`.toLocaleLowerCase().includes(model.search));
    if (!filtered.length) { area.append(empty(model.search ? "No students match that search." : "This class is empty. Share the invitation code with students so they can join.")); return; }
    const start = model.page * model.pageSize, rows = filtered.slice(start, start + model.pageSize);
    const wrap = el("div", "roster-table-wrap"), table = el("table", "roster-table"), thead = el("thead"), head = el("tr");
    ["Student", "Joined", "Completed games", "Average score", "Last active", "Actions"].forEach((label) => head.append(el("th", "", label)));
    thead.append(head); table.append(thead); const body = el("tbody");
    rows.forEach((student) => {
      const tr = el("tr"), nameCell = el("td"), name = el("button", "student-name", student.displayName); name.type = "button"; name.addEventListener("click", () => showStudent(student.id)); nameCell.append(name);
      const joined = el("td", "", date(student.joinedAt)); const completed = el("td", "", student.completedCount || 0);
      const average = el("td", "", student.averageScore == null ? "—" : `${student.averageScore}%`);
      const active = el("td", "", activeLabel(student.lastActiveAt));
      const actions = el("td"), buttons = el("div", "row-actions");
      buttons.append(listButton("Profile", () => showStudent(student.id), "small-action"));
      buttons.append(listButton("Assign", () => openAssignDialog(student.id), "small-action"));
      buttons.append(listButton("Remove", async () => { if (!window.confirm(`Remove ${student.displayName} from ${model.selectedClass.name}? Recorded history will remain stored.`)) return; try { await QBSupabase.removeTeacherClassStudent(model.selectedClass.id, student.id); model.student = null; await refresh(model.selectedClass.id); } catch (error) { setStatus(error.message, true); } }, "small-action"));
      actions.append(buttons); tr.append(nameCell, joined, completed, average, active, actions); body.append(tr);
    });
    table.append(body); wrap.append(table); area.append(wrap);
    const pages = Math.max(1, Math.ceil(filtered.length / model.pageSize)), pager = el("div", "pagination");
    pager.append(el("span", "", `Showing ${start + 1}–${Math.min(start + rows.length, filtered.length)} of ${filtered.length}`));
    const previous = listButton("Previous", () => { model.page = Math.max(0, model.page - 1); renderRoster(root); }, "small-action"); previous.disabled = model.page === 0;
    const next = listButton("Next", () => { model.page = Math.min(pages - 1, model.page + 1); renderRoster(root); }, "small-action"); next.disabled = model.page >= pages - 1;
    pager.append(previous, next); area.append(pager);
    if (model.studentDetail) renderStudentProfile(area, model.studentDetail);
  }
  async function showStudent(id) {
    const request = ++model.studentRequest;
    model.student = id; const area = $("class-detail").querySelector(".roster-area");
    if (!area) return;
    const prior = area.querySelector(".student-profile"); if (prior) prior.remove();
    const profile = el("section", "student-profile"); profile.append(el("p", "", "Loading learner history…")); area.append(profile);
    try {
      const data = await QBSupabase.getTeacherClassroom(model.selectedClass.id, id);
      if (request !== model.studentRequest || model.student !== id) return;
      model.studentDetail = data.selectedStudent; renderStudentProfile(area, model.studentDetail);
    } catch (error) { if (request === model.studentRequest && model.student === id) profile.replaceChildren(empty(error.message || "Could not load learner profile.")); }
  }
  function renderStudentProfile(area, student) {
    if (!student || !area) return;
    const existing = area.querySelector(".student-profile"); if (existing) existing.remove();
    const profile = el("section", "student-profile");
    const titleRow = el("div", "class-detail-head"), copy = el("div"); copy.append(el("p", "eyebrow", "LEARNER PROFILE"), el("h3", "", student.displayName));
    const classes = (student.classes || []).map((item) => item.name).join(", "); copy.append(el("p", "profile-meta", `${classes || model.selectedClass.name} · Language: ${student.language === "km" ? "Khmer" : student.language === "en" ? "English" : "Not set"}`));
    const assign = listButton("＋ Assign to this student", () => openAssignDialog(student.id), "small-action mint"); titleRow.append(copy, assign); profile.append(titleRow);
    profile.append(el("p", "eyebrow", "ASSIGNED ACTIVITY HISTORY")); const history = el("div", "history-list");
    (student.activity || []).forEach((item) => {
      const row = el("div", "history-row"), label = el("span", "", `${item.activityTitle} · ${item.assignmentTitle} · ${item.className}`);
      const score = item.status === "completed" && item.score != null ? `${item.score}%` : item.status === "in_progress" ? "In progress" : item.status;
      row.append(label, el("small", "", `${score} · ${date(item.completedAt || item.startedAt)}`)); history.append(row);
    });
    if (!history.children.length) history.append(empty("No assigned game history recorded for this learner yet."));
    profile.append(history); area.append(profile);
  }
  function openClassDialog(cls) {
    const form = $("class-form"); form.reset(); $("class-form-message").textContent = "";
    form.dataset.id = cls ? cls.id : ""; $("class-dialog-title").textContent = cls ? "Edit class" : "Create a class";
    form.elements.name.value = cls ? cls.name : ""; form.elements.grade.value = cls ? cls.gradeLevel || "" : "";
    classDialog.showModal(); form.elements.name.focus();
  }
  async function openAssignDialog(studentId, activityId) {
    const form = $("assign-form"); form.reset(); $("assign-form-message").textContent = "";
    form.querySelector("button[type=submit]").textContent = "Review assignment";
    form.dataset.reviewed = "false"; form.dataset.requestKey = crypto.randomUUID();
    form.dataset.publishAttempted = "false";
    const review = $("assignment-review"); review.hidden = true; review.replaceChildren();
    const audience = form.elements.audience; audience.replaceChildren();
    const forClass = new Option(`Everyone in ${model.selectedClass.name}`, "class"); audience.add(forClass);
    audience.add(new Option("Choose students", "students"));
    const students = form.elements.students; students.replaceChildren();
    model.students.forEach((student) => students.add(new Option(student.displayName, student.id)));
    if (studentId) { audience.value = "students"; [...students.options].forEach((option) => { option.selected = option.value === studentId; }); }
    $("student-recipient-label").hidden = audience.value !== "students";
    const now = new Date();
    form.elements.due.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const select = form.elements.activity; select.replaceChildren(new Option("Choose a published activity", ""));
    try {
      if (!model.activities.length) {
        const catalog = await QBSupabase.getGameLibrary();
        model.activities = (catalog.games || []).filter((activity) => activity.engine_type && activity.route === "/game-player.html");
      }
      model.activities.forEach((activity) => select.add(new Option(activity.title, activity.id)));
      if (activityId && model.activities.some((activity) => activity.id === activityId)) select.value = activityId;
      else if (activityId) message($("assign-form-message"), "That activity is unavailable. Choose a published activity from the list.", true);
      if (!model.activities.length) message($("assign-form-message"), "No ready activities are available yet. Publish a question set as a playable game first.", true);
    } catch (error) { message($("assign-form-message"), error.message || "Could not load activities.", true); }
    assignDialog.showModal();
  }
  async function init() {
    if (!QBSupabase.configured) { setStatus("Connect Supabase and apply the class management migrations to load real class data. No sample learners are shown.", true); return; }
    try {
      const session = await QBSupabase.getSession();
      if (!session) { setStatus("Sign in with a teacher account to manage your classes."); return; }
      const profile = await QBSupabase.getProfile(session.user.id);
      if (!profile || profile.role !== "teacher") { setStatus("This area is available to teacher accounts only.", true); return; }
      $("sign-out").hidden = false; $("new-class").hidden = false;
      const params = new URLSearchParams(location.search), requestedClass = params.get("class_id"), requestedActivity = params.get("activity_id");
      await refresh(requestedClass);
      if (requestedClass && model.selected !== requestedClass) { setStatus("That class is unavailable to your teacher account.", true); return; }
      if (requestedActivity) {
        if (!model.selectedClass) { setStatus("Create or select a class before preparing an assignment.", true); return; }
        await openAssignDialog(null, requestedActivity);
      }
    } catch (error) { setStatus(error.message || "We could not load your classes.", true); }
  }

  $("new-class").addEventListener("click", () => openClassDialog(null));
  $("class-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector("button[type=submit]");
    const name = form.elements.name.value.trim(), grade = form.elements.grade.value.trim();
    if (!name || name.length > 100) { message($("class-form-message"), "Enter a class name between 1 and 100 characters.", true); return; }
    button.disabled = true; button.textContent = "Saving…";
    try {
      const result = form.dataset.id ? await QBSupabase.updateTeacherClass(form.dataset.id, name, grade) : await QBSupabase.createTeacherClass(name, grade);
      classDialog.close(); await refresh(result.id || form.dataset.id);
    } catch (error) { message($("class-form-message"), error.message || "Could not save class.", true); }
    finally { button.disabled = false; button.textContent = "Save class"; }
  });
  $("assign-form").elements.audience.addEventListener("change", (event) => { $("student-recipient-label").hidden = event.target.value !== "students"; });
  const resetAssignmentReview = (event) => {
    if (event.target.name === "activity" || event.target.name === "audience" || event.target.name === "students" || event.target.name === "instructions" || event.target.name === "due") {
      if (event.currentTarget.dataset.publishAttempted === "true") {
        event.currentTarget.dataset.requestKey = crypto.randomUUID();
        event.currentTarget.dataset.publishAttempted = "false";
      }
      event.currentTarget.dataset.reviewed = "false"; $("assignment-review").hidden = true;
      const button = event.currentTarget.querySelector("button[type=submit]"); button.textContent = "Review assignment";
    }
  };
  $("assign-form").addEventListener("input", resetAssignmentReview);
  $("assign-form").addEventListener("change", resetAssignmentReview);
  $("assign-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget, button = form.querySelector("button[type=submit]"), msg = $("assign-form-message");
    const activity = model.activities.find((item) => item.id === form.elements.activity.value);
    if (!activity) { message(msg, "Choose a published activity.", true); return; }
    const dueDate = form.elements.due.value;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const pickedDay = dueDate ? new Date(`${dueDate}T00:00:00`) : null;
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(pickedDay.valueOf())
      || pickedDay.getFullYear() !== Number(dueDate.slice(0, 4))
      || pickedDay.getMonth() + 1 !== Number(dueDate.slice(5, 7))
      || pickedDay.getDate() !== Number(dueDate.slice(8, 10)))) {
      message(msg, "Enter a valid due date.", true); return;
    }
    if (pickedDay && pickedDay < today) { message(msg, "Choose today or a later due date.", true); return; }
    const wholeClass = form.elements.audience.value === "class";
    const studentIds = wholeClass ? [] : [...form.elements.students.selectedOptions].map((option) => option.value);
    if (!wholeClass && !studentIds.length) { message(msg, "Select at least one learner, or choose the whole class.", true); return; }
    const names = wholeClass ? [`Everyone in ${model.selectedClass.name}`] : model.students.filter((student) => studentIds.includes(student.id)).map((student) => student.displayName);
    if (form.dataset.reviewed !== "true") {
      const review = $("assignment-review"); review.replaceChildren(el("h3", "", "Review before publishing"));
      review.append(el("p", "", `Activity: ${activity.title}`), el("p", "", `Recipients: ${names.join(", ")}`));
      if (form.elements.instructions.value.trim()) review.append(el("p", "", `Instructions: ${form.elements.instructions.value.trim()}`));
      review.append(el("p", "", dueDate ? `Due: ${new Date(`${dueDate}T00:00:00`).toLocaleDateString()}` : "No due date"));
      review.hidden = false; form.dataset.reviewed = "true"; button.textContent = "Publish assignment";
      button.disabled = true; setTimeout(() => { button.disabled = false; }, 650); return;
    }
    const dueEnd = dueDate ? new Date(`${dueDate}T23:59:59`) : null;
    if (dueEnd && Number.isNaN(dueEnd.valueOf())) { message(msg, "Enter a valid due date.", true); return; }
    const dueAt = dueEnd ? dueEnd.toISOString() : null;
    button.disabled = true; button.textContent = "Assigning…";
    form.dataset.publishAttempted = "true";
    try {
      const result = await QBSupabase.publishTeacherAssignment({ classId: model.selectedClass.id, activityId: activity.id, title: activity.title, instructions: form.elements.instructions.value.trim(), studentIds, wholeClass, dueAt, requestKey: form.dataset.requestKey });
      assignDialog.close(); setStatus(`“${activity.title}” published to ${names.length === 1 ? names[0] : `${names.length} learners`}.`); await selectClass(model.selectedClass.id); setTimeout(() => state.hidden = true, 3500);
    } catch (error) { message(msg, error.message || "Could not create assignment.", true); }
    finally { button.disabled = false; button.textContent = "Publish assignment"; }
  });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => $(button.dataset.close).close()));
  $("sign-out").addEventListener("click", async () => { try { await QBSupabase.signOut(); location.reload(); } catch (error) { setStatus("Sign out failed. Please try again.", true); } });
  init();
})();
