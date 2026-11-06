(function () {
  "use strict";
  const main = document.querySelector("main");
  if (!main) return;

  const css = document.createElement("style");
  css.textContent = `
    body.qb-dashboard-app header, body.qb-dashboard-app nav { display:none !important }
    .qb-live-dashboard { max-width:1120px; margin:0 auto; padding:28px 20px 56px; color:#253247; font-family:inherit }
    .qb-live-dashboard * { box-sizing:border-box }
    .qb-live-dashboard a, .qb-live-dashboard button { min-height:48px }
    .qb-live-hero { display:grid; grid-template-columns:1fr auto; align-items:center; gap:24px; padding:30px; background:#dff3ff; border:2px solid #253247; border-radius:24px; box-shadow:5px 5px 0 #253247 }
    .qb-live-hero h1 { margin:6px 0; font-size:clamp(2rem,5vw,3.5rem); line-height:1.1 }
    .qb-live-mascot { font-size:clamp(4.5rem,11vw,8rem); filter:drop-shadow(3px 4px 0 #253247); animation:qb-float 3s ease-in-out infinite }
    .qb-live-dashboard h2 { margin:32px 0 14px; font-size:1.55rem }
    .qb-live-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:16px }
    .qb-live-card { background:#fff; border:2px solid #253247; border-radius:18px; padding:18px; box-shadow:3px 3px 0 #253247 }
    .qb-live-card h3 { margin:0 0 8px; font-size:1.15rem }
    .qb-live-card p { margin:8px 0; line-height:1.5 }
    .qb-live-pill { display:inline-flex; align-items:center; border-radius:999px; padding:6px 12px; background:#ffd76a; border:1px solid #253247; font-weight:700 }
    .qb-live-link { display:inline-flex; align-items:center; justify-content:center; padding:9px 15px; border:2px solid #253247; border-radius:12px; background:#a8e6cf; color:#253247; text-decoration:none; font-weight:800 }
    .qb-live-state { padding:18px; background:#fff; border:2px dashed #8290a1; border-radius:16px; line-height:1.5 }
    .qb-live-error { background:#fff0ee; border-color:#b64c43 }
    .qb-live-top { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-bottom:22px }
    .qb-live-top p { margin:0 }
    .qb-live-list { display:grid; gap:12px }
    .qb-live-progress { height:12px; margin-top:12px; overflow:hidden; border:1px solid #253247; border-radius:999px; background:#e7edf2 }
    .qb-live-progress span { display:block; height:100%; border-radius:inherit; background:#a8e6cf; transition:width .25s ease }
    @keyframes qb-float { 0%,100% { transform:translateY(0) rotate(-3deg) } 50% { transform:translateY(-8px) rotate(3deg) } }
    @media (max-width:600px) { .qb-live-hero { grid-template-columns:1fr; text-align:center; padding:22px 16px } .qb-live-mascot { grid-row:1 } }
    @media (prefers-reduced-motion:reduce) { .qb-live-mascot { animation:none } }
    @media (prefers-reduced-motion:reduce) { .qb-live-progress span { transition:none } }
  `;
  document.head.append(css);
  document.body.classList.add("qb-dashboard-loading");
  document.body.classList.add("qb-dashboard-app");

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };
  const section = (title) => {
    const wrap = el("section");
    wrap.append(el("h2", "", title));
    return wrap;
  };
  const link = (href, label) => {
    const anchor = el("a", "qb-live-link", label);
    anchor.href = href;
    return anchor;
  };
  const state = (message, error) => el("div", `qb-live-state${error ? " qb-live-error" : ""}`, message);
  const activityHref = (activity, assignmentId) => {
    if (activity?.engine_type && activity.id) {
      const url = new URL("/game-player.html", location.origin);
      url.searchParams.set("activity_id", activity.id);
      if (assignmentId) url.searchParams.set("assignment_id", assignmentId);
      return `${url.pathname}${url.search}`;
    }
    if (typeof activity?.route === "string" && activity.route.startsWith("/") && !activity.route.includes("..")) return activity.route;
    return null;
  };

  function shell() {
    main.replaceChildren();
    main.className = "qb-live-dashboard";
    const top = el("div", "qb-live-top");
    const brand = el("p", "", "QB Interactive Learning Kits");
    const signOut = el("button", "qb-live-link", "Sign out");
    signOut.type = "button";
    signOut.addEventListener("click", async () => {
      signOut.disabled = true;
      try { await QBSupabase.signOut(); location.href = "/16._qb_unified_sign_in_sign_up/code.html"; }
      catch (error) { signOut.disabled = false; showError(error); }
    });
    top.append(brand, signOut);
    main.append(top);
    const navigation = el("nav", "qb-live-grid");
    navigation.setAttribute("aria-label", "Learning areas");
    navigation.style.gridTemplateColumns = "repeat(auto-fit,minmax(120px,1fr))";
    [
      ["Games", "/11._qb_student_game_selection_arena/code.html"],
      ["Phonics", "/literacy.html"],
      ["Books & worksheets", "/reading-library.html"],
      ["My progress", "/15._qb_child_progress_learning_analytics/code.html"],
      ["Rewards", "/qb_student_game_hub_rewards_arena/code.html#rewards"]
    ].forEach(([label, href]) => navigation.append(link(href, label)));
    main.append(navigation);
    const join = el("section", "qb-live-card");
    join.style.marginTop = "20px";
    join.append(el("h2", "", "Join your class"), el("p", "", "Ask your teacher for the class invitation code."));
    const joinForm = el("form");
    joinForm.style.display = "flex"; joinForm.style.flexWrap = "wrap"; joinForm.style.gap = "10px";
    const code = el("input"); code.type = "text"; code.name = "classCode"; code.required = true; code.maxLength = 16;
    code.pattern = "[A-Fa-f0-9]{16}"; code.autocomplete = "off"; code.placeholder = "16-character class code";
    code.setAttribute("aria-label", "Class invitation code");
    code.style.cssText = "min-height:48px;padding:9px 13px;border:2px solid #253247;border-radius:12px;font:inherit;text-transform:uppercase;letter-spacing:.12em;max-width:260px";
    const joinButton = el("button", "qb-live-link", "Join class"); joinButton.type = "submit";
    const joinStatus = el("p", "qb-live-state"); joinStatus.hidden = true; joinStatus.setAttribute("role", "status"); joinStatus.setAttribute("aria-live", "polite");
    joinForm.append(code, joinButton); join.append(joinForm, joinStatus); main.append(join);
    joinForm.addEventListener("submit", async (event) => {
      event.preventDefault(); joinButton.disabled = true; joinButton.textContent = "Joining…";
      try {
        const result = await QBSupabase.joinClassWithCode(code.value.trim().toUpperCase());
        joinStatus.hidden = false; joinStatus.classList.remove("qb-live-error"); joinStatus.textContent = result.alreadyJoined
          ? `You’re already in ${result.className}.`
          : `You joined ${result.className}! Your teacher’s activities will show up below.`;
        if (!result.alreadyJoined) setTimeout(() => location.reload(), 800);
      } catch (error) { joinStatus.hidden = false; joinStatus.textContent = error.message || "We couldn’t join that class. Check the code."; joinStatus.classList.add("qb-live-error"); }
      finally { joinButton.disabled = false; joinButton.textContent = "Join class"; }
    });
    return signOut;
  }

  function showError(error) {
    main.append(state(error && error.message ? error.message : "We couldn’t load your learning space. Please try again.", true));
  }

  function renderActivityCard(activity, assignmentTitle, assignmentId) {
    const card = el("article", "qb-live-card");
    const category = el("span", "qb-live-pill", activity.category || "Activity");
    if (activity.language) category.lang = activity.language;
    const title = el("h3", "", assignmentTitle || activity.title || "Learning activity");
    if (activity.language) title.lang = activity.language;
    card.append(category, title);
    if (activity.title && assignmentTitle) card.append(el("p", "", activity.title));
    const href = activityHref(activity, assignmentId);
    card.append(href ? link(href, "Let’s go →") : state("This activity isn’t ready to open yet. Ask your teacher for help."));
    return card;
  }

  function renderAssignmentCard(assignment) {
    const card = el("article", "qb-live-card"), activity = assignment.activity || {};
    card.append(el("span", "qb-live-pill", assignment.status === "completed" ? "Completed" : assignment.status === "in_progress" ? "In progress" : "Assigned"));
    card.append(el("h3", "", assignment.title || activity.title || "Learning activity"));
    if (activity.title && assignment.title !== activity.title) card.append(el("p", "", activity.title));
    if (assignment.instructions) card.append(el("p", "", assignment.instructions));
    if (assignment.due_at) card.append(el("p", "", `Due ${new Date(assignment.due_at).toLocaleDateString()}`));
    if (assignment.status === "completed" && assignment.score != null) card.append(el("p", "", `Your saved result: ${assignment.score}%`));
    const href = activityHref(activity, assignment.id);
    card.append(href
      ? link(href, assignment.status === "completed" ? "Play again →" : assignment.status === "in_progress" ? "Continue →" : "Start activity →")
      : state("This activity isn’t ready to open yet. Ask your teacher for help."));
    return card;
  }

  function renderRecentActivity(sessions) {
    const recent = section("Recent learning");
    if (!sessions.length) {
      recent.append(state("Your recent activities will appear here after you start learning."));
      return recent;
    }
    const rows = el("div", "qb-live-list");
    sessions.slice(0, 5).forEach((session) => {
      const row = el("article", "qb-live-card");
      const statusText = session.status === "completed" ? "Completed" : session.status === "in_progress" ? "In progress" : "Not finished";
      row.append(el("span", "qb-live-pill", statusText));
      const title = el("h3", "", session.activity?.title || "Learning activity");
      if (session.activity?.language) title.lang = session.activity.language;
      row.append(title);
      if (session.started_at) row.append(el("p", "", `Started ${new Date(session.started_at).toLocaleDateString()}`));
      if (session.status === "completed" && session.score != null) row.append(el("p", "", `Your saved result: ${session.score}%`));
      const href = activityHref(session.activity, session.assignment_id);
      if (href) row.append(link(href, session.status === "in_progress" ? "Continue →" : "Open activity →"));
      rows.append(row);
    });
    recent.append(rows);
    return recent;
  }

  async function render() {
    if (!window.QBSupabase) {
      main.replaceChildren(state("The learning connection didn’t start. Reload this page or ask a grown-up for help.", true));
      const retry = el("button", "qb-live-link", "Reload page"); retry.type = "button"; retry.addEventListener("click", () => location.reload()); main.append(retry);
      main.setAttribute("aria-busy", "false"); document.body.classList.remove("qb-dashboard-loading");
      return;
    }
    if (!QBSupabase.configured) {
      main.replaceChildren(state("Supabase is not configured yet. Set up the project and local browser key using supabase/README.md.", true));
      main.setAttribute("aria-busy", "false"); document.body.classList.remove("qb-dashboard-loading");
      return;
    }
    try {
      const dashboard = await QBSupabase.getChildDashboard();
      if (!dashboard.authenticated) {
        location.replace("/16._qb_unified_sign_in_sign_up/code.html?next=student");
        return;
      }
      if (!dashboard.authorized) {
        main.replaceChildren(state("This learning space is for student accounts. Please use the correct sign-in page for your role.", true));
        return;
      }

      shell();
      const hero = el("section", "qb-live-hero");
      const intro = el("div");
      intro.append(el("span", "qb-live-pill", "Your learning space"));
      intro.append(el("h1", "", `Ready for an adventure, ${dashboard.profile.display_name}?`));
      intro.append(el("p", "", "Choose an activity, explore something new, and celebrate the progress you really make."));
      const mascot = el("div", "qb-live-mascot", "🦁");
      mascot.setAttribute("role", "img"); mascot.setAttribute("aria-label", "Friendly lion mascot");
      hero.append(intro, mascot); main.append(hero);

      const goal = section("Today’s learning goal");
      const goalText = dashboard.dailyGoal
        ? `${dashboard.todayCompleted} of ${dashboard.dailyGoal} completed activities today.`
        : "Your grown-up can set a daily goal. We’ll show progress here when there’s one to follow.";
      goal.append(state(goalText)); main.append(goal);

      const ongoing = dashboard.sessions.find((item) => item.status === "in_progress");
      const continueSection = section("Continue learning");
      const continueActivity = ongoing && ongoing.activity;
      continueSection.append(continueActivity
        ? renderActivityCard(continueActivity, "Pick up where you left off", ongoing.assignment_id)
        : state("No activity is in progress yet. Choose one of your assigned activities to get started."));
      main.append(continueSection);
      main.append(renderRecentActivity(dashboard.sessions));

      const assigned = section("Activities from your teacher");
      assigned.id = "quests";
      const activityCards = dashboard.assignments.map((item) => item.activity && renderAssignmentCard(item)).filter(Boolean);
      if (activityCards.length) {
        const grid = el("div", "qb-live-grid"); grid.append(...activityCards); assigned.append(grid);
      } else assigned.append(state("There are no assigned activities yet. Ask your teacher to add one when you’re ready."));
      main.append(assigned);

      const featured = section("Featured activities");
      const featuredActivities = [...dashboard.activities, ...(dashboard.literacyActivities || [])];
      const featuredCards = featuredActivities.slice(0, 4).map((activity) => renderActivityCard(activity));
      if (featuredCards.length) {
        const grid = el("div", "qb-live-grid"); grid.append(...featuredCards); featured.append(grid);
      } else featured.append(state("New activities will appear here when your teacher adds them."));
      main.append(featured);

      const categories = section("Explore learning");
      const categoriesSeen = new Set([
        ...dashboard.activities.map((item) => item.category),
        ...(dashboard.literacyActivities || []).map((item) => item.category)
      ].filter(Boolean));
      if (categoriesSeen.size) {
        const grid = el("div", "qb-live-grid");
        for (const category of categoriesSeen) {
          const card = el("article", "qb-live-card");
          card.append(el("h3", "", category[0].toUpperCase() + category.slice(1)));
          card.append(el("p", "", "Explore activities in this learning area."));
          grid.append(card);
        }
        categories.append(grid);
      } else categories.append(state("Learning activities will appear here when they’re available."));
      main.append(categories);

      const progress = section("Your progress this week");
      const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
      const completedWeek = dashboard.sessions.filter((item) => {
        if (item.status !== "completed" || !item.completed_at) return false;
        const completedAt = new Date(item.completed_at);
        return completedAt >= weekStart && completedAt <= now;
      }).length;
      progress.append(state(completedWeek ? `${completedWeek} completed ${completedWeek === 1 ? "activity" : "activities"} in the last 7 days.` : "Your weekly progress will appear here after you complete an activity."));
      main.append(progress);

      const achievements = section("Achievements you’ve earned");
      if (dashboard.achievements.length) {
        const grid = el("div", "qb-live-grid");
        for (const row of dashboard.achievements) {
          const card = el("article", "qb-live-card");
          card.append(el("span", "", row.achievement?.icon || "🏅"));
          card.append(el("h3", "", row.achievement?.title || "Achievement"));
          card.append(el("p", "", row.achievement?.description || ""));
          grid.append(card);
        }
        achievements.append(grid);
      } else achievements.append(state("No achievements yet. They’ll show up here when they’re awarded."));
      main.append(achievements);

      const rewards = dashboard.rewards || { stars: 0, points: 0, stickers: 0, history: [] };
      const rewardSection = section("Your rewards");
      rewardSection.id = "rewards";
      rewardSection.append(el("p", "", "Finish activities to earn rewards. Badges and stickers celebrate milestones, and a wrong answer never takes a reward away."));
      const rewardGrid = el("div", "qb-live-grid");
      [
        ["⭐", "Stars", rewards.stars || 0],
        ["●", "Points", rewards.points || 0],
        ["🎟️", "Stickers", rewards.stickers || 0]
      ].forEach(([icon, label, count]) => {
        const card = el("article", "qb-live-card");
        card.append(el("span", "qb-live-pill", icon), el("h3", "", String(count)), el("p", "", label));
        rewardGrid.append(card);
      });
      rewardSection.append(rewardGrid);
      if (rewards.nextMilestone) {
        const next = rewards.nextMilestone, milestone = el("article", "qb-live-card");
        milestone.style.marginTop = "14px";
        milestone.append(el("h3", "", `Next: ${next.title}`), el("p", "", `${next.remaining} more completed ${next.remaining === 1 ? "activity" : "activities"} to reach this milestone.`));
        const bar = el("div", "qb-live-progress"); bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-label", `Progress toward ${next.title}`); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", "100"); bar.setAttribute("aria-valuenow", String(next.progress));
        const fill = el("span"); fill.style.width = `${next.progress}%`; bar.append(fill); milestone.append(bar); rewardSection.append(milestone);
      } else rewardSection.append(state("Keep exploring. New reward milestones will appear here when they’re available."));
      const rewardHistory = section("Reward history");
      if (rewards.history?.length) {
        const rows = el("div", "qb-live-list");
        rewards.history.forEach((item) => {
          const row = el("article", "qb-live-card");
          const value = item.type === "sticker" ? "Sticker unlocked" : `+${item.amount} ${item.type}`;
          row.append(el("span", "qb-live-pill", item.icon || "⭐"), el("h3", "", item.title), el("p", "", `${value} · ${new Date(item.grantedAt).toLocaleDateString()}`));
          rows.append(row);
        });
        rewardHistory.append(rows);
      } else rewardHistory.append(state("Finish an activity to earn your first star and points."));
      rewardSection.append(rewardHistory);
      main.append(rewardSection);

      const requestedSection = window.location.hash.slice(1);
      if (requestedSection === "quests" || requestedSection === "rewards") {
        requestAnimationFrame(() => document.getElementById(requestedSection)?.scrollIntoView({ block: "start" }));
      }
    } catch (error) {
      main.replaceChildren(state(error && error.message ? error.message : "We couldn’t load your learning space. Please try again.", true));
      const retry = el("button", "qb-live-link", "Try again");
      retry.type = "button"; retry.addEventListener("click", render); main.append(retry);
    } finally {
      main.setAttribute("aria-busy", "false");
      document.body.classList.remove("qb-dashboard-loading");
    }
  }

  render();
})();
