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
    <article class="card" data-id="${l.id}" style="position:relative;background:transparent;border:none;overflow:visible;">
      <div class="photo photo-real" style="border-radius:8px;">
        ${l.fresh ? '<div class="fresh-tag" style="position:absolute;top:8px;left:8px;z-index:2;background:rgba(255,255,255,.95);color:#1a1a1a;font-size:.68rem;font-weight:600;padding:4px 10px;border-radius:6px;">Just listed</div>' : ""}
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" loading="lazy" draggable="false" style="${Feed.spriteNudge[l.sprite] ? `margin-top:${6 + Feed.spriteNudge[l.sprite]}px;` : ""}">
        <div style="position:absolute;right:8px;bottom:8px;background:rgba(255,255,255,.92);color:#333;font-weight:700;font-size:.64rem;padding:3px 8px;border-radius:20px;">${l.condition}</div>
      </div>
      <div style="display:block;padding:6px 2px 0;background:transparent;">
        <div style="font-size:.92rem;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong>${money(l.price)}</strong> &middot; ${l.brand} ${l.model}</div>
        <div style="font-size:.74rem;color:#777;margin-top:1px;">${l.location}</div>
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
