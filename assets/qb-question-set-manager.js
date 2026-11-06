(function () {
  const status = document.querySelector("#status");
  const list = document.querySelector("#sets");
  let sets = [];
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function render() {
    const query = document.querySelector("#search").value.trim().toLowerCase();
    const rows = sets.filter((set) => `${set.title} ${set.description} ${set.category} ${set.language}`.toLowerCase().includes(query));
    list.replaceChildren();
    if (!rows.length) { list.innerHTML = `<div class="empty"><h2>${sets.length ? "No matches" : "No question sets yet"}</h2><p>${sets.length ? "Try another search." : "Create a draft to begin building your learning activity."}</p><a class="btn primary" href="../06._qb_create_edit_question_set/code.html">Create question set</a></div>`; return; }
    for (const set of rows) {
      const row = document.createElement("article"); row.className = "item";
      row.innerHTML = `<div><h2>${esc(set.title)}</h2><div class="meta">${esc(set.description || "No description")} · ${esc(set.language.toUpperCase())} · ${esc(set.category)} · Updated ${new Date(set.updated_at).toLocaleDateString()}</div></div><div class="tools"><span class="badge">${esc(set.status)}</span><a class="btn" href="../06._qb_create_edit_question_set/code.html?id=${encodeURIComponent(set.id)}">Open / edit</a></div>`;
      list.append(row);
    }
  }
  window.addEventListener("DOMContentLoaded", async () => {
    if (!window.QBSupabase?.configured) { status.textContent = "Supabase is not configured. Connect the project to load and save your private question sets."; return; }
    try { const result = await window.QBSupabase.listQuestionSets(); if (!result.authenticated) { status.textContent = "Sign in with a teacher account to see your question sets."; return; } sets = result.sets; status.hidden = true; render(); }
    catch (error) { status.dataset.kind = "error"; status.textContent = error.message; }
  });
  document.querySelector("#search").addEventListener("input", render);
})();
