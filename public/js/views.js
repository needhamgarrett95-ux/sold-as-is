// Sold As-Is — garage & collection views
const SITES = {
  market:     { tab: "MotoMarket — Mopeds for sale", url: "motomarket.place/mopeds",     icon: "🏍" },
  parts:      { tab: "Boneyard — Moped parts",       url: "boneyard.place",              icon: "⚙️" },
  garage:     { tab: "MotoMarket — My Garage",       url: "motomarket.place/garage",     icon: "🔧" },
  collection: { tab: "MotoMarket — My Collection",   url: "motomarket.place/collection", icon: "🏆" },
};

const Views = {
  current: "market",
  partsShop: [],

  show(name) {
    this.current = name;
    Detail.close();
    document.querySelectorAll("#tabbar .tab").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name));
    // Update the fake browser chrome to match the "site" we're on
    const site = SITES[name];
    const tabEl = document.querySelector("#chrome .tab");
    if (tabEl) tabEl.innerHTML = `<span class="tab-icon">${site.icon}</span> ${site.tab}`;
    const urlEl = document.querySelector(".urlbar .url");
    if (urlEl) urlEl.textContent = site.url;
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

  renderParts() {
    if (!this.partsShop.length) this.partsShop = genPartsShop(12);
    const el = document.getElementById("parts-view");
    el.innerHTML = `<h2>Boneyard</h2>
      <div class="sub">Moped parts, sold as-is · tap to buy</div>
      <div class="parts-shop-grid">` +
      this.partsShop.map((p, i) => `
      <div class="shop-part state-${p.state}">
        <img src="${p.img}" alt="${p.partLabel}" loading="lazy">
        <div class="shop-part-name">${p.partLabel}</div>
        <div class="shop-part-fit">${p.bikeBrand} ${p.bikeModel}</div>
        <div class="shop-part-state">${p.stateLabel}</div>
        <div class="shop-part-buy">
          <span class="shop-part-price">${money(p.price)}</span>
          <button data-buy-part="${i}">Buy</button>
        </div>
      </div>`).join("") + `</div>`;
    el.querySelectorAll("[data-buy-part]").forEach(btn =>
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.buyPart(+btn.dataset.buyPart);
      }));
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
