// Sold As-Is — listing detail view
const Detail = {
  current: null,
  offer: null,

  open(id) {
    const l = Feed.listings.find(x => x.id === id);
    if (!l) return;
    this.current = l;
    this.offer = null;
    this.render();
    document.getElementById("detail").classList.remove("hidden");
    document.getElementById("feed").style.display = "none";
  },

  close() {
    document.getElementById("detail").classList.add("hidden");
    document.getElementById("feed").style.display = "";
    this.current = null;
  },

  // Haggle: offer a price, seller responds based on how reasonable it is
  haggle(pct) {
    const l = this.current;
    const offerPrice = Math.round(l.price * pct / 10) * 10;
    this.offer = offerPrice;
    const ratio = offerPrice / l.price;
    let response, accepted = false;
    if (ratio >= 0.95)      { response = `"${money(offerPrice)}? Yeah, I can do that."`; accepted = true; }
    else if (ratio >= 0.85) { response = `"Hmm... ${money(offerPrice)}. Alright, it's yours."`; accepted = true; }
    else if (ratio >= 0.75) { response = `"${money(offerPrice)}? Meet me at ${money(Math.round(l.price * 0.9 / 10) * 10)} and we got a deal."`; }
    else                    { response = `"${money(offerPrice)}?? No lowballs, bro."`; }
    this.haggleResponse = { response, accepted, price: accepted ? offerPrice : null };
    this.render();
  },

  buyNow() {
    const l = this.current;
    const price = (this.haggleResponse && this.haggleResponse.accepted)
      ? this.haggleResponse.price : l.price;
    if (!State.canAfford(price)) {
      this.notice = "Not enough cash for this one.";
      this.render();
      return;
    }
    State.buy({ ...l, price });
    Feed.remove(l.id);
    this.close();
    UI.refreshCash();
    UI.toast(`Bought the ${l.brand} ${l.model} for ${money(price)}`);
  },

  render() {
    const l = this.current;
    const el = document.getElementById("detail");
    const hr = this.haggleResponse;
    el.innerHTML = `
    <div class="detail-scroll">
      <button class="back-btn" id="d-back">← Back</button>
      <div class="d-photo photo-real big">
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}">
        <div class="photo-count">📷 ${l.photos}</div>
      </div>
      <div class="d-body">
        <div class="price-row">
          <span class="price big">${money(l.price)}</span>
          <span class="cond ${Feed.condClass(l.condition)}">${l.condition}</span>
        </div>
        <h2>${l.title}</h2>
        <div class="meta">${l.location} · ${l.miles} · Listed ${l.postedAgo}</div>
        <p class="desc">${l.description}</p>
        <div class="seller">
          <div class="avatar">${l.seller[0].toUpperCase()}</div>
          <div><strong>${l.seller}</strong><div class="meta">★ ${l.sellerRating} seller rating</div></div>
        </div>
        ${hr ? `<div class="haggle-resp">${hr.response}</div>` : ""}
        ${this.notice ? `<div class="notice">${this.notice}</div>` : ""}
        <div class="haggle-row">
          <span>Make an offer:</span>
          <button data-haggle="0.9">90%</button>
          <button data-haggle="0.8">80%</button>
          <button data-haggle="0.7">70%</button>
        </div>
        <button class="buy-btn" id="d-buy">
          ${(hr && hr.accepted) ? `Buy for ${money(hr.price)}` : `Buy now — ${money(l.price)}`}
        </button>
        <div class="as-is">Sold as-is. No warranties, no take-backs.</div>
      </div>
    </div>`;
    document.getElementById("d-back").onclick = () => this.close();
    document.getElementById("d-buy").onclick = () => this.buyNow();
    el.querySelectorAll("[data-haggle]").forEach(b =>
      b.onclick = () => this.haggle(+b.dataset.haggle));
  },
};

const UI = {
  refreshCash() {
    document.getElementById("cash").textContent = State.fmtCash();
  },
  toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2500);
  },
};
