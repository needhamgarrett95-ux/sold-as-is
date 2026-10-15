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

  /* ---------- wallpapers ---------- */
  const WALLPAPERS = [
    { id: "midnight",  label: "Midnight" },
    { id: "paper",     label: "Paper" },
    { id: "sunset",    label: "Sunset" },
    { id: "evergreen", label: "Evergreen" },
    { id: "harbor",    label: "Harbor" },
  ];
  const WP_KEY = "soldasis_pc_wallpaper";
  const WP_CUSTOM_KEY = "soldasis_pc_wallpaper_custom";
  const WP_FIT_KEY = "soldasis_pc_wallpaper_fit";
  const WP_FITS = [["cover", "Fill"], ["contain", "Fit"], ["100% 100%", "Stretch"], ["auto", "Center"]];
  function currentWallpaper() {
    try {
      const id = localStorage.getItem(WP_KEY);
      if (id === "custom" && localStorage.getItem(WP_CUSTOM_KEY)) return id;
      if (WALLPAPERS.some(w => w.id === id)) return id;
    } catch (e) {}
    return "midnight";
  }
  function currentFit() {
    try {
      const f = localStorage.getItem(WP_FIT_KEY);
      if (WP_FITS.some(([v]) => v === f)) return f;
    } catch (e) {}
    return "cover";
  }
  function applyWallpaper(id) {
    const wp = $("#pc-desktop .pc-wallpaper");
    if (!wp) return;
    WALLPAPERS.forEach(w => wp.classList.remove("wp-" + w.id));
    wp.style.backgroundImage = "";
    wp.style.backgroundSize = "";
    wp.style.backgroundPosition = "";
    wp.style.backgroundRepeat = "";
    if (id === "custom") {
      let data = null;
      try { data = localStorage.getItem(WP_CUSTOM_KEY); } catch (e) {}
      if (!data) id = "midnight";
      else {
        const fit = currentFit();
        wp.style.backgroundImage = `url("${data}")`;
        wp.style.backgroundSize = fit;
        wp.style.backgroundPosition = "center";
        wp.style.backgroundRepeat = "no-repeat";
        wp.style.backgroundColor = "#101318";
      }
    }
    if (id !== "custom") wp.classList.add("wp-" + id);
    try { localStorage.setItem(WP_KEY, id); } catch (e) {}
    document.querySelectorAll(".pc-wp-thumb").forEach(t => {
      t.classList.toggle("selected", t.dataset.wp === id);
    });
    const fit = currentFit();
    document.querySelectorAll(".pc-pp-fit button").forEach(b => {
      b.classList.toggle("selected", b.dataset.fit === fit);
    });
  }
  function setFit(fit) {
    try { localStorage.setItem(WP_FIT_KEY, fit); } catch (e) {}
    if (currentWallpaper() === "custom") applyWallpaper("custom");
    else {
      document.querySelectorAll(".pc-pp-fit button").forEach(b => {
        b.classList.toggle("selected", b.dataset.fit === fit);
      });
    }
  }
  // Downscale uploads so they fit in localStorage (~5MB): max 1920px, JPEG.
  function handleWallpaperFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const max = 1920;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      try {
        localStorage.setItem(WP_CUSTOM_KEY, c.toDataURL("image/jpeg", 0.85));
        applyWallpaper("custom");
      } catch (e) {
        // quota: keep the current wallpaper, selection stays
      }
    };
    img.src = url;
  }

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
        <div class="pc-widget">
          <span class="pc-widget-icon"><span data-appicon="market"></span></span>
          <div class="pc-widget-text"><h1>Sold As-Is</h1><p>Olympic Peninsula · Port Angeles, WA</p></div>
        </div>
        <div class="pc-icons"></div>
        <div id="pc-window" class="hidden">
          <div id="pc-titlebar">
            <span id="pc-window-title">Sold As-Is</span>
            <button id="pc-close" aria-label="Close">✕</button>
          </div>
          <div id="pc-window-body"></div>
        </div>
        <div id="pc-context" class="hidden">
          <button id="pc-personalize">Personalize</button>
        </div>
        <div id="pc-personalize-panel" class="hidden">
          <div class="pc-pp-head"><span>Background</span><button id="pc-pp-close" aria-label="Close">✕</button></div>
          <div class="pc-pp-grid"></div>
          <div class="pc-pp-fit"></div>
          <div class="pc-pp-note">Custom images stay on this PC.</div>
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
    // Reveal the game UI now that it's framed (was hidden pre-paint).
    document.documentElement.classList.add("pc-ready");

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

    // Right-click personalize: wallpaper picker. Suppress the native menu
    // on the desktop surface only (never inside app windows).
    const ctxMenu = $("#pc-context");
    const ppPanel = $("#pc-personalize-panel");
    const ppGrid = $(".pc-pp-grid", desktop);
    WALLPAPERS.forEach(w => {
      const t = el(`<button class="pc-wp-thumb wp-${w.id}" data-wp="${w.id}" title="${w.label}"><span>${w.label}</span></button>`);
      t.addEventListener("click", () => applyWallpaper(w.id));
      ppGrid.appendChild(t);
    });
    // Custom upload tile
    const upTile = el(`<button class="pc-wp-thumb wp-upload" data-wp="custom" title="Upload your own"><span>+ Upload</span></button>`);
    const fileInput = el(`<input id="pc-wallpaper-file" type="file" accept="image/*" style="display:none">`);
    fileInput.addEventListener("change", () => {
      handleWallpaperFile(fileInput.files[0]);
      fileInput.value = "";
    });
    desktop.appendChild(fileInput);
    upTile.addEventListener("click", () => fileInput.click());
    ppGrid.appendChild(upTile);
    // Fit options
    const fitRow = $(".pc-pp-fit", desktop);
    WP_FITS.forEach(([value, label]) => {
      const b = el(`<button data-fit="${value}">${label}</button>`);
      b.addEventListener("click", () => setFit(value));
      fitRow.appendChild(b);
    });
    desktop.addEventListener("contextmenu", (e) => {
      if (e.target.closest("#pc-window") || e.target.closest("#pc-taskbar") || e.target.closest(".pc-icon")) return;
      e.preventDefault();
      ppPanel.classList.add("hidden");
      ctxMenu.classList.remove("hidden");
      const r = desktop.getBoundingClientRect();
      ctxMenu.style.left = Math.min(e.clientX - r.left, r.width - 180) + "px";
      ctxMenu.style.top = Math.min(e.clientY - r.top, r.height - 120) + "px";
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest("#pc-context")) ctxMenu.classList.add("hidden");
    });
    $("#pc-personalize").addEventListener("click", () => {
      ctxMenu.classList.add("hidden");
      ppPanel.classList.remove("hidden");
    });
    $("#pc-pp-close").addEventListener("click", () => ppPanel.classList.add("hidden"));

    applyWallpaper(currentWallpaper());

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
