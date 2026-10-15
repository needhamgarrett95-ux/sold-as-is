// Sold As-Is — phone shell (aud218): lock screen + home screen over the live game.
// View-layer only. Game logic, economy, saves, and dialogue are untouched.
// App icons call Views.show(view) — the same seam the old tab strip used.

const Phone = (() => {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  const shell = () => $("#phone-shell");
  const lockScreen = () => $("#lockScreen");
  const homeScreen = () => $("#homeScreen");

  function setText(sel, txt) {
    const el = $(sel);
    if (el) el.textContent = txt;
  }

  /* ---------- clock ---------- */
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  function tick() {
    const d = new Date();
    let h = d.getHours() % 12; if (h === 0) h = 12;
    const t = h + ":" + ("0" + d.getMinutes()).slice(-2);
    const dateStr = DAYS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate();
    setText("#lockTime", t);
    setText("#lockDate", dateStr);
    $$("[data-clock]").forEach(el => { el.textContent = t; });
    $$("[data-datestr]").forEach(el => { el.textContent = dateStr; });
  }

  /* ---------- lock screen notifications (live activity feed) ---------- */
  function timeAgo(at) {
    const s = Math.max(0, Math.floor((Date.now() - (at || Date.now())) / 1000));
    if (s < 60) return "now";
    const m = Math.floor(s / 60);
    if (m < 60) return m + "m ago";
    const h = Math.floor(m / 60);
    if (h < 24) return h + "h ago";
    return Math.floor(h / 24) + "d ago";
  }
  function refreshLockNotes() {
    const wrap = $("#lockNotes");
    if (!wrap) return;
    let items = [];
    try { items = JSON.parse(localStorage.getItem("soldasis_activity") || "[]").slice(0, 2); } catch (e) {}
    wrap.innerHTML = "";
    const addNote = (iconName, iconCls, head, when, text) => {
      const note = document.createElement("div");
      note.className = "lock-note";
      const ico = document.createElement("div");
      ico.className = "note-ico " + iconCls;
      const isp = document.createElement("span");
      isp.setAttribute("data-icon", iconName);
      ico.appendChild(isp);
      const body = document.createElement("div");
      body.className = "note-body";
      const hh = document.createElement("div");
      hh.className = "note-head";
      const b = document.createElement("b"); b.textContent = head;
      const w = document.createElement("span"); w.textContent = when;
      hh.appendChild(b); hh.appendChild(w);
      const tx = document.createElement("div");
      tx.className = "note-text";
      tx.textContent = String(text || "").slice(0, 110);
      body.appendChild(hh); body.appendChild(tx);
      note.appendChild(ico); note.appendChild(body);
      wrap.appendChild(note);
    };
    if (!items.length) {
      addNote("moped", "red", "Sold As-Is", "now", "Welcome in. The market's been moving without you.");
    } else {
      items.forEach(it => {
        const cat = it.cat || "marketplace";
        const isParts = cat === "parts";
        addNote(isParts ? "bone" : "moped", isParts ? "rust" : "red",
          isParts ? "Boneyard" : "Sold As-Is", timeAgo(it.at), it.msg);
      });
    }
    if (typeof Icon !== "undefined") Icon.hydrate(wrap);
  }

  /* ---------- live widgets ---------- */
  function refreshWidgets() {
    try {
      const cash = (typeof State !== "undefined" && typeof State.cash === "number") ? State.cash : 0;
      setText("#hsWallet", (typeof money === "function") ? money(cash) : ("$" + cash.toLocaleString()));
      const garage = (typeof State !== "undefined" && Array.isArray(State.garage)) ? State.garage : [];
      const kept = garage.filter(b => b.kept);
      setText("#wGarage", garage.length + (garage.length === 1 ? " bike" : " bikes"));
      setText("#wGarageSub", garage.length === 0
        ? "Empty — go find something."
        : (kept.length + (kept.length === 1 ? " keeper" : " keepers") + " on the wall."));
      const total = (typeof BIKES !== "undefined" && BIKES.length) ? BIKES.length : 47;
      setText("#wCollection", kept.length + " / " + total);
      const bar = $("#wCollectionBar");
      if (bar) bar.style.width = Math.min(100, Math.round(kept.length / total * 100)) + "%";
      setText("#wCollectionSub", (total - kept.length) + " to go.");
    } catch (e) {}
  }

  /* ---------- lock / unlock ---------- */
  let unlocked = false;
  function unlock() {
    if (unlocked) return;
    unlocked = true;
    document.body.classList.remove("is-locked");
    const lock = lockScreen();
    if (!lock) return;
    lock.classList.add("gone");
    const home = homeScreen();
    if (home) home.classList.add("on");
    refreshWidgets();
    document.dispatchEvent(new CustomEvent("phone-unlocked"));
    // Start tutorial on first run (after unlock; login splash removed aud218).
    // ?trailer=1 still skips it cleanly for trailer captures.
    // Guard !Tutorial.active so a relock mid-tutorial resumes instead of restarting.
    if (typeof Tutorial !== "undefined" && !Tutorial.active && new URLSearchParams(location.search).get("trailer") !== "1") {
      setTimeout(() => Tutorial.start(), 800);
    }
    setTimeout(() => { lock.style.display = "none"; }, 600);
  }
  function relock() {
    unlocked = false;
    document.body.classList.add("is-locked");
    const lock = lockScreen();
    const home = homeScreen();
    if (!lock || !home) return;
    lock.style.display = "";
    lock.style.transform = "";
    void lock.offsetWidth;
    lock.classList.remove("gone");
    home.classList.remove("on");
    refreshLockNotes();
    tick();
  }

  /* ---------- app launch / home ---------- */
  function openApp(view) {
    if (!view) return;
    try {
      if (typeof Views !== "undefined") Views.show(view);
    } catch (e) {}
    const sh = shell();
    if (sh) sh.classList.add("app-open");
    document.body.classList.add("app-mode");
  }
  function goHome() {
    const sh = shell();
    if (sh) sh.classList.remove("app-open");
    document.body.classList.remove("app-mode");
    refreshWidgets();
    tick();
  }

  /* ---------- settings app view ---------- */
  function settingRow({ icon, iconCls, label, value, danger, onClick }) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "set-row" + (danger ? " danger" : "");
    const ic = document.createElement("span");
    ic.className = "s-ico " + (iconCls || "slate");
    const isp = document.createElement("span");
    isp.setAttribute("data-icon", icon || "gear");
    ic.appendChild(isp);
    const lb = document.createElement("span");
    lb.className = "s-label";
    lb.textContent = label;
    b.appendChild(ic); b.appendChild(lb);
    if (value !== undefined) {
      const v = document.createElement("span");
      v.className = "s-val";
      v.textContent = value;
      b.appendChild(v);
    }
    const ch = document.createElement("span");
    ch.className = "s-chev";
    ch.setAttribute("data-icon", "chevR");
    b.appendChild(ch);
    if (onClick) b.addEventListener("click", onClick);
    return b;
  }
  function settingGroup(title, rows) {
    const g = document.createElement("div");
    g.className = "set-group";
    const h = document.createElement("h3");
    h.textContent = title;
    const list = document.createElement("div");
    list.className = "set-list";
    rows.forEach(r => list.appendChild(r));
    g.appendChild(h); g.appendChild(list);
    return g;
  }
  // Every row delegates to the existing control — zero logic duplicated.
  function poke(id) {
    const el = document.getElementById(id);
    if (el) el.click();
  }
  function renderSettings() {
    const el = $("#settings-view");
    if (!el) return;
    el.innerHTML = "";
    const darkOn = document.body.classList.contains("dark-mode");
    const sfxSub = $("#music-sfx-sub");
    const sfxOn = !sfxSub || sfxSub.textContent.trim().toLowerCase() !== "off";
    const trackEl = $("#music-track-name");
    const track = trackEl ? trackEl.textContent.trim() : "";
    // profile card
    const pc = document.createElement("div");
    pc.className = "profile-card";
    const av = document.createElement("div");
    av.className = "avatar";
    const avIco = document.createElement("span");
    avIco.setAttribute("data-icon", "moped");
    av.appendChild(avIco);
    const ptxt = document.createElement("div");
    const pn = document.createElement("div");
    pn.className = "p-name"; pn.textContent = "sold as-is";
    const ps = document.createElement("div");
    ps.className = "p-sub";
    let cashTxt = "", collTxt = "";
    try {
      cashTxt = (typeof money === "function") ? money(State.cash) : "";
      const kept = (State.garage || []).filter(b => b.kept).length;
      const total = (typeof BIKES !== "undefined" && BIKES.length) ? BIKES.length : 47;
      collTxt = kept + " of " + total + " collected";
    } catch (e) {}
    ps.textContent = (cashTxt ? "Wallet " + cashTxt : "") + (cashTxt && collTxt ? " · " : "") + collTxt;
    ptxt.appendChild(pn); ptxt.appendChild(ps);
    pc.appendChild(av); pc.appendChild(ptxt);
    el.appendChild(pc);

    el.appendChild(settingGroup("GAME", [
      settingRow({ icon: "moon", iconCls: "slate", label: "Dark mode", value: darkOn ? "on" : "off",
        onClick: () => { poke("settings-darkmode"); renderSettings(); } }),
      settingRow({ icon: "speaker", iconCls: "rust", label: "Sound effects", value: sfxOn ? "on" : "off",
        onClick: () => { poke("music-sfx-toggle"); setTimeout(renderSettings, 60); } }),
    ]));
    el.appendChild(settingGroup("MUSIC", [
      settingRow({ icon: "music", iconCls: "gold", label: "Now playing", value: track || "—" }),
      settingRow({ icon: "play", iconCls: "slate", label: "Play / Pause",
        onClick: () => poke("music-toggle") }),
      settingRow({ icon: "next", iconCls: "slate", label: "Next track",
        onClick: () => { poke("music-next"); setTimeout(renderSettings, 60); } }),
    ]));
    el.appendChild(settingGroup("YOUR DATA", [
      settingRow({ icon: "check", iconCls: "green", label: "Backup save", value: "download a save file",
        onClick: () => poke("settings-backup") }),
      settingRow({ icon: "check", iconCls: "green", label: "Restore backup", value: "load a save file",
        onClick: () => poke("settings-restore") }),
      settingRow({ icon: "close", iconCls: "red", label: "Start over", value: "wipe save, fresh $1,500", danger: true,
        onClick: () => poke("settings-reset") }),
    ]));
    const about = document.createElement("div");
    about.className = "set-group";
    const ah = document.createElement("h3"); ah.textContent = "ABOUT";
    const al = document.createElement("div"); al.className = "set-list";
    const ar = document.createElement("div"); ar.className = "set-row static";
    const ai = document.createElement("span"); ai.className = "s-ico red";
    const aiIco = document.createElement("span"); aiIco.setAttribute("data-icon", "tag");
    ai.appendChild(aiIco);
    const alb = document.createElement("span"); alb.className = "s-label"; alb.textContent = "Sold As-Is";
    const av2 = document.createElement("span"); av2.className = "s-val";
    // Single source of truth: read the audit label from the stylesheet's cache-buster.
    // (A hardcoded label went stale at aud218 while the build moved on — never again.)
    try {
      const mv = document.querySelector('link[rel="stylesheet"]')?.href.match(/[?&]v=(aud\d+)/);
      av2.textContent = mv ? mv[1] : "aud?";
    } catch (e) { av2.textContent = "aud?"; }
    ar.appendChild(ai); ar.appendChild(alb); ar.appendChild(av2);
    al.appendChild(ar); about.appendChild(ah); about.appendChild(al);
    el.appendChild(about);
    const foot = document.createElement("div");
    foot.className = "site-foot";
    foot.textContent = "Sold as-is. No warranties, no take-backs.";
    el.appendChild(foot);
    if (typeof Icon !== "undefined") Icon.hydrate(el);
  }

  /* ---------- init ---------- */
  function init() {
    try {
      initInner();
    } catch (e) {
      // Never trap the player behind the shell: on any failure, drop it
      // and leave the plain game usable.
      try {
        const sh = shell();
        if (sh) sh.style.display = "none";
        document.body.classList.remove("app-mode");
      } catch (e2) {}
      if (typeof console !== "undefined" && console.error) console.error("phone shell init failed", e);
    }
  }
  function initInner() {
    tick();
    if (typeof renderAppIcons === "function") renderAppIcons();
    setInterval(tick, 15000);
    refreshLockNotes();
    refreshWidgets();

    const lock = lockScreen();
    // swipe-up / tap unlock (ported from the demo shell)
    let startY = null, dy = 0, dragging = false;
    if (lock) {
      lock.addEventListener("pointerdown", (e) => {
        if (unlocked) return;
        startY = e.clientY; dy = 0; dragging = true;
        lock.classList.add("dragging");
      });
      lock.addEventListener("pointermove", (e) => {
        if (!dragging || startY === null) return;
        dy = e.clientY - startY;
        if (dy < 0) lock.style.transform = "translateY(" + dy + "px)";
      });
      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        lock.classList.remove("dragging");
        if (dy < -80) unlock();
        else if (Math.abs(dy) < 8) unlock(); // tap fallback
        else lock.style.transform = "";
        startY = null; dy = 0;
      };
      lock.addEventListener("pointerup", endDrag);
      lock.addEventListener("pointercancel", () => {
        dragging = false; lock.classList.remove("dragging");
        lock.style.transform = ""; startY = null; dy = 0;
      });
      const ub = $("#unlockBtn");
      if (ub) ub.addEventListener("click", (e) => { e.stopPropagation(); unlock(); });
      const lhb = $("#lockHomeBar");
      if (lhb) lhb.addEventListener("click", (e) => { e.stopPropagation(); unlock(); });
      document.addEventListener("keydown", (e) => {
        if (!unlocked && (e.key === "Enter" || e.key === " ")) unlock();
      });
    }
    const la = $("#lockAgain");
    if (la) la.addEventListener("click", relock);
    // Relock when backgrounded — real iPhone behavior. Game state persists underneath.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && unlocked) relock();
    });

    // app icons + widgets + dock
    $$("[data-app]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openApp(btn.getAttribute("data-app"));
      });
    });
    const ch = $("#chrome-home");
    if (ch) ch.addEventListener("click", goHome);

    // expose the settings renderer on the Views seam
    if (typeof Views !== "undefined") Views.renderSettings = renderSettings;
  }

  document.addEventListener("DOMContentLoaded", init);
  return { openApp, goHome, unlock, relock, refreshWidgets, renderSettings };
})();
