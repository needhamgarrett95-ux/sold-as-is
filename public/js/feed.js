// Sold As-Is — marketplace feed
const Feed = {
  listings: [],
  nextId: 0,
  batchSize: 12,

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
      const batch = genListings(this.batchSize, this.nextId);
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
      <div class="photo" style="background:${this.photoColor(l.bikeId)}">
        <div class="photo-bike">${l.brand}<br><strong>${l.model}</strong></div>
        <div class="photo-count">📷 ${l.photos}</div>
      </div>
      <div class="card-body">
        <div class="price-row">
          <span class="price">${money(l.price)}</span>
          <span class="cond ${this.condClass(l.condition)}">${l.condition}</span>
        </div>
        <div class="title">${l.title}</div>
        <div class="meta">${l.location} · ${l.miles} · ${l.postedAgo}</div>
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
