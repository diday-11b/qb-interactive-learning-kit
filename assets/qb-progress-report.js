(() => {
  "use strict";
  const page = location.pathname.includes("14._qb_parent_dashboard_weekly_digest") ? "parent"
    : location.pathname.includes("09._qb_results_progress_analytics") ? "teacher" : "student";
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  const link = (href, label, className = "report-link") => {
    const node = el("a", className, label); node.href = href; return node;
  };
  const state = (text, error = false) => el("div", `report-state${error ? " report-error" : ""}`, text);
  const fmtTime = (seconds) => {
    const totalMinutes = Math.floor((Number(seconds) || 0) / 60);
    if (totalMinutes < 1) return "Under 1 minute";
    const h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
    return h ? `${h} hr${h === 1 ? "" : "s"}${m ? ` ${m} min` : ""}` : `${m} min`;
  };
  const categoryName = (value) => String(value || "other").replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
  const percent = (n) => Number.isFinite(Number(n)) ? `${Math.round(Number(n))}%` : "—";
  const reportTitle = page === "student" ? "Your learning progress" : page === "parent" ? "A week of learning together" : "Student progress report";

  function buildShell() {
    document.body.className = "qb-progress";
    const header = el("header", "report-header"), inner = el("div", "report-header-inner");
    const brand = link("/index.html", "", "report-brand"), mark = el("span", "report-mark", "QB");
    brand.append(mark, el("span", "", "QB Interactive Learning Kits"));
    const nav = el("nav", "report-nav"); nav.setAttribute("aria-label", "Main navigation");
    const destinations = page === "student"
      ? [["My learning", "/qb_student_game_hub_rewards_arena/code.html"], ["My progress", "/15._qb_child_progress_learning_analytics/code.html"], ["Activities", "/07._qb_game_library_arena_selection/code.html"]]
      : page === "teacher"
        ? [["Teacher dashboard", "/04._qb_teacher_dashboard/code.html"], ["Reports", "/09._qb_results_progress_analytics/code.html"], ["Classes", "/17._qb_classroom_student_roster_manager/code.html"]]
        : [["Learning report", "/14._qb_parent_dashboard_weekly_digest/code.html"]];
    destinations.forEach(([label, href]) => {
      const item = link(href, label, "report-nav-link");
      if (href.split("#")[0] === location.pathname) item.setAttribute("aria-current", "page");
      nav.append(item);
    });
    const signOut = el("button", "report-button", "Sign out"); signOut.type = "button"; signOut.hidden = true;
    signOut.addEventListener("click", async () => { signOut.disabled = true; try { await QBSupabase.signOut(); location.href = "/16._qb_unified_sign_in_sign_up/code.html"; } catch (e) { signOut.disabled = false; showMessage(e.message || "Sign out failed.", true); } });
    inner.append(brand, nav, signOut); header.append(inner);
    const main = el("main", "report-wrap"), heading = el("section", "report-heading");
    const intro = el("div"); intro.append(el("p", "report-kicker", page === "parent" ? "A SUPPORTIVE WEEKLY CHECK-IN" : "REAL LEARNING ACTIVITY"), el("h1", "", reportTitle), el("p", "", page === "parent" ? "See what your child explored, celebrate their effort, and find a gentle next step." : "A clear view of saved attempts, answers, and completed rounds."));
    heading.append(intro); main.append(heading);
    const status = el("div", "report-state", "Loading your report…"); status.id = "report-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); main.append(status);
    document.body.replaceChildren(header, main);
    return { main, signOut, status };
  }

  const ui = buildShell();
  function showMessage(text, isError = false) {
    ui.status.hidden = false; ui.status.className = `report-state${isError ? " report-error" : ""}`; ui.status.textContent = text;
  }
  function hideMessage() { ui.status.hidden = true; }

  function controlsFor(students, role) {
    const form = el("form", "report-controls"), controls = {};
    if (role !== "student") {
      const label = el("label", "", role === "parent" ? "Child" : "Student");
      const select = el("select", "report-select"); select.name = "student"; select.required = true; select.setAttribute("aria-label", label.textContent);
      students.forEach((person) => select.add(new Option(person.name, person.id)));
      const queryId = new URLSearchParams(location.search).get("student_id");
      if (queryId && students.some((person) => person.id === queryId)) select.value = queryId;
      label.append(select); form.append(label); controls.student = select;
    }
    const periodLabel = el("label", "", "Report period");
    const period = el("select", "report-select"); period.name = "period"; period.setAttribute("aria-label", "Report period");
    [[7, "Past 7 days"], [30, "Past 30 days"], [90, "Past 90 days"], [365, "Past 12 months"]].forEach(([days, label]) => period.add(new Option(label, String(days))));
    period.value = page === "parent" ? "7" : "30"; periodLabel.append(period); form.append(periodLabel); controls.period = period;
    const submit = el("button", "report-button primary", "Update report"); submit.type = "submit"; form.append(submit);
    return { form, controls };
  }

  function metricsView(metrics) {
    const grid = el("section", "report-grid"); grid.setAttribute("aria-label", "Progress summary");
    const answered = Number(metrics.totalAnswers || 0), accuracy = answered ? Math.round(Number(metrics.correctAnswers || 0) * 100 / answered) : null;
    const timedRounds = Number(metrics.timedCompletedRounds || 0);
    const entries = [
      ["Completed activities", metrics.completedRounds, "Completed game and literacy activities"],
      ["Attempts", metrics.attemptCount, "Includes unfinished and abandoned"],
      ["Correct answers", `${metrics.correctAnswers} / ${metrics.totalAnswers}`, accuracy === null ? "No saved answers yet" : `${accuracy}% answer accuracy`],
      ["Average score", metrics.averageScore == null ? "—" : `${metrics.averageScore}%`, "Completed activities only"],
      ["Time tracked", timedRounds ? fmtTime(metrics.timeSpentSeconds) : "—", timedRounds ? `${timedRounds} completed rounds with recorded time` : "No completed round has recorded time"],
      ["Abandoned", metrics.abandonedAttempts, "Not counted as completed"],
      ["Completion rate", metrics.completionRate == null ? "—" : `${metrics.completionRate}%`, "Completed activities ÷ attempts"]
    ];
    entries.forEach(([label, value, note]) => { const card = el("article", "report-stat"); card.append(el("span", "", label), el("strong", "", value), el("small", "report-small", note)); grid.append(card); });
    return grid;
  }

  function renderCategories(items) {
    const section = el("section", "report-panel"), title = el("h2", "", "Progress by learning area"); section.append(title);
    section.append(el("p", "report-note", "Accuracy uses saved answers across attempts started in the selected period. A bar appears after at least five answers."));
    if (!items.length) { section.append(state("No category activity in this period yet.")); return section; }
    const list = el("div", "report-list");
    items.forEach((item) => {
      const row = el("article", "report-row"), top = el("div", "report-row-top"), left = el("div");
      left.append(el("b", "report-row-title", categoryName(item.category)), el("div", "report-row-meta", `${item.attemptCount} attempts · ${item.completedRounds} completed · ${item.correctAnswers}/${item.totalAnswers} correct`));
      top.append(left, el("span", "report-badge", item.accuracy == null ? "No answers" : percent(item.accuracy))); row.append(top);
      if (item.totalAnswers >= 5 && item.accuracy != null) { const bar = el("div", "report-bar"); bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-label", `${categoryName(item.category)} accuracy`); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", "100"); bar.setAttribute("aria-valuenow", String(item.accuracy)); const fill = el("i"); fill.style.width = `${item.accuracy}%`; bar.append(fill); row.append(bar); }
      list.append(row);
    });
    section.append(list); return section;
  }

  function renderInsights(report) {
    const section = el("section", "report-panel"), title = el("h2", "", "Strengths & practice ideas"); section.append(title);
    section.append(el("p", "report-note", "We only label a topic after at least five saved answers: strengths are 80% or higher; practice ideas are below 60%."));
    const grid = el("div", "report-insights"), strong = el("div", "report-insight"), practice = el("div", "report-insight practice");
    strong.append(el("h3", "", "Strengths"));
    if (report.strengths?.length) report.strengths.forEach((topic) => strong.append(el("p", "", `${categoryName(topic.category)} · ${topic.accuracy}% (${topic.answers} answers)`)));
    else strong.append(el("p", "", "There isn’t enough evidence for a strength label yet."));
    practice.append(el("h3", "", "Topics to practice"));
    if (report.practiceTopics?.length) report.practiceTopics.forEach((topic) => practice.append(el("p", "", `${categoryName(topic.category)} · ${topic.accuracy}% (${topic.answers} answers)`)));
    else practice.append(el("p", "", "No topic meets the practice threshold in this period."));
    grid.append(strong, practice); section.append(grid); return section;
  }

  function renderActivity(items) {
    const section = el("section", "report-panel"), title = el("h2", "", "Scores by activity"); section.append(title);
    if (!items.length) { section.append(state("Scores will appear here after a round is completed.")); return section; }
    const list = el("div", "report-list");
    items.forEach((item) => {
      const row = el("article", "report-row"), top = el("div", "report-row-top"), left = el("div");
      left.append(el("b", "report-row-title", item.title), el("div", "report-row-meta", `${categoryName(item.category)} · ${item.completedRounds}/${item.attemptCount} activities completed · ${item.correctAnswers}/${item.totalAnswers} correct`));
      top.append(left, el("span", "report-badge", item.averageScore == null ? "No score yet" : `${item.averageScore}% avg`)); row.append(top); list.append(row);
    });
    section.append(list); return section;
  }

  function renderHistory(items) {
    const section = el("section", "report-panel wide"), title = el("h2", "", "Recent learning history"); section.append(title);
    section.append(el("p", "report-note", "Shows up to 50 game and literacy attempts started in the selected period. Abandoned and in-progress activities remain attempts, not completions."));
    if (!items.length) { section.append(state("No attempts in this period. Your activity history will appear after you start a game.")); return section; }
    const list = el("div", "report-history");
    items.forEach((item) => {
      const row = el("article", "report-row"), left = el("div");
      left.append(el("b", "report-row-title", item.activityTitle), el("span", "report-badge", categoryName(item.category)));
      const status = item.status === "completed" ? "Completed" : item.status === "abandoned" ? "Abandoned · not completed" : "In progress";
      row.append(left, el("span", `report-badge ${item.status}`, status));
      row.append(el("div", "report-row-meta", `${new Date(item.startedAt).toLocaleString()} · ${item.totalAnswers} answers saved${item.status === "completed" && item.score != null ? ` · Score ${item.score}% (${item.correctAnswers}/${item.totalAnswers})` : ""}${item.durationSeconds != null && item.status === "completed" ? ` · ${fmtTime(item.durationSeconds)}` : ""}`));
      list.append(row);
    });
    section.append(list); return section;
  }

  function renderRecommendations(items) {
    const section = el("section", "report-panel wide"), title = el("h2", "", "Suggested next activities"); section.append(title);
    section.append(el("p", "report-note", "These are recommendations based on your available activities. Suggestions are not completed work."));
    if (!items.length) { section.append(state("No new playable recommendations are available right now.")); return section; }
    const grid = el("div", "report-grid");
    items.forEach((item) => {
      const card = el("article", "report-stat"); card.append(el("span", "", categoryName(item.category)), el("strong", "", item.title), el("small", "report-small", item.reason));
      const url = new URL(item.route || "/game-player.html", location.origin); url.searchParams.set("activity_id", item.activityId);
      if (item.assignmentId) url.searchParams.set("assignment_id", item.assignmentId);
      if (page === "student") card.append(link(`${url.pathname}${url.search}`, "Try this activity"));
      else card.append(el("small", "report-small", "Available when the learner signs in."));
      grid.append(card);
    });
    section.append(grid); return section;
  }

  function renderParentRewards(items) {
    const section = el("section", "report-panel wide"), heading = el("div", "report-row-top");
    heading.append(el("h2", "", "Little wins to celebrate"), el("span", "report-badge", "Earned this week"));
    section.append(heading, el("p", "report-note", "These are rewards recorded for this child during the selected period."));
    if (!items.length) { section.append(state("No new rewards recorded in this period yet. Every learning try still counts.")); return section; }
    const list = el("div", "report-list");
    items.forEach((item) => {
      const row = el("article", "report-row"), reward = item.achievement || {};
      const stamp = new Date(item.earned_at);
      row.append(el("b", "report-row-title", `${reward.icon || "★"} ${reward.title || "Learning reward"}`),
        el("div", "report-row-meta", `${reward.description || "A reward earned through learning."} · ${stamp.toLocaleDateString()}`));
      list.append(row);
    });
    section.append(list); return section;
  }

  function renderReport(report) {
    hideMessage();
    const previous = document.querySelector(".report-content"); if (previous) previous.remove();
    const content = el("div", "report-content"), info = el("p", "report-note", page === "parent"
      ? `A gentle snapshot for ${report.student.name} · Activity is grouped by when each round began (${new Date(report.period.from).toLocaleDateString()}–${new Date(report.period.to).toLocaleDateString()}).`
      : `Report for ${report.student.name} · Attempts are grouped by when the round started (${new Date(report.period.from).toLocaleDateString()}–${new Date(report.period.to).toLocaleDateString()}).`);
    content.append(info, metricsView(report.metrics));
    const columns = el("div", "report-columns"); columns.append(renderCategories(report.categories), renderActivity(report.activities), renderInsights(report));
    content.append(columns, renderHistory(report.history));
    if (page === "parent") content.append(renderParentRewards(report.parentRewards || []));
    content.append(renderRecommendations(report.recommendations));
    const note = el("p", "report-footnote", "How to read this report: each game session is one attempt. Only sessions the game engine marks completed count as completed rounds. Saved answers from unfinished or abandoned attempts are included in answer accuracy. Scores and time use completed sessions only; time is shown only when the game engine recorded it. Recommendations are separate from completed work.");
    content.append(note); ui.main.append(content);
  }

  function errorState(message, linkLabel) {
    showMessage(message, true);
    if (linkLabel) ui.status.append(document.createTextNode(" "), link("/supabase/README.md", linkLabel));
  }

  async function init() {
    if (!window.QBSupabase?.configured) { errorState("Supabase is not configured. Connect the project to view private learning reports. No example scores are displayed.", "Supabase setup guide"); return; }
    try {
      const session = await QBSupabase.getSession();
  if (!session) { location.replace("/16._qb_unified_sign_in_sign_up/code.html?next=progress"); return; }
      const profile = await QBSupabase.getProfile(session.user.id);
      if (!profile || !["student", "teacher", "parent"].includes(profile.role) || (page === "student" && profile.role !== "student") || (page === "teacher" && profile.role !== "teacher") || (page === "parent" && profile.role !== "parent")) {
        errorState("This report page is for the matching student, parent, or teacher account. Please sign in with the right role."); return;
      }
      ui.signOut.hidden = false;
      const students = await QBSupabase.getProgressReportStudents();
      if (!students.length) { showMessage(profile.role === "parent" ? "No linked student profiles are available yet." : "No student accounts are available in your classes yet."); return; }
      const { form, controls } = controlsFor(students, profile.role);
      ui.main.append(form);
      let reportRequest = 0;
      const refresh = async () => {
        const request = ++reportRequest;
        const days = Number(controls.period.value), end = new Date(), start = new Date(end.getTime() - days * 86400000);
        ui.status.hidden = false; ui.status.className = "report-state"; ui.status.textContent = "Loading recorded attempts…";
        const studentId = controls.student?.value || null;
        try {
          const report = await QBSupabase.getProgressReport(studentId, start.toISOString(), end.toISOString());
          if (request !== reportRequest) return;
          if (page === "parent") report.parentRewards = await QBSupabase.getParentAchievements(studentId, start.toISOString(), end.toISOString());
          if (request === reportRequest) renderReport(report);
        } catch (error) {
          if (request === reportRequest) showMessage(error.message || "Could not update the report.", true);
        }
      };
      form.addEventListener("submit", async (event) => { event.preventDefault(); await refresh(); });
      controls.student?.addEventListener("change", async () => { await refresh(); });
      await refresh();
    } catch (error) { showMessage(error.message || "Could not load the report.", true); }
  }
  init();
})();
