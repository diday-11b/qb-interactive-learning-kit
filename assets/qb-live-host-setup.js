(function () {
  "use strict";

  const main = document.querySelector("main");
  if (!main) return;
  const dashboard = "/04._qb_teacher_dashboard/code.html";
  const classesUrl = "/17._qb_classroom_student_roster_manager/code.html";
  const loginUrl = "/16._qb_unified_sign_in_sign_up/code.html?next=host-setup";
  const pageHeader = document.querySelector("body > header");
  const oldFooter = document.querySelector("body > footer");
  oldFooter?.remove();
  document.body.classList.remove("pb-32");
  if (pageHeader) {
    pageHeader.innerHTML = `<div class="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-wrap items-center justify-between gap-3"><a href="${dashboard}" class="rounded-xl border-2 border-on-surface bg-white px-4 py-2 font-bold shadow-[2px_2px_0_0_#151c28]">← Teacher dashboard</a><div class="text-right"><strong class="block">QB Interactive Learning Kits</strong><span class="text-sm text-on-surface-variant">Live class game</span></div></div>`;
  }

  main.innerHTML = `
    <section class="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 flex flex-col gap-6">
      <header class="bg-surface-container-low border-2 border-on-surface rounded-3xl p-6 md:p-8 shadow-[4px_4px_0_0_#151c28]">
        <p class="text-label-md font-bold text-primary">TEACHER CLASSROOM</p>
        <h1 class="text-headline-lg font-extrabold mt-2">Set up a live class game</h1>
        <p class="text-body-md text-on-surface-variant mt-3 max-w-3xl">Choose a class and published game. Review the whole-class assignment before publishing it and opening a room for your students.</p>
      </header>
      <section id="setup-card" class="bg-surface-container-lowest border-2 border-on-surface rounded-3xl p-6 md:p-8 shadow-[4px_4px_0_0_#151c28]">
        <form id="host-setup-form" class="grid gap-5">
          <div class="grid md:grid-cols-2 gap-5">
            <label class="grid gap-2 text-label-md font-bold" for="host-class">Your class
              <select id="host-class" required class="w-full rounded-xl border-2 border-on-surface p-3 bg-white" disabled><option value="">Loading your classes…</option></select>
            </label>
            <label class="grid gap-2 text-label-md font-bold" for="host-activity">Published game
              <select id="host-activity" required class="w-full rounded-xl border-2 border-on-surface p-3 bg-white" disabled><option value="">Loading published games…</option></select>
            </label>
          </div>
          <p id="host-class-summary" class="text-body-sm text-on-surface-variant" aria-live="polite"></p>
          <section id="host-review" class="rounded-2xl border-2 border-on-surface bg-surface-container-low p-4" hidden>
            <h2 class="text-title-md font-extrabold">Review this live assignment</h2>
            <div id="host-review-details" class="text-body-sm mt-2"></div>
            <p class="text-body-sm mt-2">This publishes one whole-class assignment. Students can enter the room code below after it is created.</p>
          </section>
          <button id="host-continue" class="rounded-2xl border-2 border-on-surface bg-primary-container px-6 py-4 font-extrabold shadow-[3px_3px_0_0_#151c28] disabled:opacity-50 disabled:cursor-not-allowed" type="submit" disabled>Review class game</button>
        </form>
        <div id="host-message" class="mt-4 rounded-xl bg-surface-container-low p-4" role="status" aria-live="polite"></div>
      </section>
      <section id="live-lobby" class="bg-surface-container-lowest border-2 border-on-surface rounded-3xl p-6 md:p-8 shadow-[4px_4px_0_0_#151c28]" hidden>
        <p class="text-label-md font-bold text-primary">STUDENT LOBBY</p>
        <h2 id="lobby-title" class="text-headline-md font-extrabold mt-2"></h2>
        <p id="lobby-class" class="text-body-sm text-on-surface-variant mt-1"></p>
        <div class="mt-5 rounded-2xl bg-secondary-container border-2 border-on-surface p-5">
          <p class="text-label-md font-bold">Give students this room code</p>
          <code id="lobby-code" class="block text-2xl md:text-3xl font-extrabold tracking-[.16em] mt-2 break-all"></code>
          <p class="text-body-sm mt-2">Students enter it on the student welcome page, then wait here until you start.</p>
        </div>
        <p id="lobby-state" class="text-title-md font-extrabold mt-5" role="status" aria-live="polite"></p>
        <ul id="lobby-participants" class="grid sm:grid-cols-2 gap-2 mt-3" aria-label="Students who joined"></ul>
        <div class="flex flex-wrap gap-3 mt-5">
          <button id="start-live-room" class="rounded-2xl border-2 border-on-surface bg-tertiary-container px-6 py-3 font-extrabold disabled:opacity-50" type="button">Start live game</button>
          <button id="finish-live-room" class="rounded-2xl border-2 border-on-surface bg-surface-container-low px-6 py-3 font-extrabold" type="button">Close room</button>
        </div>
        <p id="lobby-message" class="mt-4 text-body-sm" role="status" aria-live="polite"></p>
      </section>
      <a class="w-fit underline font-bold" href="${classesUrl}">Manage classes and assignments</a>
    </section>`;

  const classSelect = document.getElementById("host-class");
  const activitySelect = document.getElementById("host-activity");
  const summary = document.getElementById("host-class-summary");
  const form = document.getElementById("host-setup-form");
  const continueButton = document.getElementById("host-continue");
  const review = document.getElementById("host-review");
  const reviewDetails = document.getElementById("host-review-details");
  const messageBox = document.getElementById("host-message");
  const setupCard = document.getElementById("setup-card");
  const lobby = document.getElementById("live-lobby");
  const lobbyMessage = document.getElementById("lobby-message");
  const requested = new URLSearchParams(location.search);
  let room = null;
  let pollTimer = 0;
  let roomOperation = false;

  function showMessage(text, isError) {
    messageBox.textContent = text;
    messageBox.className = `mt-4 rounded-xl p-4 ${isError ? "bg-error-container text-on-error-container" : "bg-surface-container-low text-on-surface-variant"}`;
  }

  function selectedClass() { return classSelect.selectedOptions[0]; }
  function updateContinue() {
    const selected = selectedClass();
    const count = Number(selected?.dataset.count || 0);
    continueButton.disabled = !(classSelect.value && activitySelect.value && count > 0);
    summary.textContent = selected?.value
      ? `${count} enrolled ${count === 1 ? "learner" : "learners"} in this class.`
      : "Select a class to see its enrolled learner count.";
  }

  function resetReview() {
    review.hidden = true;
    form.dataset.reviewed = "false";
    form.dataset.requestKey = crypto.randomUUID();
    continueButton.textContent = "Review class game";
  }

  function syncLobby(state) {
    const current = state || room;
    document.getElementById("lobby-title").textContent = current.activityTitle || "Live game";
    document.getElementById("lobby-class").textContent = current.className || "Your class";
    document.getElementById("lobby-code").textContent = current.joinCode || "";
    const count = Number(current.participantCount || 0);
    const stateText = current.status === "waiting"
      ? `Waiting for students · ${count} joined`
      : current.status === "active" ? `Game started · ${count} joined` : "Room closed";
    document.getElementById("lobby-state").textContent = stateText;
    const list = document.getElementById("lobby-participants");
    list.replaceChildren();
    (current.participants || []).forEach((participant) => {
      const item = document.createElement("li");
      item.className = "rounded-xl border-2 border-on-surface bg-surface-container-low p-3 font-bold";
      item.textContent = participant.displayName || "Student";
      list.append(item);
    });
    if (!count) {
      const item = document.createElement("li");
      item.className = "text-body-sm text-on-surface-variant";
      item.textContent = "No students have joined yet.";
      list.append(item);
    }
    document.getElementById("start-live-room").disabled = current.status !== "waiting" || count < 1;
    document.getElementById("finish-live-room").disabled = current.status === "finished";
    if (current.status === "finished") window.clearInterval(pollTimer);
  }

  async function refreshLobby() {
    if (!room || roomOperation) return;
    try {
      const state = await QBSupabase.getLiveGameRoomState(room.roomId);
      syncLobby({ ...room, ...state });
    } catch (error) {
      lobbyMessage.textContent = error?.message || "Room status could not be refreshed.";
      lobbyMessage.className = "mt-4 text-body-sm text-error";
    }
  }

  function showLobby(createdRoom) {
    room = createdRoom;
    setupCard.hidden = true;
    lobby.hidden = false;
    syncLobby({ ...createdRoom, participantCount: 0, participants: [] });
    lobbyMessage.textContent = "Room created. Share the code with students in this class.";
    lobbyMessage.className = "mt-4 text-body-sm text-tertiary";
    window.clearInterval(pollTimer);
    if (createdRoom.status !== "finished") pollTimer = window.setInterval(refreshLobby, 3000);
  }

  async function load() {
    if (!window.QBSupabase?.configured) {
      showMessage("Connect Supabase and apply the project migrations to load real classes and games. No sample roster or game data is shown.", true);
      classSelect.replaceChildren(new Option("Backend not configured", ""));
      activitySelect.replaceChildren(new Option("Backend not configured", ""));
      return;
    }
    try {
      const session = await QBSupabase.getSession();
      if (!session) { location.assign(loginUrl); return; }
      const profile = await QBSupabase.getProfile(session.user.id);
      if (profile?.role !== "teacher") {
        showMessage("This setup is available to teacher accounts. Sign in with an authorized teacher account.", true);
        return;
      }
      const [classData, gameData] = await Promise.all([
        QBSupabase.getTeacherClassroom(),
        QBSupabase.getGameLibrary()
      ]);
      const classes = classData.classes || [];
      const games = (gameData.games || []).filter((game) => game.engine_type && game.route === "/game-player.html");
      classSelect.replaceChildren(new Option(classes.length ? "Choose a class" : "No classes yet", ""));
      classes.forEach((item) => {
        const option = new Option(item.name, item.id);
        option.dataset.count = String(item.studentCount || 0);
        classSelect.add(option);
      });
      activitySelect.replaceChildren(new Option(games.length ? "Choose a published game" : "No published games yet", ""));
      games.forEach((game) => activitySelect.add(new Option(game.title, game.id)));
      classSelect.disabled = !classes.length;
      activitySelect.disabled = !games.length;
      if (requested.has("class_id")) classSelect.value = requested.get("class_id");
      if (requested.has("activity_id")) activitySelect.value = requested.get("activity_id");
      updateContinue();
      if (!classes.length) showMessage("You don’t have a class yet. Create one, then return here to prepare an activity.", false);
      else if (!games.length) showMessage("No published playable games are available. Publish a question set as a game before assigning it.", false);
      else showMessage("Choose a class and published game. This will be assigned to the whole class.", false);
    } catch (error) {
      showMessage(error?.message || "We couldn’t load your authorized classes and games.", true);
    }
  }

  classSelect.addEventListener("change", () => { resetReview(); updateContinue(); });
  activitySelect.addEventListener("change", () => { resetReview(); updateContinue(); });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const selected = selectedClass();
    const activity = activitySelect.selectedOptions[0];
    if (!classSelect.value || !activitySelect.value || Number(selected?.dataset.count || 0) < 1) return;
    if (form.dataset.reviewed !== "true") {
      reviewDetails.textContent = `${activity.textContent} · ${selected.textContent} · ${selected.dataset.count} enrolled learners`;
      review.hidden = false;
      form.dataset.reviewed = "true";
      continueButton.textContent = "Publish assignment and create room";
      return;
    }
    const classId = classSelect.value;
    const activityId = activitySelect.value;
    continueButton.disabled = true;
    continueButton.textContent = "Publishing assignment…";
    try {
      const published = await QBSupabase.publishTeacherAssignment({
        classId,
        activityId,
        title: activity.textContent,
        instructions: "Join your teacher’s live room with the code shown on the class setup page.",
        studentIds: [],
        wholeClass: true,
        dueAt: null,
        requestKey: form.dataset.requestKey || (form.dataset.requestKey = crypto.randomUUID())
      });
      const assignment = published.assignments?.[0];
      if (!assignment?.id) throw new Error("The assignment was saved, but its room could not be prepared. You can retry safely.");
      continueButton.textContent = "Creating live room…";
      const createdRoom = await QBSupabase.createLiveGameRoom(assignment.id);
      const className = selected.textContent;
      showLobby({ ...createdRoom, className, activityTitle: activity.textContent });
    } catch (error) {
      showMessage(error?.message || "We couldn’t publish the class game. Check the assignment and try again.", true);
      continueButton.disabled = false;
      continueButton.textContent = "Retry assignment and room setup";
    }
  });

  document.getElementById("start-live-room").addEventListener("click", async () => {
    if (!room || roomOperation) return;
    roomOperation = true;
    const button = document.getElementById("start-live-room");
    button.disabled = true;
    button.textContent = "Starting…";
    try {
      await QBSupabase.startLiveGameRoom(room.roomId);
      await refreshLobby();
      lobbyMessage.textContent = "The game has started. Joined students are opening the activity.";
      lobbyMessage.className = "mt-4 text-body-sm text-tertiary";
    } catch (error) {
      lobbyMessage.textContent = error?.message || "The room could not be started.";
      lobbyMessage.className = "mt-4 text-body-sm text-error";
    } finally {
      roomOperation = false;
      button.textContent = "Start live game";
      await refreshLobby();
    }
  });

  document.getElementById("finish-live-room").addEventListener("click", async () => {
    if (!room || roomOperation) return;
    roomOperation = true;
    const button = document.getElementById("finish-live-room");
    button.disabled = true;
    button.textContent = "Closing…";
    try {
      await QBSupabase.finishLiveGameRoom(room.roomId);
      await refreshLobby();
      lobbyMessage.textContent = "The room is closed. Students who haven’t launched yet can no longer join.";
      lobbyMessage.className = "mt-4 text-body-sm text-tertiary";
    } catch (error) {
      lobbyMessage.textContent = error?.message || "The room could not be closed.";
      lobbyMessage.className = "mt-4 text-body-sm text-error";
    } finally {
      roomOperation = false;
      button.textContent = "Close room";
      await refreshLobby();
    }
  });

  document.getElementById("start-game-btn")?.remove();
  load();
})();
