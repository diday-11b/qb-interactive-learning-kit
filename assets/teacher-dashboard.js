(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = $("dashboard-state");
  const content = $("dashboard-content");
  const signOut = $("sign-out");

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }
  function empty(container, message) { container.replaceChildren(element("p", "empty-row", message)); }
  function dateLabel(value) {
    if (!value) return "No due date";
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? "Date unavailable" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  function setMetric(id, value) { $(id).textContent = value === null || value === undefined ? "—" : String(value); }
  function makeRow(symbol, title, detail, value) {
    const row = element("div", "list-row");
    row.append(element("span", "row-symbol", symbol));
    const copy = element("span", "row-copy");
    copy.append(element("b", "", title), element("small", "", detail));
    row.append(copy);
    if (value !== undefined) row.append(element("span", "row-value", value));
    return row;
  }
  function showError(message, link) {
    state.classList.add("error");
    state.replaceChildren(document.createTextNode(message + " "));
    if (link) {
      const anchor = element("a", "", link.label);
      anchor.href = link.href;
      state.append(anchor);
    }
  }

  function render(data) {
    state.hidden = true;
    content.hidden = false;
    setMetric("student-count", data.studentCount || 0);
    setMetric("class-count", data.classCount || 0);
    setMetric("assignment-count", data.activeAssignmentCount || 0);
    setMetric("completion-rate", data.completionRate === null ? "—" : data.completionRate + "%");
    $("completion-caption").textContent = data.completionRate === null
      ? "No active assignment activity yet"
      : `${data.completedAssignmentStudents} of ${data.expectedAssignmentStudents} learner assignments completed · ${data.periodDays} days`;
    $("assignment-period").textContent = `Past ${data.periodDays} days`;
    $("published-count").textContent = String(data.publishedActivityCount || 0);
    $("performance-summary").textContent = data.completedSessionCount
      ? `${data.completedSessionCount} completed ${data.completedSessionCount === 1 ? "activity" : "activities"}${data.averageScore === null ? "" : ` · Average score ${data.averageScore}%`}`
      : "No completed activities recorded in this period.";

    const classes = $("classes-list");
    classes.replaceChildren();
    (data.classes || []).forEach((item) => classes.append(makeRow("▦", item.name, item.gradeLevel || "Class", `${item.studentCount} learners`)));
    if (!classes.children.length) empty(classes, "No classes yet. Create a class to start adding learners.");

    const assignments = $("assignments-list");
    assignments.replaceChildren();
    (data.assignments || []).forEach((item) => {
      const done = Number(item.completedCount || 0);
      const total = Number(item.studentCount || 0);
      const progress = total ? Math.min(100, Math.round(done * 100 / total)) : 0;
      const row = makeRow("✎", item.title, `${item.className} · ${item.activityTitle} · Due ${dateLabel(item.dueAt)}`, `${done}/${total}`);
      const bar = element("span", "mini-progress");
      bar.setAttribute("aria-label", `${progress}% complete`);
      const fill = element("i");
      fill.style.width = `${progress}%`;
      bar.append(fill);
      row.insertBefore(bar, row.lastChild);
      assignments.append(row);
    });
    if (!assignments.children.length) empty(assignments, "No active assignments. Pick an activity and assign it to one of your classes.");

    const activity = $("activity-list");
    activity.replaceChildren();
    (data.recentActivity || []).forEach((item) => {
      const row = element("div", "activity-row");
      row.append(element("span", `activity-dot${item.status === "completed" ? "" : " pending"}`, ""));
      const copy = element("span", "activity-copy");
      const status = item.status === "completed" ? "Completed" : item.status === "in_progress" ? "In progress" : "Stopped early";
      const when = item.completedAt || item.startedAt;
      copy.append(element("b", "", `${item.studentName} · ${item.activityTitle}`), element("small", "", `${item.className} · ${status} · ${dateLabel(when)}`));
      row.append(copy);
      if (item.score !== null && item.score !== undefined && item.status === "completed") row.append(element("span", "score-chip", `${item.score}%`));
      activity.append(row);
    });
    if (!activity.children.length) empty(activity, "Student activity will appear here after learners start an assigned or open activity.");

    const practice = $("practice-list");
    practice.replaceChildren();
    (data.studentsNeedingPractice || []).forEach((item) => {
      practice.append(makeRow("♡", item.studentName, `${item.className} · ${item.activityTitle} · ${dateLabel(item.completedAt)}`, `${item.score}%`));
    });
    if (!practice.children.length) empty(practice, "No recent scores below 60% in this period.");
  }

  async function start() {
    if (!window.QBSupabase || !QBSupabase.configured) {
      showError("Connect this project to Supabase to load live teacher data. No sample counts are shown.", { label: "Setup steps", href: "../supabase/README.md" });
      return;
    }
    try {
      const session = await QBSupabase.getSession();
      if (!session) {
        showError("Sign in with your teacher account to view your classes and student activity.", { label: "Teacher sign in", href: "/16._qb_unified_sign_in_sign_up/code.html?next=teacher-tools" });
        return;
      }
      signOut.hidden = false;
      const profileData = session.user ? await QBSupabase.getProfile(session.user.id) : null;
      if (!profileData || profileData.role !== "teacher") {
        showError("This dashboard is for teacher accounts. Sign in with a teacher account to continue.");
        return;
      }
      const result = await QBSupabase.getTeacherDashboard(30);
      if (!result.authenticated) {
        showError("Your session ended. Sign in with your teacher account to continue.", { label: "Teacher sign in", href: "/16._qb_unified_sign_in_sign_up/code.html?next=teacher-tools" });
        return;
      }
      render(result);
    } catch (error) {
      console.error("Teacher dashboard could not load", error);
      const message = error && error.code === "42501"
        ? "Your account does not have teacher access to this dashboard."
        : "We could not load your classroom data. Check the Supabase setup and try again.";
      showError(message, { label: "Try again", href: "code.html" });
    }
  }
  signOut.addEventListener("click", async () => {
    signOut.disabled = true;
    try { await QBSupabase.signOut(); window.location.reload(); }
    catch (error) { signOut.disabled = false; showError("Sign out did not work. Please try again."); }
  });
  start();
})();
