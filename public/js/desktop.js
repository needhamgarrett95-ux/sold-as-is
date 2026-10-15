/* Sold As-Is — PC desktop shell (pc-desktop branch).
 * Active only when ?pc=1 is present (the Electron build will set it).
 * View-layer only: hides the phone shell, renders a desktop (wallpaper,
 * icons, taskbar), and hosts the existing #browser inside a window.
 * Game logic, economy, saves, and dialogue are untouched.
 * The travel map will register in DESKTOP_APPS when it's ready — one line,
 * no rework. Nothing here ships to the live mobile build. */

const Desktop = (() => {
  const IS_PC = new URLSearchParams(location.search).has("pc");

  /* App registry. The travel map drops in here when ready:
   *   { id: "travel", label: "Road Trip", icon: "travel" },
   * and gets a desktop icon + taskbar entry for free. */
  const DESKTOP_APPS = [
    { id: "market",     label: "Sold As-Is",  icon: "market" },
    { id: "parts",      label: "Boneyard",    icon: "parts" },
    { id: "crate",      label: "Crate Fresh", icon: "crate" },
    { id: "garage",     label: "Garage",      icon: "garage" },
    { id: "collection", label: "Collection",  icon: "collection" },
    { id: "ledger",     label: "Ledger",      icon: "ledger" },
  ];

  const $ = (sel, root) => (root || document).querySelector(sel);
  let openAppId = null;

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstChild;
  }

  function tickClock() {
    const d = new Date();
    let h = d.getHours() % 12; if (h === 0) h = 12;
    const t = h + ":" + ("0" + d.getMinutes()).slice(-2);
    const ds = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
    const ct = $("#pc-clock-time"), cd = $("#pc-clock-date");
    if (ct) ct.textContent = t;
    if (cd) cd.textContent = ds;
  }

  function syncTaskbar() {
    document.querySelectorAll("#pc-taskbar .pc-tb-app").forEach(b => {
      b.classList.toggle("running", b.dataset.app === openAppId);
    });
  }

  function openApp(id) {
    const app = DESKTOP_APPS.find(a => a.id === id);
    if (!app) return;
    openAppId = id;
    // The travel map will render into its own container; the six game apps
    // reuse the existing view system untouched.
    if (id !== "travel") Views.show(id);
    const win = $("#pc-window");
    $("#pc-window-title").textContent = app.label;
    win.classList.remove("hidden");
    $("#pc-desktop").classList.add("app-open");
    syncTaskbar();
    if (typeof renderAppIcons === "function") renderAppIcons(win);
  }

  function closeToDesktop() {
    openAppId = null;
    $("#pc-window").classList.add("hidden");
    $("#pc-desktop").classList.remove("app-open");
    syncTaskbar();
  }

  function init() {
    if (!IS_PC) return;
    document.body.classList.add("pc-mode");

    const desktop = el(`
      <div id="pc-desktop">
        <div class="pc-wallpaper"></div>
        <div class="pc-brand"><h1>Sold As-Is</h1><p>Olympic Peninsula · Port Angeles, WA</p></div>
        <div class="pc-icons"></div>
        <div id="pc-window" class="hidden">
          <div id="pc-titlebar">
            <span id="pc-window-title">Sold As-Is</span>
            <button id="pc-close" aria-label="Close">✕</button>
          </div>
          <div id="pc-window-body"></div>
        </div>
        <div id="pc-taskbar">
          <div class="pc-tb-apps"></div>
          <div id="pc-clock"><span id="pc-clock-time"></span><span id="pc-clock-date"></span></div>
        </div>
      </div>`);
    document.body.appendChild(desktop);

    // Move the live game browser into the window. All view logic keeps
    // working — it's the same DOM, new frame.
    $("#pc-window-body").appendChild($("#browser"));

    const iconsWrap = $(".pc-icons", desktop);
    const tbWrap = $(".pc-tb-apps", desktop);
    DESKTOP_APPS.forEach(app => {
      const icon = el(`
        <button class="pc-icon" data-app="${app.id}">
          <span class="pc-tile"><span data-appicon="${app.icon}"></span></span>
          <span class="pc-label">${app.label}</span>
        </button>`);
      icon.addEventListener("click", () => openApp(app.id));
      iconsWrap.appendChild(icon);
      const tb = el(`<button class="pc-tb-app" data-app="${app.id}" title="${app.label}"><span data-appicon="${app.icon}"></span></button>`);
      tb.addEventListener("click", () => {
        if (openAppId === app.id) closeToDesktop();
        else openApp(app.id);
      });
      tbWrap.appendChild(tb);
    });

    $("#pc-close").addEventListener("click", closeToDesktop);

    // Keyboard: 1-6 jump to apps, Esc returns to desktop.
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && openAppId) { closeToDesktop(); return; }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= DESKTOP_APPS.length && !e.metaKey && !e.ctrlKey) {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        openApp(DESKTOP_APPS[n - 1].id);
      }
    });

    tickClock();
    setInterval(tickClock, 15000);
    if (typeof renderAppIcons === "function") renderAppIcons(desktop);
    syncTaskbar();
  }

  document.addEventListener("DOMContentLoaded", init);
  return { IS_PC, DESKTOP_APPS, openApp, closeToDesktop };
})();
