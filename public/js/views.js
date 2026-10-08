// Sold As-Is — garage & collection views
const Views = {
  current: "market",

  show(name) {
    this.current = name;
    document.querySelectorAll(".mnav").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name));
    document.getElementById("feed").style.display = name === "market" ? "" : "none";
    document.getElementById("cats").style.display = name === "market" ? "" : "none";
    document.getElementById("garage-view").classList.toggle("hidden", name !== "garage");
    document.getElementById("collection-view").classList.toggle("hidden", name !== "collection");
    if (name !== "market") Detail.close();
    if (name === "garage") this.renderGarage();
    if (name === "collection") this.renderCollection();
    const n = document.getElementById("nav-garage-n");
    if (n) n.textContent = State.garage.length ? `(${State.garage.length})` : "";
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
