(() => {
  "use strict";

  const root = document.getElementById("game-root");
  if (!root) return;
  const params = new URLSearchParams(location.search);
  const requestedActivity = params.get("activity_id");
  const requestedAssignment = params.get("assignment_id");
  const labels = {
    picture_guessing: "Picture Guessing",
    multiple_choice: "Multiple-Choice Quiz",
    matching_pairs: "Matching Pairs",
    flashcards: "Flashcards"
  };
  const instructions = {
    picture_guessing: "Look at the picture and choose one of three answers. There are exactly 10 picture questions in this round.",
    multiple_choice: "Read the question, choose one answer, and see how you did before moving on.",
    matching_pairs: "Choose a clue on the left, then its partner on the right. Match every pair to check the question.",
    flashcards: "Read the front, flip to reveal the back, then tell us whether you knew it or want more practice. Your score uses your saved choices."
  };
  const state = { activities: [], selected: "", latest: null, session: null, questionIndex: 0, answeredCount: 0, locked: false,
    feedback: null, matches: {}, selectedLeft: null, flipped: false, sound: false, result: null };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  };
  const button = (text, className, handler) => {
    const node = el("button", `player-button ${className || ""}`, text);
    node.type = "button";
    node.addEventListener("click", handler);
    return node;
  };
  const panel = () => { root.replaceChildren(); root.setAttribute("aria-busy", "false"); const p = el("section", "player-panel"); root.append(p); return p; };
  const status = (parent, message, kind = "info") => {
    const item = el("div", "player-status", message); item.setAttribute("role", kind === "error" ? "alert" : "status"); item.dataset.kind = kind; parent.append(item); return item;
  };
  const focusHeading = () => root.querySelector("h1,h2")?.focus({ preventScroll: true });
  const heading = (text, level = "h1") => { const node = el(level, "", text); node.tabIndex = -1; return node; };
  const safeImageUrl = value => {
    if (typeof value !== "string" || !value.trim()) return null;
    try { const url = new URL(value, location.href); return url.origin === location.origin || url.protocol === "https:" ? url.href : null; }
    catch (_) { return null; }
  };
  const toastSound = good => {
    if (!state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const context = new Ctx(); const oscillator = context.createOscillator(); const gain = context.createGain();
      oscillator.type = "sine"; oscillator.frequency.value = good ? 660 : 250;
      gain.gain.setValueAtTime(.08, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .18);
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .18);
      oscillator.onended = () => context.close();
    } catch (_) { /* Sound is an optional enhancement. */ }
  };
  document.getElementById("sound-toggle")?.addEventListener("click", event => {
    state.sound = !state.sound;
    event.currentTarget.setAttribute("aria-pressed", String(state.sound));
    event.currentTarget.textContent = state.sound ? "🔊 Sound on" : "🔈 Sound off";
  });
  window.addEventListener("qb-account-preferences-change", event => {
    state.sound = event.detail?.soundEnabled === true;
    const toggle = document.getElementById("sound-toggle");
    if (toggle) { toggle.setAttribute("aria-pressed", String(state.sound)); toggle.textContent = state.sound ? "🔊 Sound on" : "🔈 Sound off"; }
  });

  function showSetup(message = "") {
    document.onkeydown = null;
    const view = panel();
    view.append(el("span", "player-kicker", "Ready when you are"));
    view.append(heading("Choose a learning adventure"));
    view.append(el("p", "player-note", "Your round starts from published game content. Progress and results are saved to your account."));
    if (!state.activities.length) {
      status(view, message || "No published games for this player are available yet. Ask your teacher to publish a game with its questions.");
      return;
    }
    const form = el("div", "player-start-form");
    const label = el("label", "player-label", "Choose a game"); label.htmlFor = "activity-choice";
    const select = el("select", "player-select"); select.id = "activity-choice";
    state.activities.forEach(activity => {
      const option = el("option", "", `${activity.title} · ${labels[activity.engine_type] || activity.engine_type}`);
      option.value = activity.id; select.append(option);
    });
    const validRequested = state.activities.some(activity => activity.id === requestedActivity);
    state.selected = validRequested ? requestedActivity : (state.selected || state.activities[0].id);
    select.value = state.selected;
    select.addEventListener("change", () => { state.selected = select.value; });
    label.append(select); form.append(label);
    const activity = state.activities.find(item => item.id === state.selected);
    const instructionNote = el("p", "player-note", instructions[activity?.engine_type] || "Follow the steps on each screen and complete the round to see your result.");
    select.addEventListener("change", () => { instructionNote.textContent = instructions[state.activities.find(item => item.id === select.value)?.engine_type] || "Complete the round to see your result."; });
    form.append(instructionNote);
    form.append(button("Start game", "player-button--primary", startNew));
    view.append(form);
    if (state.latest && state.activities.some(a => a.id === state.latest.activity_id)) {
      const latestTitle = state.activities.find(a => a.id === state.latest.activity_id)?.title || "game";
      const resumeBox = el("div", "player-status", `An unfinished ${latestTitle} round is saved.`);
      resumeBox.append(document.createTextNode(" "));
      resumeBox.append(button("Resume round", "player-button--yellow", resumeLatest));
      view.append(resumeBox);
    }
    if (message) status(view, message, "error");
    const actions=el('div');actions.append(form.querySelector('button'));
    const setupStatus=el('p','',activity?.title||'Choose your learning activity');
    const extras=el('div');Array.from(view.children).filter(n=>n.classList.contains('player-status')).forEach(n=>extras.append(n));
    QBAdventureSetup.mount({root,title:'Choose your adventure',instructions:[instructionNote.textContent],settings:form,status:setupStatus,actions,notice:'This round uses published questions. Progress and results are saved to your account.',toggles:[{label:'Question sound',checked:state.sound,onChange:v=>{state.sound=v;}}]});
    root.querySelector('.setup-content').append(extras);
    actions.querySelector('button').textContent='Play ▶';
    select.addEventListener('change',()=>{setupStatus.textContent=state.activities.find(a=>a.id===select.value)?.title||'Choose your learning activity';});
  }

  function showLoading(message) {
    root.setAttribute("aria-busy", "true");
    const view = panel(); view.append(heading(message));
  }

  async function startNew() {
    const activity = state.activities.find(item => item.id === state.selected);
    if (!activity) return;
    showLoading("Starting your round…");
    try {
      state.session = await QBSupabase.startGameSession(activity.id, requestedAssignment);
      enterSession(state.session, []);
      showInstructions();
    } catch (error) { showSetup(error?.message || "We couldn’t start this game. Try again."); }
  }

  async function resumeLatest() {
    if (!state.latest) return;
    showLoading("Opening your saved round…");
    try {
      const session = await QBSupabase.resumeGameSession(state.latest.id);
      enterSession(session, session.answers || []);
      renderRound();
    } catch (error) { showSetup(error?.message || "We couldn’t resume that round. Try starting a new one."); }
  }

  function enterSession(session, answers) {
    state.session = session; state.questionIndex = answers.length; state.answeredCount = answers.length; state.locked = false;
    state.feedback = null; state.matches = {}; state.selectedLeft = null; state.flipped = false; state.result = null;
  }

  function showInstructions() {
    document.onkeydown = null;
    const view = panel(); const gameType = state.session.engine_type;
    view.append(el("span", "player-kicker", labels[gameType] || "Learning Game"));
    view.append(heading(state.session.title || "Your learning adventure"));
    view.append(el("p", "player-note", instructions[gameType] || "Answer each question. Your progress is saved as you play."));
    view.append(el("p", "player-note", `${state.session.total_questions} ${state.session.total_questions === 1 ? "question" : "questions"} in this round. Your result appears after the last answer.`));
    view.append(button("Let’s play!", "player-button--primary", renderRound));
    focusHeading();
  }

  function progressBlock() {
    const total = state.session.total_questions;
    const wrap = el("div", "player-progress");
    const top = el("div", "progress-top");
    top.append(el("strong", "", state.session.title || labels[state.session.engine_type]));
    top.append(el("span", "", `${Math.min(state.answeredCount, total)} of ${total}`));
    const track = el("div", "progress-track"); track.setAttribute("role", "progressbar");
    track.setAttribute("aria-label", "Round progress"); track.setAttribute("aria-valuemin", "0");
    track.setAttribute("aria-valuemax", String(total)); track.setAttribute("aria-valuenow", String(Math.min(state.answeredCount, total)));
    const fill = el("div", "progress-fill"); fill.style.width = `${Math.min(100, (state.answeredCount / total) * 100)}%`; track.append(fill);
    wrap.append(top, track); return wrap;
  }

  function renderRound() {
    if (!state.session) return;
    if (state.questionIndex >= state.session.total_questions) { renderReadyToFinish(); return; }
    const question = state.session.questions[state.questionIndex];
    if (!question) { showSetup("The saved round is incomplete. Ask your teacher to review this game’s content."); return; }
    const view = panel();
    view.append(el("span", "player-kicker", labels[state.session.engine_type] || "Learning game"));
    view.append(heading("Your turn!", "h2")); view.append(progressBlock());
    const card = el("section", "question-card"); card.setAttribute("aria-labelledby", "question-prompt");
    const content = question.content || {};
    const prompt = content.prompt || `Question ${question.position}`;
    if (state.session.engine_type === "picture_guessing" || content.image_url) {
      const art = el("div", "picture-frame");
      const storagePath = typeof content.image_url === "string" && !/^(https?:|data:|blob:|\/)/i.test(content.image_url);
      const src = storagePath ? null : safeImageUrl(content.image_url);
      if (src) {
        const img = document.createElement("img"); img.src = src; img.alt = content.image_alt || prompt;
        img.addEventListener("error", () => { img.remove(); art.append(el("span", "picture-fallback", "Picture unavailable. Ask your teacher to check this activity image.")); }, { once: true });
        art.append(img);
      } else if (storagePath && window.QBSupabase?.resolveQuestionMedia) {
        art.append(el("span", "picture-fallback", "Loading picture…"));
        window.QBSupabase.resolveQuestionMedia(content.image_url).then(url => {
          if (!art.isConnected) return;
          art.replaceChildren(); const img = document.createElement("img"); img.src = url; img.alt = content.image_alt || prompt;
          img.addEventListener("error", () => { img.remove(); art.append(el("span", "picture-fallback", "Picture unavailable. Ask your teacher to check this activity image.")); }, { once: true }); art.append(img);
        }).catch(() => { if (art.isConnected) { art.replaceChildren(el("span", "picture-fallback", "Picture unavailable. Ask your teacher to check this activity image.")); } });
      } else art.append(el("span", "picture-fallback", "This question’s picture is not available."));
      card.append(art);
    }
    const promptNode = el("p", "question-prompt", state.session.engine_type === "flashcards" ? (state.flipped ? content.back : content.front) : prompt);
    promptNode.id = "question-prompt"; card.append(promptNode);
    if (content.audio_path && window.QBSupabase?.resolveQuestionMedia) {
      const audio = document.createElement("audio"); audio.controls = true; audio.preload = "none"; audio.setAttribute("aria-label", "Play the teacher’s audio prompt");
      const unavailable = () => { if (audio.isConnected && !audio.dataset.unavailable) { audio.dataset.unavailable = "true"; card.append(el("span", "player-note", "Audio is unavailable right now. You can continue without it.")); } };
      audio.addEventListener("error", unavailable, { once: true });
      window.QBSupabase.resolveQuestionMedia(content.audio_path).then(url => { if (audio.isConnected) audio.src = url; }).catch(unavailable);
      card.append(audio);
    }

    if (state.session.engine_type === "picture_guessing" || state.session.engine_type === "multiple_choice") {
      const choices = el("div", "answer-grid");
      (content.choices || []).forEach((choice, index) => {
        const answer = button("", "answer-choice", () => submit({ choice_id: choice.id }));
        answer.disabled = state.locked || Boolean(state.feedback);
        answer.setAttribute("aria-label", `Answer ${index + 1}: ${choice.text || "picture choice"}`);
        if (choice.text) answer.append(document.createTextNode(choice.text));
        else answer.append(document.createTextNode(`Choice ${index + 1}`));
        answer.dataset.choiceIndex = String(index + 1); choices.append(answer);
      });
      card.append(choices);
      document.onkeydown = event => {
        if (state.locked || !/^[1-6]$/.test(event.key)) return;
        const target = card.querySelector(`[data-choice-index="${event.key}"]`);
        if (target && !target.disabled) { event.preventDefault(); target.click(); }
      };
    } else if (state.session.engine_type === "matching_pairs") {
      document.onkeydown = null;
      const layout = el("div", "matching-layout");
      const leftCol = el("div", "matching-column"); const rightCol = el("div", "matching-column");
      leftCol.setAttribute("role", "group"); leftCol.setAttribute("aria-label", "Choose an item to match");
      rightCol.setAttribute("role", "group"); rightCol.setAttribute("aria-label", "Choose its match");
      const matchedRight = new Set(Object.values(state.matches));
      (content.left_items || []).forEach(item => {
        const left = button(item.text, "answer-choice matching-choice", () => { state.selectedLeft = item.id; renderRound(); });
        left.setAttribute("aria-pressed", String(state.selectedLeft === item.id)); left.disabled = state.locked || Boolean(state.feedback) || Boolean(state.matches[item.id]);
        leftCol.append(left);
      });
      (content.right_items || []).slice().sort(() => Math.random() - .5).forEach(item => {
        const right = button(item.text, "answer-choice matching-choice", () => {
          if (!state.selectedLeft) return;
          state.matches[state.selectedLeft] = item.id; state.selectedLeft = null;
          if (Object.keys(state.matches).length === content.left_items.length) submit({ matches: state.matches });
          else renderRound();
        });
        right.setAttribute("aria-pressed", String(matchedRight.has(item.id))); right.disabled = state.locked || Boolean(state.feedback) || matchedRight.has(item.id);
        rightCol.append(right);
      });
      layout.append(leftCol, rightCol); card.append(layout);
    } else if (state.session.engine_type === "flashcards") {
      document.onkeydown = null;
      const flip = button(state.flipped ? "Show the front" : "Flip card", "player-button--yellow", () => { state.flipped = !state.flipped; renderRound(); });
      flip.disabled = state.locked || Boolean(state.feedback);
      card.append(flip);
      if (state.flipped) {
        const choices = el("div", "game-actions");
        const knew = button("I knew it", "player-button--primary", () => submit({ rating: "know" }));
        const practice = button("I need more practice", "player-button--quiet", () => submit({ rating: "practice" }));
        knew.disabled = practice.disabled = state.locked || Boolean(state.feedback);
        choices.append(knew, practice);
        card.append(choices);
      }
    }
    view.append(card);
    if (state.feedback) appendFeedback(view);
    const actions = el("div", "game-actions");
    actions.append(button("Restart round", "player-button--quiet", restartRound));
    if (state.feedback) actions.append(button(state.questionIndex + 1 >= state.session.total_questions ? "See my result" : "Next question", "player-button--primary", () => {
      state.feedback = null; state.matches = {}; state.selectedLeft = null; state.flipped = false;
      if (state.questionIndex + 1 >= state.session.total_questions) renderReadyToFinish();
      else { state.questionIndex += 1; renderRound(); }
    }));
    view.append(actions);
    if (!state.feedback) {
      const note = el("p", "visually-hidden", "Use Tab and Enter to choose an answer. On choice questions, keys 1 through 6 also select an answer.");
      note.id = "keyboard-help"; view.append(note);
    }
    focusHeading();
  }

  function appendFeedback(view) {
    const row = el("div", "feedback-row");
    const isFlashcard = state.session.engine_type === "flashcards";
    const message = isFlashcard ? "Thanks for checking in. Your choice was saved." : state.feedback.correct ? "That’s right! Great work." : "Not quite. Keep learning and try the next one.";
    const feedback = el("p", "feedback", message);
    feedback.setAttribute("role", "status");
    if (!isFlashcard) feedback.dataset.correct = String(state.feedback.correct);
    row.append(feedback); view.append(row);
    const explanation = state.session?.questions?.[state.questionIndex]?.content?.explanation;
    if (!isFlashcard && explanation) view.append(el("p", "player-note", explanation));
  }

  async function submit(response) {
    if (state.locked || state.feedback || !state.session) return;
    state.locked = true;
    root.querySelectorAll("button").forEach(item => { item.disabled = true; });
    try {
      const result = await QBSupabase.submitGameAnswer(state.session.session_id, state.questionIndex + 1, response);
      state.answeredCount = result.answered;
      state.feedback = { correct: Boolean(result.correct) };
      state.locked = false;
      toastSound(result.correct);
      renderRound();
      root.querySelector(".game-actions button:last-child")?.focus();
    } catch (error) {
      state.locked = false;
      const message = el("div", "player-status", error?.message || "Your answer could not be saved. Try again when the connection is ready.");
      message.dataset.kind = "error"; message.setAttribute("role", "alert"); root.querySelector(".player-panel")?.append(message);
      root.querySelectorAll("button").forEach(item => { item.disabled = false; });
    }
  }

  function renderReadyToFinish() {
    document.onkeydown = null;
    const view = panel(); view.append(el("span", "player-kicker", labels[state.session.engine_type] || "Learning game"));
    view.append(heading("You finished the round!")); view.append(progressBlock());
    view.append(el("p", "player-note", "All answers are saved. Your score is calculated from the answers recorded for this round."));
    view.append(button("Show my result", "player-button--primary", finishRound));
    view.append(button("Restart round", "player-button--quiet", restartRound)); focusHeading();
  }

  async function finishRound() {
    showLoading("Checking your answers…");
    try {
      state.result = await QBSupabase.finishGameSession(state.session.session_id);
      renderResult();
    } catch (error) { renderReadyToFinish(); status(root.querySelector(".player-panel"), error?.message || "We couldn’t finish the round. Try again.", "error"); }
  }

  function renderResult() {
    document.onkeydown = null;
    const view = panel(); view.append(el("span", "player-kicker", "Round complete"));
    view.append(heading("Adventure complete!"));
    view.append(el("p", "player-note", state.session.title || labels[state.session.engine_type]));
    view.append(el("div", "result-score", `${state.result.correct_count} / ${state.result.total_questions}`));
    view.append(el("p", "", `Your score: ${state.result.score}% · ${state.result.correct_count} correct out of ${state.result.total_questions}.`));
    if (state.session.engine_type === "flashcards") view.append(el("p", "player-note", "Flashcard results are based on your self-rating for each card."));
    const actions = el("div", "game-actions");
    actions.append(button("Play again", "player-button--primary", restartRound));
    actions.append(button("Choose another game", "player-button--quiet", () => { state.session = null; showSetup(); }));
    view.append(actions); focusHeading();
  }

  async function restartRound() {
    if (!state.session) return;
    if (state.questionIndex < state.session.total_questions && !state.result
      && !window.confirm("Restart this round? The current attempt will be recorded as abandoned.")) return;
    showLoading("Starting a fresh round…");
    try {
      state.session = await QBSupabase.restartGameSession(state.session.session_id);
      enterSession(state.session, []); showInstructions();
    } catch (error) { state.session = null; showSetup(error?.message || "We couldn’t restart this round."); }
  }

  async function initialize() {
    await window.QBAccountPreferencesReady;
    state.sound = window.QBAccountPreferences?.soundEnabled === true;
    const soundButton = document.getElementById("sound-toggle");
    if (soundButton) {
      soundButton.setAttribute("aria-pressed", String(state.sound));
      soundButton.textContent = state.sound ? "🔊 Sound on" : "🔈 Sound off";
    }
    if (!window.QBSupabase?.configured) {
      const view = panel(); view.append(el("span", "player-kicker", "Local setup needed"));
      view.append(heading("Connect the game library first"));
      status(view, "This player uses published questions and server-checked results from Supabase. Follow supabase/README.md to configure the backend; no sample rounds are shown.", "error");
      return;
    }
    try {
      const result = await QBSupabase.getPlayableActivities();
      if (!result.authenticated) {
        const view = panel(); view.append(heading("Sign in to play"));
        view.append(el("p", "player-note", "A student account is needed to save a round and its result."));
        const link = el("a", "player-link", "Sign in"); link.href = "/16._qb_unified_sign_in_sign_up/code.html"; view.append(link); return;
      }
      if (!result.authorized) { const view = panel(); view.append(heading("This player is for students")); status(view, "Ask a teacher or parent to help you open a student game account.", "error"); return; }
      state.activities = result.activities || [];
      if (state.activities.length) state.latest = await QBSupabase.getLatestActiveGameSession(state.activities.map(a => a.id));
      if (requestedActivity && !state.activities.some(activity => activity.id === requestedActivity)) {
        showSetup("This activity is not available to your account."); return;
      }
      showSetup();
    } catch (error) {
      const view = panel(); view.append(heading("We couldn’t load your games"));
      status(view, error?.message || "Check your connection and try again.", "error");
      view.append(button("Try again", "player-button--primary", initialize));
    }
  }

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && state.session?.status === "in_progress") document.onkeydown = null;
  });
  initialize();
})();
