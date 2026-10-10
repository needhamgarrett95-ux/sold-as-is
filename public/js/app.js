// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  // Debug/testing: ?godmode=1 unlocks all perks + max cash
  if (new URLSearchParams(location.search).get("godmode") === "1") {
    State.cash = 999999;
    if (typeof Skills !== "undefined") {
      Skills.pointsEarned = 99;
      Skills.unlocked = { gearhead: 3, smoothtalker: 3, browserext: 3 };
      Save.save();
    }
    UI.refreshCash();
  }
  // Activity bell
  const bell = document.getElementById("activity-bell");
  if (bell) {
    bell.addEventListener("click", (e) => {
      e.stopPropagation();
      UI.showActivity();
    });
    document.addEventListener("click", (e) => {
      const popup = document.getElementById("activity-popup");
      if (popup && !popup.classList.contains("hidden") && !popup.contains(e.target) && !e.target.closest("#activity-bell")) {
        popup.classList.add("hidden");
      }
    });
  }
  // Settings menu
  const cog = document.getElementById("settings-cog");
  const menu = document.getElementById("settings-menu");
  if (cog && menu) {
    cog.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("hidden") && !menu.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });

    document.getElementById("settings-reset")?.addEventListener("click", () => {
      if (confirm("Start over? This wipes your garage, parts, cash, and skills.")) {
        localStorage.removeItem("soldasis_save_v1");
        location.reload();
      }
    });
  }
  // Audio: music player + SFX
  if (typeof AudioEngine !== "undefined") {
    AudioEngine.init();
    AudioEngine.renderPlayer();
    // Touch tap on all webpage UI interactions (not nav tabs, music, or login)
    // Catches buttons, listing cards, part cells, and other tappable divs
    const shouldTap = (el) => {
      if (!el) return false;
      // Skip nav tabs
      if (el.closest(".wtab")) return false;
      // Skip music popup, login, music note
      if (el.closest("#music-popup") || el.id === "login-btn" || el.id === "music-note") return false;
      // Skip the tab bar container itself
      if (el.closest("#wtab-bar") || el.closest(".tab-bar")) return false;
      // Play for buttons and tappable elements
      return el.closest("button") ||
             el.closest("[data-pick-slot]") ||
             el.closest("[data-inspect-part]") ||
             el.closest("[data-roller-part]") ||
             el.closest(".listing-card") ||
             el.closest(".feed-card") ||
             el.closest("[data-listing]") ||
             el.closest("a");
    };
    document.addEventListener("touchstart", (e) => {
      if (shouldTap(e.target)) AudioEngine.playTouch();
    }, { passive: true, capture: true });
    // Fallback for non-touch (desktop) — avoid double-fire from touch
    document.addEventListener("click", (e) => {
      if (e.detail === 0) return; // already handled by touchstart
      if (shouldTap(e.target)) AudioEngine.playTouch();
    }, true);
  }
  // Hydrate custom icons
  Icon.hydrate();
  // Load saved progress (after Views is defined)
  const hadSave = Save.load();
  Feed.init();
  UI.refreshCash();

  Views.initPartsFilter();
  // Auto-save every 30s and when app goes to background
  setInterval(() => Save.save(), 30000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") Save.save();
  });
  // Clickable logos: reset to default view of each section
  document.getElementById("logo-main").addEventListener("click", () => {
    Views.marketTab = "browse";
    Views.show("market");
  });
  document.getElementById("logo-boneyard").addEventListener("click", () => {
    Views.boneyardTab = "buy";
    Views.show("parts");
  });
  // URL bar refresh button: market uses cooldown refresh, others reload their view
  const refreshBtn = document.getElementById("refresh-btn");
  const doRefresh = (e) => {
    if (e) e.preventDefault();
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") Views.refreshParts();
    else Views.show(Views.current);
  };
  refreshBtn.addEventListener("click", doRefresh);
  // iOS: only refresh on tap, not scroll
  let rty = 0, rtx = 0;
  refreshBtn.addEventListener("touchstart", (e) => {
    rty = e.touches[0].clientY; rtx = e.touches[0].clientX;
  }, { passive: true });
  refreshBtn.addEventListener("touchend", (e) => {
    const dy = Math.abs(e.changedTouches[0].clientY - rty);
    const dx = Math.abs(e.changedTouches[0].clientX - rtx);
    if (dy < 10 && dx < 10) doRefresh(e);
  }, { passive: false });
  document.querySelectorAll("#tabstrip .wtab").forEach(b => {
    const go = (e) => { if (e) e.preventDefault(); Views.show(b.dataset.view); };
    b.addEventListener("click", go);
    // iOS: only navigate on tap, not scroll
    let ty = 0, tx = 0;
    b.addEventListener("touchstart", (e) => {
      ty = e.touches[0].clientY; tx = e.touches[0].clientX;
    }, { passive: true });
    b.addEventListener("touchend", (e) => {
      const dy = Math.abs(e.changedTouches[0].clientY - ty);
      const dx = Math.abs(e.changedTouches[0].clientX - tx);
      if (dy < 10 && dx < 10) go(e);
    }, { passive: false });
  });
  document.querySelectorAll("#cats a").forEach(c =>
    c.addEventListener("click", () => {
      document.querySelectorAll("#cats a").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
      Feed.setFilter(c.dataset.filter);
    }));
  // Market search
  document.getElementById("market-search").addEventListener("input", (e) => {
    Feed.setSearch(e.target.value);
  });
  console.log("Sold As-Is: marketplace feed live.");
});
