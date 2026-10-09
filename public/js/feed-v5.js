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

  // Per-sprite vertical nudge (px, negative = up) for sprites that sit low
  spriteNudge: {
    "yamaha_qt50": -4,
    "honda_dio": -4,
    "yamaha_zuma-prebug": -4,
  },

  card(l) {
    return `
    <article class="card" data-id="${l.id}" style="position:relative;background:#fff;border:1px solid #e0d8c8;border-radius:10px;overflow:hidden;">
      ${l.fresh ? '<div class="fresh-tag">NEW</div>' : ""}
      <div class="photo photo-real">
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" loading="lazy" draggable="false" style="${Feed.spriteNudge[l.sprite] ? `margin-top:${6 + Feed.spriteNudge[l.sprite]}px;` : ""}">
        <div style="position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.65);color:#fff;font-weight:800;font-size:1rem;padding:4px 10px;border-radius:6px;">${money(l.price)}</div>
        <div style="position:absolute;right:8px;bottom:8px;background:rgba(255,255,255,.92);color:#333;font-weight:700;font-size:.66rem;padding:4px 8px;border-radius:20px;">${l.condition}</div>
      </div>
      <div style="display:block;padding:7px 10px 9px;background:#ffffff;">
        <div style="font-size:.82rem;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${l.brand} ${l.model}</div>
        <div style="font-size:.7rem;color:#888;margin-top:1px;">${l.location}</div>
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
