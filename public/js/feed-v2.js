// Sold As-Is — marketplace feed
const Feed = {
  listings: [],
  nextId: 0,
  batchSize: 8,

  init() {
    this.listings = genListings(this.batchSize, this.nextId);
    this.nextId += this.batchSize;
    this.render();
    const feed = document.getElementById("feed");
    feed.addEventListener("scroll", () => {
      if (feed.scrollTop + feed.clientHeight > feed.scrollHeight - 600) this.more();
    });
    // Fresh listings drop periodically
    setInterval(() => this.dropFresh(), 45000);
  },

  more() {
    if (this._loading) return;
    this._loading = true;
    setTimeout(() => {
      const lastBike = this.listings.length ? this.listings[this.listings.length - 1].bikeId : null;
      const batch = genListings(this.batchSize, this.nextId, lastBike);
      this.nextId += this.batchSize;
      this.listings.push(...batch);
      this.render();
      this._loading = false;
    }, 300);
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

  card(l) {
    return `
    <article class="card" data-id="${l.id}">
      ${l.fresh ? '<div class="fresh-tag">NEW</div>' : ""}
      <div class="photo photo-real">
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" loading="lazy" draggable="false">
      </div>
      <div class="card-body" style="display:block;padding:8px 10px 10px;background:#ffffff;min-height:66px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
          <span style="font-size:1.02rem;font-weight:800;color:#1a1a1a;">${money(l.price)}</span>
          <span class="cond ${Feed.condClass(l.condition)}" style="font-size:.62rem;font-weight:700;padding:3px 8px;border-radius:20px;">${l.condition}</span>
        </div>
        <div style="font-size:.82rem;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.brand} ${l.model}</div>
        <div style="font-size:.72rem;color:#888888;margin-top:2px;">${l.location}</div>
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
