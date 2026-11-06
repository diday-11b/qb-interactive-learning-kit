(function () {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const form = $("#editor");
  const list = $("#questions");
  const state = { id: new URLSearchParams(location.search).get("id"), questions: [], dirty: false, busy: false, saved: false };
  const makeId = () => crypto.randomUUID();
  const escapeText = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  function message(text, kind = "info") { const box = $("#message"); box.textContent = text; box.dataset.kind = kind; box.hidden = false; }
  function markDirty() { state.dirty = true; state.saved = false; $("#saveState").textContent = "Unsaved changes"; }
  function setBusy(busy, label) { state.busy = busy; for (const id of ["#saveBtn", "#publishBtn"]) $(id).disabled = busy; if (label) $("#saveState").textContent = label; }
  function emptyQuestion() { return { prompt: "", instructions: "", image_path: "", image_alt: "", audio_path: "", choices: [{ id: makeId(), text: "" }, { id: makeId(), text: "" }], correct_choice_id: "", explanation: "", _failedUpload: null, _pendingPath: null }; }
  function render() {
    $("#questionCount").textContent = `${state.questions.length}`;
    $("#addQuestion").disabled = state.questions.length >= 100;
    list.replaceChildren();
    state.questions.forEach((question, index) => {
      const card = document.createElement("section"); card.className = "question"; card.dataset.index = index;
      const choiceHtml = question.choices.map((choice, choiceIndex) => `<label class="choice"><input type="radio" name="correct-${index}" value="${escapeText(choice.id)}" ${question.correct_choice_id === choice.id ? "checked" : ""} aria-label="Mark ${choiceIndex + 1} as correct"><input type="text" data-choice="${choiceIndex}" maxlength="120" value="${escapeText(choice.text)}" placeholder="Answer choice ${choiceIndex + 1}" aria-label="Answer choice ${choiceIndex + 1}"><button class="icon-btn remove-choice" type="button" data-choice="${choiceIndex}" aria-label="Remove choice ${choiceIndex + 1}" ${question.choices.length <= 2 ? "disabled" : ""}>×</button></label>`).join("");
      const imagePreview = question.image_path ? '<div class="attached-media image-preview" role="status">Loading image preview…</div>' : "";
      const audioPreview = question.audio_path ? '<div class="attached-media audio-preview" role="status">Loading audio preview…</div>' : "";
      card.innerHTML = `<div class="qhead"><strong class="qtitle">Question ${index + 1}</strong><div class="row-actions"><button class="icon-btn move-up" type="button" aria-label="Move question ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button><button class="icon-btn move-down" type="button" aria-label="Move question ${index + 1} down" ${index === state.questions.length - 1 ? "disabled" : ""}>↓</button><button class="icon-btn duplicate" type="button" aria-label="Duplicate question ${index + 1}">⧉</button><button class="icon-btn delete" type="button" aria-label="Delete question ${index + 1}">⌫</button></div></div><div class="qfields"><label class="field"><span>Question text *</span><textarea data-field="prompt" maxlength="500" required placeholder="Write one short question">${escapeText(question.prompt)}</textarea></label><label class="field"><span>Instructions (optional)</span><input data-field="instructions" maxlength="500" value="${escapeText(question.instructions)}" placeholder="For example: Choose the picture that starts with /b/."></label><div class="fields"><div class="upload"><label class="field"><span>Question picture (optional)</span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif" data-upload="image" aria-label="Upload question picture"></label>${imagePreview}<small>JPEG, PNG, WebP or GIF · max 10 MB</small><button class="btn quiet pick-media" data-pick="image" type="button">Choose from media library</button>${question._failedUpload?.type === "image" ? '<button class="btn yellow retry-upload" type="button">Retry image upload</button>' : ""}</div><div class="upload"><label class="field"><span>Audio prompt (optional)</span><input type="file" accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" data-upload="audio" aria-label="Upload question audio"></label>${audioPreview}<small>MP3, MP4, WAV, OGG or WebM · max 10 MB</small><button class="btn quiet pick-media" data-pick="audio" type="button">Choose from media library</button>${question._failedUpload?.type === "audio" ? '<button class="btn yellow retry-upload" type="button">Retry audio upload</button>' : ""}</div></div><label class="field"><span>Image description (for accessibility)</span><input data-field="image_alt" maxlength="200" value="${escapeText(question.image_alt)}" placeholder="Describe the picture for learners using a screen reader"></label><div><span class="legend">Answer choices · choose the correct answer</span><div class="choices">${choiceHtml}</div><p class="correct-label">Selected radio marks the right answer.</p><button class="btn quiet add-choice" type="button" ${question.choices.length >= 6 ? "disabled" : ""}>＋ Add answer choice</button></div><label class="field"><span>Feedback or explanation (optional)</span><textarea data-field="explanation" maxlength="500" placeholder="A friendly hint or explanation">${escapeText(question.explanation)}</textarea></label></div>`;
      list.append(card);
      if (question.image_path) void renderMediaPreview($(".image-preview", card), question.image_path, "image", question.image_alt || question.prompt || "Question image");
      if (question.audio_path) void renderMediaPreview($(".audio-preview", card), question.audio_path, "audio", "Play question audio");
    });
  }
  async function renderMediaPreview(target, path, kind, altText) {
    if (!target || !window.QBSupabase?.resolveQuestionMedia) return;
    try {
      const url = await window.QBSupabase.resolveQuestionMedia(path);
      if (!target.isConnected) return;
      if (kind === "image") {
        const image = document.createElement("img"); image.className = "media-preview"; image.src = url; image.alt = altText;
        image.addEventListener("error", () => { if (target.isConnected) target.textContent = "Image preview unavailable. Check this file in the media library."; }, { once: true });
        target.replaceChildren(image); target.removeAttribute("role");
      } else {
        const audio = document.createElement("audio"); audio.src = url; audio.controls = true; audio.preload = "none"; audio.setAttribute("aria-label", altText);
        audio.addEventListener("error", () => { if (target.isConnected) target.textContent = "Audio preview unavailable. Check this file in the media library."; }, { once: true });
        target.replaceChildren(audio); target.removeAttribute("role");
      }
    } catch (_) {
      if (target.isConnected) target.textContent = `${kind === "image" ? "Image" : "Audio"} preview unavailable. Check this file in the media library.`;
    }
  }
  function readForm() {
    return { id: state.id, title: form.elements.title.value.trim(), description: form.elements.description.value.trim(), language: form.elements.language.value, category: form.elements.category.value, difficulty: form.elements.difficulty.value, compatible_games: form.elements.compat.value, questions: state.questions.map((q) => ({ prompt: q.prompt.trim(), instructions: q.instructions.trim(), image_path: q.image_path || null, image_alt: q.image_alt.trim(), audio_path: q.audio_path || null, choices: q.choices.map((choice) => ({ id: choice.id, text: choice.text.trim() })), correct_choice_id: q.correct_choice_id, explanation: q.explanation.trim() })) };
  }
  function validate(payload, publish = false) {
    if (!payload.title) return "Give your question set a title.";
    if (payload.questions.length > 100) return "A question set can contain up to 100 questions.";
    if (publish && payload.questions.length === 0) return "Add at least one question before publishing.";
    for (let i = 0; publish && i < payload.questions.length; i++) {
      const q = payload.questions[i];
      if (!q.prompt) return `Add the question text for question ${i + 1}.`;
      if (q.choices.length < 2 || q.choices.length > 6 || q.choices.some((choice) => !choice.text)) return `Question ${i + 1} needs 2–6 answer choices with text.`;
      if (!q.correct_choice_id || !q.choices.some((choice) => choice.id === q.correct_choice_id)) return `Mark one correct answer for question ${i + 1}.`;
      if (["picture_guessing", "both"].includes(payload.compatible_games) && (q.choices.length !== 3 || !q.image_path)) return `Question ${i + 1} needs an image and exactly 3 choices for picture guessing.`;
    }
    if (publish && ["picture_guessing", "both"].includes(payload.compatible_games) && payload.questions.length < 10) return "A picture guessing set needs at least 10 questions.";
    return "";
  }
  async function saveDraft() {
    if (!window.QBSupabase?.configured) throw new Error("Supabase is not configured. Your changes are still here; follow supabase/README.md to enable account saving.");
    const payload = readForm(); const issue = validate(payload);
    if (issue) { message(issue, "error"); throw new Error("Please fix the highlighted question set details."); }
    const id = await window.QBSupabase.saveQuestionSet(payload); state.id = id;
    const url = new URL(location.href); url.searchParams.set("id", id); history.replaceState({}, "", url);
    state.dirty = false; state.saved = true; $("#saveState").textContent = "Draft saved"; $("#setInfo").textContent = `Draft · ${id.slice(0, 8)}`;
    return id;
  }
  async function ensureSetId() {
    if (state.id) return state.id;
    if (!window.QBSupabase?.configured) throw new Error("Configure Supabase before uploading media.");
    const payload = readForm();
    if (!payload.title) throw new Error("Add a title before uploading media so the draft can be created.");
    const id = await window.QBSupabase.saveQuestionSet({ ...payload, questions: [] });
    state.id = id; const url = new URL(location.href); url.searchParams.set("id", id); history.replaceState({}, "", url);
    $("#setInfo").textContent = `Draft · ${id.slice(0, 8)}`; return id;
  }
  async function guardedSave() {
    if (state.busy) return null;
    setBusy(true, "Saving draft…"); message("Saving your draft…");
    try { const id = await saveDraft(); message("Draft saved to your teacher account.", "success"); await loadSets(); return id; }
    catch (error) { if (!$("#message").dataset.kind || $("#message").dataset.kind !== "error") message(error.message, "error"); throw error; }
    finally { setBusy(false); }
  }
  async function loadSet() {
    if (!state.id || !window.QBSupabase?.configured) return;
    const set = await window.QBSupabase.getQuestionSet(state.id); if (!set) { message("This question set could not be found or you do not have permission to edit it.", "error"); return; }
    for (const name of ["title", "description", "language", "category", "difficulty"]) form.elements[name].value = set[name] || "";
    const compatibility = set.compatible_games || [];
    form.elements.compat.value = compatibility.includes("picture_guessing") && compatibility.includes("multiple_choice") ? "both" : compatibility.includes("picture_guessing") ? "picture_guessing" : "multiple_choice";
    state.questions = (set.questions || []).map((q) => ({ ...q, choices: q.choices || [], _failedUpload: null, _pendingPath: null }));
    if (!state.questions.length) state.questions.push(emptyQuestion());
    state.dirty = false; state.saved = true; $("#pageTitle").textContent = "Edit question set"; $("#saveState").textContent = set.status === "published" ? "Published · edits become a draft" : "Draft saved"; $("#setInfo").textContent = `${set.status} · updated ${new Date(set.updated_at).toLocaleDateString()}`; $("#publishedTools").hidden = set.status !== "published"; render();
  }
  async function loadSets() {
    const target = $("#savedSets"); target.replaceChildren();
    if (!window.QBSupabase?.configured) { target.textContent = "Connect Supabase to see saved sets."; return; }
    try {
      const result = await window.QBSupabase.listQuestionSets();
      if (!result.authenticated) { target.textContent = "Sign in as a teacher to see saved sets."; return; }
      if (!result.sets.length) { target.textContent = "No saved sets yet."; return; }
      for (const set of result.sets) { const row = document.createElement("a"); row.className = "set-item"; row.href = `?id=${encodeURIComponent(set.id)}`; row.innerHTML = `<span>${escapeText(set.title)}<br><small>${escapeText(set.language.toUpperCase())} · ${escapeText(set.category)}</small></span><span class="pill">${escapeText(set.status)}</span>`; target.append(row); }
    } catch (error) { target.textContent = error.message; }
  }
  function openPreview() {
    const payload = readForm(); const issue = validate(payload, true);
    if (issue) { message(issue, "error"); return; }
    const body = $("#previewBody"); body.replaceChildren();
    const title = document.createElement("p"); title.textContent = payload.title || "Untitled set"; body.append(title);
    payload.questions.forEach((q, i) => { const section = document.createElement("section"); section.className = "question"; section.lang = payload.language === "km" ? "km" : "en"; const prompt = document.createElement("h3"); prompt.textContent = `${i + 1}. ${q.prompt}`; section.append(prompt); if (q.instructions) { const note = document.createElement("p"); note.textContent = q.instructions; section.append(note); } if (q.image_path) { const media = document.createElement("div"); media.className = "attached-media image-preview"; media.textContent = "Loading image preview…"; section.append(media); void renderMediaPreview(media, q.image_path, "image", q.image_alt || q.prompt || "Question image"); } if (q.audio_path) { const media = document.createElement("div"); media.className = "attached-media audio-preview"; media.textContent = "Loading audio preview…"; section.append(media); void renderMediaPreview(media, q.audio_path, "audio", "Play question audio"); } const choices = document.createElement("div"); choices.className = "preview-choices"; q.choices.forEach((choice) => { const option = document.createElement("div"); option.className = "preview-item"; option.textContent = choice.text + (choice.id === q.correct_choice_id ? " ✓ Correct answer" : ""); choices.append(option); }); section.append(choices); if (q.explanation) { const feedback = document.createElement("p"); feedback.textContent = `Feedback: ${q.explanation}`; section.append(feedback); } body.append(section); });
    $("#previewDialog").showModal();
  }
  list.addEventListener("input", (event) => { const card = event.target.closest(".question"); if (!card) return; const q = state.questions[Number(card.dataset.index)]; const field = event.target.dataset.field; const choiceIndex = event.target.dataset.choice; if (field) q[field] = event.target.value; if (choiceIndex !== undefined && event.target.type === "text") q.choices[Number(choiceIndex)].text = event.target.value; markDirty(); });
  list.addEventListener("change", (event) => { const card = event.target.closest(".question"); if (!card) return; const q = state.questions[Number(card.dataset.index)]; if (event.target.type === "radio") { q.correct_choice_id = event.target.value; markDirty(); } if (event.target.type === "file") void handleUpload(card, event.target); });
  async function handleUpload(card, input, retryFile) {
    const file = retryFile || input.files?.[0]; if (!file) return;
    const type = input.dataset.upload;
    const supported = {
      image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      audio: ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm"]
    };
    if (!supported[type]?.includes(file.type) || file.size > 10 * 1024 * 1024) { message("Choose a supported image or audio file that is 10 MB or smaller.", "error"); input.value = ""; return; }
    const q = state.questions[Number(card.dataset.index)];
    try { const setId = await ensureSetId();q._pendingPath ||= await window.QBSupabase.prepareQuestionMediaUpload(setId,file);message("Uploading private media…"); const path = await window.QBSupabase.uploadQuestionMedia(setId, file, (percent) => message(`Uploading private media… ${percent}%`),q._pendingPath); q._pendingPath=null;q._failedUpload=null;q[type === "image" ? "image_path" : "audio_path"] = path; markDirty(); render(); message("Media uploaded. Save the draft to attach it to this question.", "success"); }
    catch (error) { q._failedUpload={file,type};input.value="";render();message(error.message,"error"); }
  }
  async function openMediaPicker(kind, card) {
    const dialog=$("#mediaPicker"); const container=$("#pickerItems"); const pickerStatus=$("#pickerStatus"); container.replaceChildren(); pickerStatus.textContent="Loading your private media…"; dialog.showModal();
    if(!window.QBSupabase?.configured){pickerStatus.textContent="Configure Supabase and sign in as a teacher to use your media library.";return;}
    try {
      const result=await window.QBSupabase.listMediaAssets();
      if(!result.authenticated){pickerStatus.textContent="Sign in as a teacher to choose private media.";return;}
      const assets=result.assets.filter(asset=>asset.media_kind===kind);
      if(!assets.length){pickerStatus.textContent=`No ${kind} files in your library yet. Use Media library to add one.`;return;}
      pickerStatus.textContent=`Choose a ${kind} for this question.`;
      for(const asset of assets){
        const row=document.createElement("section");row.className="question";
        const choose=document.createElement("button");choose.className="btn primary";choose.type="button";choose.textContent=`Use ${asset.title}`;
        const details=document.createElement("p");details.textContent=`${asset.title} · ${asset.language.toUpperCase()} · ${asset.purpose.replaceAll("_"," ")}`;
        row.append(details);
        try{const url=await window.QBSupabase.resolveQuestionMedia(asset.storage_path);if(kind==="image"){const img=document.createElement("img");img.src=url;img.alt=asset.alt_text||asset.title;img.className="media-preview";row.append(img);}else{const audio=document.createElement("audio");audio.src=url;audio.controls=true;audio.preload="none";audio.setAttribute("aria-label",`Preview ${asset.title}`);row.append(audio);}}catch(_){const unavailable=document.createElement("p");unavailable.textContent="Media file unavailable. Refresh it in the media library.";row.append(unavailable);}
        choose.addEventListener("click",()=>{const q=state.questions[Number(card.dataset.index)];q[kind==="image"?"image_path":"audio_path"]=asset.storage_path;if(kind==="image"&&asset.alt_text)q.image_alt=asset.alt_text;markDirty();render();dialog.close();message(`${kind==="image"?"Image":"Audio"} added from your library. Save the draft to keep the change.`,"success");});
        row.append(choose);container.append(row);
      }
    }catch(error){pickerStatus.textContent=error.message;}
  }
  list.addEventListener("click", (event) => {
    const card = event.target.closest(".question"); if (!card) return; const index = Number(card.dataset.index); const q = state.questions[index];
    if (event.target.closest(".retry-upload")) { const failed=q._failedUpload;const input=failed?card.querySelector('[data-upload="'+failed.type+'"]'):null;if(failed&&input)void handleUpload(card,input,failed.file); }
    else if (event.target.closest(".pick-media")) { void openMediaPicker(event.target.closest(".pick-media").dataset.pick,card); }
    else if (event.target.closest(".add-choice")) { if (q.choices.length < 6) { q.choices.push({ id: makeId(), text: "" }); markDirty(); render(); } }
    else if (event.target.closest(".remove-choice")) { const removeIndex = Number(event.target.closest(".remove-choice").dataset.choice); const removed = q.choices.splice(removeIndex, 1)[0]; if (removed?.id === q.correct_choice_id) q.correct_choice_id = ""; markDirty(); render(); }
    else if (event.target.closest(".delete")) { if (!confirm(`Delete question ${index + 1}?`)) return; state.questions.splice(index, 1); markDirty(); render(); }
    else if (event.target.closest(".duplicate")) { if (state.questions.length >= 100) { message("A question set can contain up to 100 questions.", "error"); return; } const duplicate = structuredClone(q); duplicate.choices = duplicate.choices.map((choice) => ({ ...choice, id: makeId() })); duplicate.correct_choice_id = ""; duplicate._failedUpload=null;duplicate._pendingPath=null; state.questions.splice(index + 1, 0, duplicate); markDirty(); render(); }
    else if (event.target.closest(".move-up") && index > 0) { [state.questions[index - 1], state.questions[index]] = [state.questions[index], state.questions[index - 1]]; markDirty(); render(); }
    else if (event.target.closest(".move-down") && index < state.questions.length - 1) { [state.questions[index + 1], state.questions[index]] = [state.questions[index], state.questions[index + 1]]; markDirty(); render(); }
  });
  $("#addQuestion").addEventListener("click", () => { if (state.questions.length >= 100) { message("A question set can contain up to 100 questions.", "error"); return; } state.questions.push(emptyQuestion()); markDirty(); render(); list.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" }); });
  $("#saveBtn").addEventListener("click", () => void guardedSave().catch(() => {}));
  $("#publishBtn").addEventListener("click", async () => { const issue = validate(readForm(), true); if (issue) { message(issue, "error"); return; } if (!window.QBSupabase?.configured) { message("Supabase is not configured. Publishing requires the database migration and a teacher account.", "error"); return; } setBusy(true, "Saving before publish…"); try { const id = await saveDraft(); const result = await window.QBSupabase.publishQuestionSet(id); state.saved = true; $("#saveState").textContent = "Published"; $("#setInfo").textContent = `Published · ${result.questions} questions`; $("#publishedTools").hidden = false; message("Your question set is published and ready for compatible game activities.", "success"); await loadSets(); } catch (error) { message(error.message, "error"); } finally { setBusy(false); } });
  $("#makeGameBtn").addEventListener("click", async () => {
    if (!state.id || state.dirty) { message("Save and publish your latest edits before creating a game.", "error"); return; }
    const type = form.elements.compat.value === "both" ? "multiple_choice" : form.elements.compat.value;
    const button = $("#makeGameBtn"); button.disabled = true; $("#gameResult").textContent = "Preparing your game…";
    try { const activityId = await window.QBSupabase.createGameFromQuestionSet(state.id, type); const link = document.createElement("a"); link.href = `/game-player.html?activity_id=${encodeURIComponent(activityId)}`; link.textContent = "Open player setup"; link.className = "btn quiet"; const output = $("#gameResult"); output.replaceChildren(document.createTextNode(`Ready · ${type.replaceAll("_", " ")} · `), link, document.createElement("br"), document.createTextNode(`Activity ID: ${activityId} · Assign this activity to your class for learners to play.`)); message("Game activity created and attached to this question set.", "success"); }
    catch (error) { $("#gameResult").textContent = error.message; message(error.message, "error"); }
    finally { button.disabled = false; }
  });
  $("#previewBtn").addEventListener("click", openPreview); $("#previewBottom").addEventListener("click", openPreview); $("#closePreview").addEventListener("click", () => $("#previewDialog").close());
  $("#closeMediaPicker").addEventListener("click",()=>$("#mediaPicker").close());
  form.addEventListener("input", markDirty); form.addEventListener("change", markDirty);
  window.addEventListener("beforeunload", (event) => { if (state.dirty) { event.preventDefault(); event.returnValue = ""; } });
  window.addEventListener("DOMContentLoaded", async () => {
    state.questions.push(emptyQuestion()); render();
    if (!window.QBSupabase?.configured) message("Editor is ready. Configure Supabase to sign in, save persistent drafts, and publish.", "error");
    try { await loadSet(); await loadSets(); } catch (error) { message(error.message, "error"); }
  });
})();
