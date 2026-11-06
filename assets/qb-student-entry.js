(function () {
  "use strict";

  const page = document.querySelector("main");
  const pinPanel = document.querySelector("#pin-0")?.closest(".lg\\:col-span-7");
  const profilePanel = Array.from(document.querySelectorAll("main [class]")).find((node) => node.classList.contains("lg:col-span-5"));
  if (!page || !pinPanel || !profilePanel) return;

  const loginUrl = "/16._qb_unified_sign_in_sign_up/code.html?next=join-class";
  const roomLoginUrl = "/16._qb_unified_sign_in_sign_up/code.html?next=join-room";
  const dashboardUrl = "/qb_student_game_hub_rewards_arena/code.html";
  const joinCodeKey = "qb.pending-class-join-code";
  const roomCodeKey = "qb.pending-live-room-code";
  const savedCode = sessionStorage.getItem(joinCodeKey) || "";
  const savedRoomCode = sessionStorage.getItem(roomCodeKey) || "";

  const status = document.createElement("p");
  status.className = "text-body-sm font-body-sm mt-3";
  status.hidden = true;
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  pinPanel.innerHTML = `
    <div class="flex justify-between items-center border-b-2 border-surface-variant pb-4">
      <div>
        <span class="px-2.5 py-1 rounded-full text-label-sm bg-primary-fixed border-2 border-on-surface uppercase">Class invitation</span>
        <h2 class="text-headline-md text-on-surface font-extrabold mt-2">Join your class</h2>
      </div>
      <span class="text-label-sm text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-xl border-2 border-on-surface">16-character code</span>
    </div>
    <p class="text-body-md text-on-surface-variant">Ask your teacher for the class code. Sign in with your student account to join and see assigned activities.</p>
    <form id="class-join-form" class="flex flex-col gap-3" novalidate>
      <label class="text-label-md font-bold" for="class-invitation-code">Class code</label>
      <input id="class-invitation-code" name="code" type="text" required maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Example: 7F3A91C0B4D28E65" class="w-full sm:max-w-md bg-surface-container-lowest border-2 border-on-surface rounded-2xl py-3.5 px-4 text-title-md font-bold uppercase tracking-[.15em] shadow-[3px_3px_0_0_#151c28] focus:outline-none focus:ring-4 focus:ring-secondary-container">
        <p class="text-label-sm text-on-surface-variant">Use all 16 characters from your teacher. The code uses A–F and 0–9.</p>
      <button id="join-class-submit" class="w-full sm:max-w-md py-4 px-6 rounded-2xl bg-primary-container text-on-surface border-2 border-on-surface font-extrabold shadow-[4px_4px_0_0_#151c28] hover:brightness-105 flex items-center justify-center gap-3" type="submit">Join class</button>
    </form>`;
  pinPanel.append(status);

  profilePanel.innerHTML = `
    <section class="bg-surface-container-lowest border-2 border-on-surface rounded-3xl p-6 md:p-7 shadow-[6px_6px_0_0_#151c28] flex flex-col gap-4">
      <span class="px-2.5 py-1 rounded-full text-label-sm bg-secondary-fixed border-2 border-on-surface uppercase w-fit">Student account</span>
      <h2 class="text-headline-sm font-extrabold">Your learning space</h2>
      <p class="text-body-sm text-on-surface-variant">Class codes connect to a student account so your activities and progress stay private and saved.</p>
      <a class="text-center py-3 px-5 rounded-2xl bg-secondary-container border-2 border-on-surface font-extrabold" href="${loginUrl}">Sign in as a student</a>
      <a class="text-center py-3 px-5 rounded-2xl bg-surface-container-low border-2 border-on-surface font-extrabold" href="${dashboardUrl}">Open student learning space</a>
    </section>`;
  profilePanel.insertAdjacentHTML("beforeend", `
    <section class="bg-surface-container-lowest border-2 border-on-surface rounded-3xl p-6 shadow-[4px_4px_0_0_#151c28]">
      <h2 class="text-title-md font-extrabold">Join a live game</h2>
      <p class="text-body-sm text-on-surface-variant mt-2">Ask your teacher for the 16-character room code.</p>
      <form id="live-room-form" class="mt-4 grid gap-3" novalidate>
        <label class="text-label-md font-bold" for="live-room-code">Live room code</label>
        <input id="live-room-code" type="text" required maxlength="16" minlength="16" pattern="[A-Fa-f0-9]{16}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="16-character code" class="w-full bg-surface-container-lowest border-2 border-on-surface rounded-xl py-3 px-4 uppercase tracking-[.15em] focus:outline-none focus:ring-4 focus:ring-secondary-container">
        <button id="live-room-submit" type="submit" class="w-full py-3 px-5 rounded-2xl bg-secondary-container border-2 border-on-surface font-extrabold">Join live game</button>
        <p id="live-room-status" class="text-body-sm" role="status" aria-live="polite" hidden></p>
      </form>
    </section>`);

  const codeInput = document.getElementById("class-invitation-code");
  const submit = document.getElementById("join-class-submit");
  const roomForm = document.getElementById("live-room-form");
  const roomInput = document.getElementById("live-room-code");
  const roomSubmit = document.getElementById("live-room-submit");
  const roomStatus = document.getElementById("live-room-status");
  let roomPoll = 0;
  let roomLaunching = false;
  let roomPollingStopped = false;
  codeInput.value = savedCode;
  roomInput.value = savedRoomCode;
  codeInput.addEventListener("input", () => {
    codeInput.value = codeInput.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 16);
  });
  roomInput.addEventListener("input", () => {
    roomInput.value = roomInput.value.toUpperCase().replace(/[^A-F0-9]/g, "").slice(0, 16);
  });

  function showStatus(message, isError) {
    status.hidden = false;
    status.textContent = message;
    status.className = `text-body-sm font-body-sm mt-3 ${isError ? "text-error" : "text-tertiary"}`;
  }

  async function joinClass(code) {
    if (!window.QBSupabase?.configured) throw new Error("Class joining is unavailable until this app is connected to its Supabase project.");
    const session = await QBSupabase.getSession();
    if (!session) {
      sessionStorage.removeItem(roomCodeKey);
      sessionStorage.setItem(joinCodeKey, code);
      location.assign(loginUrl);
      return;
    }
    const profile = await QBSupabase.getProfile(session.user.id);
    if (profile?.role !== "student") {
      sessionStorage.removeItem(joinCodeKey);
      throw new Error("Sign in with your student account to join a class.");
    }
    const result = await QBSupabase.joinClassWithCode(code);
    sessionStorage.removeItem(joinCodeKey);
    showStatus(result.alreadyJoined ? `You’re already in ${result.className}.` : `You joined ${result.className}! Opening your learning space…`, false);
    if (!result.alreadyJoined) window.setTimeout(() => location.assign(dashboardUrl), 700);
    else window.setTimeout(() => location.assign(dashboardUrl), 700);
  }

  function showRoomStatus(text, isError) {
    roomStatus.hidden = false;
    roomStatus.textContent = text;
    roomStatus.className = `text-body-sm mt-2 ${isError ? "text-error" : "text-tertiary"}`;
  }

  async function pollLiveRoom(room) {
    if (roomLaunching || roomPollingStopped) return;
    try {
      const state = await QBSupabase.getLiveGameRoomState(room.roomId);
      if (state.status === "active") {
        roomLaunching = true;
        window.clearInterval(roomPoll);
        showRoomStatus("Your teacher started the game. Opening it now…", false);
        const target = new URL("/game-player.html", location.origin);
        target.searchParams.set("activity_id", room.activityId);
        target.searchParams.set("assignment_id", room.assignmentId);
        location.assign(target.href);
      } else if (state.status === "finished") {
        roomPollingStopped = true;
        window.clearInterval(roomPoll);
        showRoomStatus("Your teacher closed this room. Ask for a new live game code.", true);
        roomSubmit.disabled = false;
        roomSubmit.textContent = "Join live game";
      } else {
        showRoomStatus(`You’re in ${state.className || room.className}. Waiting for your teacher to start ${state.activityTitle || room.activityTitle}… (${state.participantCount} joined)`, false);
      }
    } catch (error) {
      roomPollingStopped = true;
      window.clearInterval(roomPoll);
      showRoomStatus(error?.message || "We couldn’t check the live room. Try joining again.", true);
      roomSubmit.disabled = false;
      roomSubmit.textContent = "Join live game";
    }
  }

  roomForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const roomCode = roomInput.value.trim().toUpperCase();
    if (!/^[A-F0-9]{16}$/.test(roomCode)) {
      showRoomStatus("Enter all 16 characters from your teacher’s live room code.", true);
      roomInput.focus();
      return;
    }
    roomSubmit.disabled = true;
    roomSubmit.textContent = "Joining…";
    try {
      if (!window.QBSupabase?.configured) throw new Error("Live rooms are unavailable until this app is connected to its Supabase project.");
      const session = await QBSupabase.getSession();
      if (!session) {
        sessionStorage.removeItem(joinCodeKey);
        sessionStorage.setItem(roomCodeKey, roomCode);
        location.assign(roomLoginUrl);
        return;
      }
      const profile = await QBSupabase.getProfile(session.user.id);
      if (profile?.role !== "student") {
        sessionStorage.removeItem(roomCodeKey);
        throw new Error("Sign in with your student account to join a live game.");
      }
      const room = await QBSupabase.joinLiveGameRoom(roomCode);
      sessionStorage.removeItem(roomCodeKey);
      showRoomStatus(`You joined ${room.className}. Checking for your teacher’s start signal…`, false);
      await pollLiveRoom(room);
      if (!roomLaunching && !roomPollingStopped) roomPoll = window.setInterval(() => pollLiveRoom(room), 3000);
    } catch (error) {
      showRoomStatus(error?.message || "We couldn’t join that live game. Check the code and try again.", true);
      roomSubmit.disabled = false;
      roomSubmit.textContent = "Join live game";
    }
  });

  document.getElementById("class-join-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const code = codeInput.value.trim().toUpperCase();
    if (!/^[A-F0-9]{16}$/.test(code)) {
      showStatus("Enter all 16 characters from your teacher’s class code.", true);
      codeInput.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = "Checking your class…";
    try { await joinClass(code); }
    catch (error) { showStatus(error?.message || "We couldn’t join that class. Check the code and try again.", true); }
    finally { submit.disabled = false; submit.textContent = "Join class"; }
  });

  const headerStatus = document.querySelector("header .animate-ping")?.parentElement;
  if (headerStatus) headerStatus.textContent = "Student learning space";
  document.getElementById("sfx-toggle-btn")?.remove();
  const teacherLink = document.querySelector('header a[href="#teacher-login"]');
  if (teacherLink) teacherLink.href = "/16._qb_unified_sign_in_sign_up/code.html";

  const heroCopy = Array.from(document.querySelectorAll("main p")).find((node) => node.textContent.includes("Room ready for 3rd Grade Galaxy Quest"));
  if (heroCopy) heroCopy.replaceChildren(document.createTextNode("Join your teacher’s class and find your assigned activities."));
  const heroPrompt = Array.from(document.querySelectorAll("main p")).find((node) => node.textContent.includes("Enter your 6-digit Game PIN"));
  if (heroPrompt) heroPrompt.textContent = "Have a class invitation code? Join your teacher’s learning space.";
  Array.from(document.querySelectorAll("main button")).forEach((button) => {
    const label = button.textContent.trim();
    if (label.includes("Join Live Game") || label.includes("Join a class")) {
      const anchor = document.createElement("a");
      anchor.href = "#class-join-form";
      anchor.className = button.className;
      anchor.textContent = "Join a class";
      button.replaceWith(anchor);
    } else if (label.includes("Solo Locker")) {
      const anchor = document.createElement("a");
      anchor.href = dashboardUrl;
      anchor.className = button.className;
      anchor.textContent = "My learning space";
      button.replaceWith(anchor);
    }
  });

  const audioHelp = Array.from(document.querySelectorAll("main p")).find((node) => node.textContent.includes("Read Instructions Out Loud?"));
  audioHelp?.closest(".bg-surface-container")?.remove();

  const soloSection = Array.from(document.querySelectorAll("main section")).find((node) => node.querySelector("h3")?.textContent.includes("No PIN? Practice Solo"));
  if (soloSection) {
    soloSection.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div class="flex items-center gap-2"><span class="material-symbols-outlined text-primary text-2xl">explore</span><h3 class="text-headline-sm font-extrabold">Explore learning activities</h3></div>
        <span class="text-label-sm font-bold text-on-surface-variant bg-surface-container-high px-3 py-1 rounded-full border border-on-surface">Sign in to save progress</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        <a class="bg-surface-container-lowest border-2 border-on-surface rounded-2xl shadow-[4px_4px_0_0_#151c28] p-5 flex flex-col gap-2 hover:-translate-y-1" href="/11._qb_student_game_selection_arena/code.html"><strong>Games</strong><span>Browse activities available to your account.</span></a>
        <a class="bg-surface-container-lowest border-2 border-on-surface rounded-2xl shadow-[4px_4px_0_0_#151c28] p-5 flex flex-col gap-2 hover:-translate-y-1" href="/literacy.html"><strong>Phonics &amp; literacy</strong><span>Explore published Khmer and English practice.</span></a>
        <a class="bg-surface-container-lowest border-2 border-on-surface rounded-2xl shadow-[4px_4px_0_0_#151c28] p-5 flex flex-col gap-2 hover:-translate-y-1" href="/reading-library.html"><strong>Books &amp; worksheets</strong><span>Browse reading content available to your account.</span></a>
      </div>`;
  }

  const footerClaim = Array.from(document.querySelectorAll("footer span")).find((node) => node.textContent.includes("100% Kid Safe"));
  if (footerClaim) footerClaim.textContent = "Class access is managed by your teacher · Progress stays with your student account";
  const footerLinks = document.querySelectorAll("footer:not(.page-footer) a");
  if (footerLinks[0]) { footerLinks[0].href = "#class-join-form"; footerLinks[0].textContent = "Join a class"; }
  if (footerLinks[1]) { footerLinks[1].href = loginUrl; footerLinks[1].textContent = "Sign in for help"; }

  const bottomLinks = document.querySelectorAll("nav.md\\:hidden a");
  const destinations = [dashboardUrl, "/literacy.html", "/reading-library.html", `${dashboardUrl}#rewards`];
  bottomLinks.forEach((link, index) => { if (destinations[index]) link.href = destinations[index]; });

  if (savedRoomCode && QBSupabase?.configured) {
    QBSupabase.getSession().then((session) => {
      if (session) roomForm.requestSubmit();
    }).catch((error) => showRoomStatus(error?.message || "We couldn’t check your student session.", true));
  } else if (false && savedCode && QBSupabase?.configured) {
    QBSupabase.getSession().then((session) => {
      if (session) document.getElementById("class-join-form").requestSubmit();
    }).catch((error) => showStatus(error?.message || "We couldn’t check your student session.", true));
  }
  // This entry page presents account and live-room options without class enrollment.
  pinPanel.remove();
  profilePanel.style.gridColumn = '1 / -1';
  profilePanel.style.width = '100%';
  document.querySelectorAll('a[href="#class-join-form"]').forEach((link) => link.remove());
  if (heroPrompt) heroPrompt.textContent = 'Open your learning space or join a live game.';
  if (heroCopy) heroCopy.textContent = 'Find your activities and saved progress.';
  const flowSubtitle = document.querySelector('.qb-flow-title p');
  if (flowSubtitle) flowSubtitle.textContent = 'Choose a learning activity or join a live game.';
})();
