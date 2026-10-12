// Sold As-Is — marketplace feed
const Feed = {
  listings: [],
  nextId: 0,
  blockedIds: new Set(),
  batchSize: 16, // 8 rows x 2 cols, locked
  filter: "all",
  search: "",
  bikeFilter: null, // "Search by moped" dropdown (sprite key, null = all)

  init() {
    this.blockedIds = new Set();
    // Restore cooldown from previous session
    try {
      const saved = parseInt(localStorage.getItem(this.COOLDOWN_KEY) || "0", 10);
      if (saved > Date.now()) {
        this.cooldownUntil = saved;
        // Start the visual timer after DOM is ready
        setTimeout(() => this.tickCooldown(), 100);
      }
    } catch (e) {}
    this.listings = genListings(this.batchSize, this.nextId);
    this.nextId += this.batchSize;
    this.render();
    // No infinite scroll — feed is locked to 8 rows, refresh for new batch
    // (auto dropFresh removed — it caused random layout breaks)
  },

  // Filter predicates for the category tabs
  matchesFilter(l) {
    // Category filter
    let ok = true;
    switch (this.filter) {
      case "under500": ok = l.price < 500; break;
      case "runners": ok = ["Mint", "Clean", "Good", "Fair"].includes(l.condition); break;
      case "projects": ok = ["Rough", "Non-runner", "Parts bike"].includes(l.condition); break;
    }
    if (!ok) return false;
    // Search-by-moped dropdown
    if (this.bikeFilter && l.sprite !== this.bikeFilter) return false;
    // Text search
    if (this.search) {
      const q = this.search.toLowerCase();
      const hay = `${l.brand} ${l.model} ${l.condition} ${l.location} ${l.title || ""}`.toLowerCase();
      return hay.includes(q);
    }
    return true;
  },

  setFilter(f) {
    this.filter = f;
    this.render();
  },

  setSearch(q) {
    this.search = q.trim();
    this.render();
  },

  // Manual refresh — new batch, 3:30 cooldown
  COOLDOWN_S: 210,
  cooldownUntil: 0,
  cooldownTimer: null,
  COOLDOWN_KEY: "soldasis_market_cooldown",

  refresh() {
    const now = Date.now();
    if (now < this.cooldownUntil) {
      const remain = Math.ceil((this.cooldownUntil - now) / 1000);
      const m = Math.floor(remain / 60), s = remain % 60;
      return;
    }
    // Fresh batch = clear blocked IDs (they were for the old batch)
    this.blockedIds = new Set();
    // Fresh random batch replaces current feed
    this.listings = genListings(this.batchSize, this.nextId);
    this.nextId += this.batchSize;
    this.listings.forEach(l => l.fresh = true);
    this.render();
    document.getElementById("feed").scrollTop = 0;
    this.cooldownUntil = now + this.COOLDOWN_S * 1000;
    try { localStorage.setItem(this.COOLDOWN_KEY, String(this.cooldownUntil)); } catch (e) {}
    this.tickCooldown();
  },

  tickCooldown() {
    // The refresh button is rendered by Views' single display driver, which
    // shows only the current tab's timer — this just asks it to re-render
    if (typeof Views !== "undefined" && Views.updateRefreshBtn) Views.updateRefreshBtn();
  },

  remove(id) {
    this.listings = this.listings.filter(l => l.id !== id);
    this.render();
  },


  // Seller blocked the player — yank the listing and drop in a fresh one
  replaceBlocked(id) {
    // Mark as blocked first (survives render races)
    this.blockedIds.add(id);
    try {
      this.listings = this.listings.filter(l => l.id !== id);
      const fresh = genListings(1, this.nextId, null, { exclude: this.listings.map(l => l.sprite), tick: false });
      this.nextId += 1;
      this.listings.push(...fresh);
      this.render();
    } catch (e) {
      // Retry once after a beat (first-run race with data loading)
      setTimeout(() => {
        try {
          this.listings = this.listings.filter(l => l.id !== id);
          const fresh = genListings(1, this.nextId, null, { exclude: this.listings.map(l => l.sprite), tick: false });
          this.nextId += 1;
          this.listings.push(...fresh);
          this.render();
        } catch (e2) {}
      }, 500);
    }
  },

  photoColor(bikeId) {
    // deterministic hue per bike
    let h = 0;
    for (const c of bikeId) h = (h * 31 + c.charCodeAt(0)) % 360;
    return `linear-gradient(135deg, hsl(${h},45%,22%), hsl(${(h + 40) % 360},50%,12%))`;
  },

  condClass(cond) {
    return "cond-" + cond.toLowerCase().replace(/[^a-z]/g, "");
  },

  // Sprites that sit low in their frame and need a nudge up
  spriteNudge: new Set(["yamaha_qt50", "honda_dio", "yamaha_zuma-prebug"]),

  card(l) {
    const nudgeClass = Feed.spriteNudge.has(l.sprite) ? ' class="nudged"' : '';
    return `
    <article class="card" data-id="${l.id}">
      <div class="photo">
        ${l.fresh ? '<div class="just-listed">Just listed</div>' : ""}
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" loading="lazy" draggable="false"${nudgeClass}>
        <div class="card-cond">${l.condition}</div>
      </div>
      <div class="card-info">
        <div class="card-price-name"><strong>${money(l.price)}</strong> &middot; ${l.brand} ${l.model}</div>
        <div class="card-loc">${l.location}</div>
      </div>
    </article>`;
  },

  render() {
    const shown = this.listings.filter(l => !this.blockedIds.has(l.id) && this.matchesFilter(l));
    const feed = document.getElementById("feed");
    // Clear first + force reflow to prevent iOS ghost rendering
    feed.innerHTML = "";
    void feed.offsetHeight;
    feed.innerHTML =
      shown.length ? shown.map(l => this.card(l)).join("")
        : `<div class="empty"><strong>No matches</strong>Try a different category or refresh for new listings.</div>`;
    document.querySelectorAll(".card").forEach(c => {
      const open = (e) => { e.preventDefault(); Detail.open(+c.dataset.id); };
      c.addEventListener("click", open);
      // iOS touch: only open on tap, not on scroll (track finger movement)
      let touchY = 0, touchX = 0;
      c.addEventListener("touchstart", (e) => {
        touchY = e.touches[0].clientY;
        touchX = e.touches[0].clientX;
      }, { passive: true });
      c.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - touchY);
        const dx = Math.abs(e.changedTouches[0].clientX - touchX);
        if (dy < 10 && dx < 10) open(e);
      }, { passive: false });
    });
  },
};
