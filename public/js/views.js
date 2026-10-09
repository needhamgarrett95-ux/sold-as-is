// Sold As-Is — garage & collection views
const SITES = {
  market:     { tab: "Sold As-Is — Mopeds for sale", url: "soldasis.place/mopeds",     icon: "🏍" },
  parts:      { tab: "Boneyard — Moped parts",       url: "boneyard.place",              icon: "⚙️" },
  garage:     { tab: "Sold As-Is — My Garage",       url: "soldasis.place/garage",     icon: "🔧" },
  collection: { tab: "Sold As-Is — My Collection",   url: "soldasis.place/collection", icon: "🏆" },
};

const Views = {
  current: "market",
  partsShop: [],

  show(name) {
    this.current = name;
    Detail.close();
    document.querySelectorAll("#tabstrip .wtab").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name));
    // Update the URL bar to match the "site" we're on
    const site = SITES[name];
    const urlEl = document.querySelector(".urlbar .url");
    if (urlEl) urlEl.textContent = site.url;
    // Swap header logo for Boneyard (feels like a different site)
    const isBoneyard = name === "parts";
    document.getElementById("logo-main").classList.toggle("hidden", isBoneyard);
    document.getElementById("logo-boneyard").classList.toggle("hidden", !isBoneyard);
    document.getElementById("feed").style.display = name === "market" ? "" : "none";
    document.getElementById("cats").style.display = name === "market" ? "" : "none";
    document.getElementById("parts-view").classList.toggle("hidden", name !== "parts");
    document.getElementById("garage-view").classList.toggle("hidden", name !== "garage");
    document.getElementById("collection-view").classList.toggle("hidden", name !== "collection");
    if (name === "parts") this.renderParts();
    if (name === "garage") this.renderGarage();
    if (name === "collection") this.renderCollection();
    const n = document.getElementById("nav-garage-n");
    if (n) n.textContent = State.garage.length ? `${State.garage.length}` : "";
  },

  partsFilter: "all",

  renderParts() {
    if (!this.partsShop.length) this.partsShop = genPartsShop(16);
    const el = document.getElementById("parts-view");
    // Bike filter options
    const bikeOpts = [`<option value="all">All bikes</option>`].concat(
      BIKES.map(b => `<option value="${b.sprite}"${this.partsFilter === b.sprite ? " selected" : ""}>${b.brand} ${b.name}</option>`)
    ).join("");
    const shown = this.partsShop
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => this.partsFilter === "all" || p.bikeSprite === this.partsFilter);
    el.innerHTML = `
      <div class="eby-head">
        <div class="eby-title">🛵 Find parts that fit</div>
        <select id="parts-bike-filter" class="eby-filter">${bikeOpts}</select>
      </div>
      <div class="eby-list">` +
      (shown.length ? shown.map(p => `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${p.stateLabel}</div>
          <div class="eby-price-row">
            <span class="eby-price">${money(p.price)}</span>
            ${p.wasPrice ? `<span class="eby-was">${money(p.wasPrice)}</span>` : ""}
          </div>
          <div class="eby-meta">Buy It Now</div>
          <div class="eby-meta">Free delivery</div>
          <div class="eby-meta">${p.watchers} watchers</div>
          <button class="eby-buy" data-buy-part="${p.idx}">Buy It Now</button>
        </div>
      </div>`).join("")
      : `<div class="empty"><strong>No parts for this bike</strong>Try a different model.</div>`) +
      `</div>`;
    document.getElementById("parts-bike-filter").addEventListener("change", (e) => {
      this.partsFilter = e.target.value;
      this.renderParts();
    });
    el.querySelectorAll("[data-buy-part]").forEach(btn => {
      const buy = (e) => { e.preventDefault(); e.stopPropagation(); this.buyPart(+btn.dataset.buyPart); };
      btn.addEventListener("click", buy);
      let ty = 0, tx = 0;
      btn.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      btn.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) buy(e);
      }, { passive: false });
    });
  },

  buyPart(i) {
    const p = this.partsShop[i];
    if (!p) return;
    if (State.cash < p.price) {
      UI.toast("Not enough cash for that part");
      return;
    }
    State.cash -= p.price;
    State.parts = State.parts || [];
    State.parts.push(p);
    this.partsShop.splice(i, 1);
    UI.refreshCash();
    UI.toast(`${p.partLabel} (${p.bikeBrand} ${p.bikeModel}) bought`);
    this.renderParts();
  },

  renderGarage() {
    const el = document.getElementById("garage-view");
    if (!State.garage.length) {
      el.innerHTML = `<h2>Your Garage</h2><div class="sub">Bikes you own live here.</div>
        <div class="empty"><strong>Empty garage</strong>Hit the market and buy your first flip.</div>`;
      return;
    }
    el.innerHTML = `<h2>Your Garage</h2>
      <div class="sub">${State.garage.length} bike(s) · decide their fate</div>` +
      State.garage.map((b, i) => `
      <div class="g-item">
        <div class="g-top">
          <span class="g-name">${b.brand} ${b.model}</span>
          <span class="g-price">${money(b.boughtFor)}</span>
        </div>
        <div class="g-meta">${b.condition} · bought ${b.postedAgo} · fair value ~${money(b.fairValue)}</div>
        <div class="g-actions">
          <button class="btn-restore" data-act="restore" data-i="${i}">Restore</button>
          <button class="btn-strip" data-act="strip" data-i="${i}">Strip</button>
          <button class="btn-sell" data-act="sell" data-i="${i}">Sell</button>
          <button class="btn-keep" data-act="keep" data-i="${i}">Keep</button>
        </div>
      </div>`).join("");
    el.querySelectorAll("[data-act]").forEach(btn =>
      btn.addEventListener("click", () => this.garageAction(btn.dataset.act, +btn.dataset.i)));
  },

  garageAction(act, i) {
    const bike = State.garage[i];
    if (act === "keep") {
      bike.kept = true;
      UI.toast(`${bike.brand} ${bike.model} added to your collection`);
      this.renderGarage();
      const n = document.getElementById("nav-garage-n");
      if (n) n.textContent = State.garage.length ? `(${State.garage.length})` : "";
      return;
    }
    const labels = { restore: "Restoration shop", strip: "Part-out", sell: "Re-listing" };
    UI.toast(`${labels[act]} for the ${bike.brand} ${bike.model} — coming soon`);
  },

  renderCollection() {
    const el = document.getElementById("collection-view");
    const kept = State.garage.filter(b => b.kept);
    const sets = Object.entries(BRANDS).map(([brand, { models }]) => {
      const owned = models.filter(m =>
        kept.some(k => k.brand === brand && k.model === m.name));
      return { brand, total: models.length, owned: owned.length };
    });
    el.innerHTML = `<h2>Collection Wall</h2>
      <div class="sub">${kept.length} of ${BIKES.length} bikes collected</div>` +
      (kept.length === 0
        ? `<div class="empty"><strong>No keepers yet</strong>Hit "Keep" on a bike in your garage to add it to the wall.</div>`
        : "") +
      sets.map(s => `
      <div class="set-row">
        <div class="set-name">${s.brand} — ${s.owned}/${s.total}</div>
        <div class="set-slots">${Array.from({ length: s.total }, (_, i) =>
          `<div class="slot ${i < s.owned ? "filled" : ""}">${i < s.owned ? "✓" : "?"}</div>`).join("")}
        </div>
      </div>`).join("");
  },
};
