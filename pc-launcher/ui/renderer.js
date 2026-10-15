// Launcher renderer — drives the UI from main-process state.
const $ = (s) => document.querySelector(s);
const statusEl = $("#status"), playBtn = $("#btn-play"), updateBtn = $("#btn-update");
const progWrap = $("#progress-wrap"), progFill = $("#progress-fill"), progLabel = $("#progress-label");

function renderNotes(md) {
  const lines = (md || "").trim().split("\n");
  if (!lines.length || !lines[0]) return '<p class="dim">No notes yet.</p>';
  return lines.map((ln) => {
    const h = ln.match(/^#{1,3}\s+(.*)/);
    if (h) return `<div class="note-head">${esc(h[1])}</div>`;
    if (/^-\s+/.test(ln)) return `<div class="note-item">${esc(ln.replace(/^-\s+/, ""))}</div>`;
    return `<div>${esc(ln)}</div>`;
  }).join("");
}

async function refresh() {
  const st = await window.launcher.state();
  if (!st.ok) {
    statusEl.innerHTML = "Couldn't reach the update server.<br>Check your connection and reopen.";
    $("#notes").innerHTML = '<p class="dim">Patch notes unavailable offline.</p>';
    if (st.installed) { playBtn.classList.remove("hidden"); }
    return;
  }
  $("#notes").innerHTML = renderNotes(st.notes);
  if (!st.installed) {
    statusEl.innerHTML = "The game isn't installed yet.<br>Hit <b>Update</b> to download it.";
    updateBtn.textContent = "Install";
    updateBtn.classList.remove("hidden");
  } else if (st.updateAvailable) {
    statusEl.innerHTML = "A new build is ready.";
    updateBtn.textContent = "Update";
    updateBtn.classList.remove("hidden");
    playBtn.classList.remove("hidden");
  } else {
    statusEl.innerHTML = "You're up to date.";
    playBtn.classList.remove("hidden");
  }
}

updateBtn.addEventListener("click", async () => {
  updateBtn.disabled = true; playBtn.disabled = true;
  progWrap.classList.remove("hidden");
  const r = await window.launcher.update();
  progWrap.classList.add("hidden");
  updateBtn.disabled = false; playBtn.disabled = false;
  if (r.ok) { updateBtn.classList.add("hidden"); playBtn.classList.remove("hidden"); }
  refresh();
});

playBtn.addEventListener("click", async () => {
  const r = await window.launcher.play();
  if (!r.ok) statusEl.innerHTML = "Couldn't start the game: " + esc(r.error || "");
});

window.launcher.onProgress((d) => {
  if (d.phase === "downloading") {
    progFill.style.width = d.pct + "%";
    progLabel.textContent = "Downloading update… " + d.pct + "%";
    statusEl.innerHTML = "Downloading update…";
  } else if (d.phase === "installing") {
    progFill.style.width = "100%";
    progLabel.textContent = "Installing…";
    statusEl.innerHTML = "Installing…";
  } else if (d.phase === "done") {
    statusEl.innerHTML = "You're up to date.";
  } else if (d.phase === "error") {
    statusEl.innerHTML = "Update failed: " + esc(d.error || "");
  }
});

$("#tb-close").addEventListener("click", () => window.launcher.close());
refresh();
