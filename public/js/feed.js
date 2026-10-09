// Sold As-Is — marketplace feed
const Feed = {
  listings: [],
  nextId: 0,
  batchSize: 10, // 5 rows x 2 cols, locked

  init() {
    this.listings = genListings(this.batchSize, this.nextId);
    this.nextId += this.batchSize;
    this.render();
    // No infinite scroll — feed is locked to 5 rows, refresh for new batch
    // (auto dropFresh removed — it caused random layout breaks)
  },

  dropFresh() {
    const fresh = genListings(2, this.nextId);
    this.nextId += 2;
    fresh.forEach(l => l.fresh = true);
    this.listings.unshift(...fresh);
    this.render();
  },

  // Manual refresh — new batch, 3:30 cooldown
  COOLDOWN_S: 210,
  cooldownUntil: 0,
  cooldownTimer: null,

  refresh() {
    const now = Date.now();
    if (now < this.cooldownUntil) return;
    // Fresh random batch replaces current feed
    this.listings = genListings(this.batchSize, this.nextId);
    this.nextId += this.batchSize;
    this.listings.forEach(l => l.fresh = true);
    BG.clear();
    this.render();
    document.getElementById("feed").scrollTop = 0;
    this.cooldownUntil = now + this.COOLDOWN_S * 1000;
    this.tickCooldown();
    UI.toast("Marketplace refreshed — new listings");
  },

  tickCooldown() {
    const btn = document.getElementById("refresh-btn");
    clearInterval(this.cooldownTimer);
    const update = () => {
      const remain = Math.ceil((this.cooldownUntil - Date.now()) / 1000);
      if (remain <= 0) {
        clearInterval(this.cooldownTimer);
        btn.disabled = false;
        btn.classList.remove("cooling");
        btn.innerHTML = "↻";
        btn.title = "Refresh listings";
        return;
      }
      btn.disabled = true;
      btn.classList.add("cooling");
      const m = Math.floor(remain / 60), s = remain % 60;
      btn.textContent = `${m}:${String(s).padStart(2, "0")}`;
      btn.title = `Refresh available in ${m}:${String(s).padStart(2, "0")}`;
    };
    update();
    this.cooldownTimer = setInterval(update, 1000);
  },

  remove(id) {
    this.listings = this.listings.filter(l => l.id !== id);
    this.render();
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
    document.getElementById("feed").innerHTML =
      this.listings.map(l => this.card(l)).join("");
    document.querySelectorAll(".card").forEach(c =>
      c.addEventListener("click", () => Detail.open(+c.dataset.id)));
  },
};
