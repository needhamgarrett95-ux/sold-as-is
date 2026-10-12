// Sold As-Is — app entry point
document.addEventListener("DOMContentLoaded", () => {
  // Migrate: Assemble removed — move any rollers back to garage
  try {
    if (State.rollers && State.rollers.length) {
      State.garage = State.garage || [];
      State.rollers.forEach(r => {
        // Convert roller back to garage bike
        State.garage.push(r);
      });
      State.rollers = [];
      Save.save();
    }
  } catch (e) {}
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
      document.getElementById("music-popup")?.classList.add("hidden");
      document.getElementById("settings-menu")?.classList.add("hidden");
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
      document.getElementById("music-popup")?.classList.add("hidden");
      document.getElementById("activity-popup")?.classList.add("hidden");
      menu.classList.toggle("hidden");
    });
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("hidden") && !menu.contains(e.target)) {
        menu.classList.add("hidden");
      }
    });

    // Dark mode toggle
    const darkToggle = document.getElementById("settings-darkmode");
    const darkSub = document.getElementById("darkmode-sub");
    const applyDark = (on) => {
      document.body.classList.toggle("dark-mode", on);
      if (darkSub) darkSub.textContent = on ? "on" : "off";
      try { localStorage.setItem("soldasis_darkmode", on ? "1" : "0"); } catch (e) {}
    };
    try {
      if (localStorage.getItem("soldasis_darkmode") === "1") applyDark(true);
    } catch (e) {}
    darkToggle?.addEventListener("click", () => {
      applyDark(!document.body.classList.contains("dark-mode"));
    });

    document.getElementById("settings-reset")?.addEventListener("click", () => {
      // Custom confirmation modal (no system dialog)
      const existing = document.getElementById("reset-confirm");
      if (existing) existing.remove();
      const html = `
      <div class="modal-overlay" id="reset-confirm">
        <div class="modal-box">
          <div class="modal-title">Start Over?</div>
          <div class="modal-desc">This wipes your garage, parts, cash, and skills. There's no going back.</div>
          <div class="modal-actions">
            <button class="modal-btn cancel" id="reset-cancel">Keep Playing</button>
            <button class="modal-btn go" id="reset-go" style="background:#999;border-color:#999;">Wipe It</button>
          </div>
        </div>
      </div>`;
      document.body.insertAdjacentHTML("beforeend", html);
      document.getElementById("reset-cancel").addEventListener("click", () => {
        document.getElementById("reset-confirm").remove();
      });
      document.getElementById("reset-confirm").addEventListener("click", (e) => {
        if (e.target.id === "reset-confirm") document.getElementById("reset-confirm").remove();
      });
      document.getElementById("reset-go").addEventListener("click", () => {
        localStorage.removeItem("soldasis_save_v1");
        localStorage.removeItem("soldasis_save_v1_bak");
        location.reload();
      });
    });

    // Backup save — download everything that matters as one JSON file
    document.getElementById("settings-backup")?.addEventListener("click", () => {
      const keys = ["soldasis_save_v1", "soldasis_activity", "soldasis_milestones", "soldasis_tutorial_done", "soldasis_audio", "soldasis_darkmode"];
      const bundle = { app: "sold-as-is", v: 1, exportedAt: new Date().toISOString(), keys: {} };
      for (const k of keys) {
        try { bundle.keys[k] = localStorage.getItem(k); } catch (e) {}
      }
      const blob = new Blob([JSON.stringify(bundle)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "sold-as-is-save-backup.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    });

    // Restore backup — validate the file first, confirm in the game's own modal,
    // and only then swap the save in (a bad file changes nothing)
    const restoreInput = document.getElementById("restore-file");
    document.getElementById("settings-restore")?.addEventListener("click", () => restoreInput?.click());
    restoreInput?.addEventListener("change", () => {
      const file = restoreInput.files && restoreInput.files[0];
      restoreInput.value = "";
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        let bundle = null;
        try { bundle = JSON.parse(reader.result); } catch (e) {}
        const saveRaw = bundle && bundle.keys ? bundle.keys["soldasis_save_v1"] : null;
        let saveOk = false;
        try {
          const s = saveRaw ? JSON.parse(saveRaw) : null;
          saveOk = !!(bundle && bundle.app === "sold-as-is" && bundle.v === 1 && s && typeof s.cash === "number" && Array.isArray(s.garage));
        } catch (e) {}
        document.getElementById("restore-confirm")?.remove();
        const when = bundle && bundle.exportedAt ? new Date(bundle.exportedAt).toLocaleDateString() : "an earlier session";
        const html = saveOk ? `
      <div class="modal-overlay" id="restore-confirm">
        <div class="modal-box">
          <div class="modal-title">Restore Backup?</div>
          <div class="modal-desc">This replaces your current game with the backup from ${when}. Current progress will be overwritten.</div>
          <div class="modal-actions">
            <button class="modal-btn cancel" id="restore-cancel">Keep Current Game</button>
            <button class="modal-btn go" id="restore-go">Restore</button>
          </div>
        </div>
      </div>` : `
      <div class="modal-overlay" id="restore-confirm">
        <div class="modal-box">
          <div class="modal-title">That File Won't Work</div>
          <div class="modal-desc">It isn't a Sold As-Is backup, or it's damaged. Your current game is untouched.</div>
          <div class="modal-actions">
            <button class="modal-btn cancel" id="restore-cancel">OK</button>
          </div>
        </div>
      </div>`;
        document.body.insertAdjacentHTML("beforeend", html);
        document.getElementById("restore-cancel").addEventListener("click", () => {
          document.getElementById("restore-confirm").remove();
        });
        document.getElementById("restore-confirm").addEventListener("click", (e) => {
          if (e.target.id === "restore-confirm") document.getElementById("restore-confirm").remove();
        });
        const go = document.getElementById("restore-go");
        if (go) go.addEventListener("click", () => {
          for (const [k, v] of Object.entries(bundle.keys)) {
            try {
              if (v === null || v === undefined) localStorage.removeItem(k);
              else localStorage.setItem(k, v);
            } catch (e) {}
          }
          location.reload();
        });
      };
      reader.readAsText(file);
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
  document.getElementById("logo-crate").addEventListener("click", () => {
    Views.show("crate");
  });
  // URL bar refresh button: market uses cooldown refresh, others reload their view
  const refreshBtn = document.getElementById("refresh-btn");
  const doRefresh = (e) => {
    if (e) e.preventDefault();
    if (Views.current === "market") Feed.refresh();
    else if (Views.current === "parts") Views.refreshParts();
    else if (Views.current === "crate") Views.refreshCrate();
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
  // Market search (with custom QWERTY keyboard)
  const msInput = document.getElementById("market-search");
  if (msInput && typeof GameQWERTY !== "undefined") GameQWERTY.attach(msInput, null);
  msInput.addEventListener("input", (e) => {
    Feed.setSearch(e.target.value);
  });
  console.log("Sold As-Is: marketplace feed live.");
});
