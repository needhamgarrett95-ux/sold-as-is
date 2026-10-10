// Sold As-Is — listing detail view
const Detail = {
  current: null,
  offer: null,

  open(id) {
    const l = Feed.listings.find(x => x.id === id);
    if (!l) return;
    this.current = l;
    this.offer = null;
    this.thread = [];
    this.haggleResponse = null;
    this.blocked = false;
    this.retryUsed = false;
    this.notice = null;
    this.render();
    document.getElementById("detail").classList.remove("hidden");
    document.getElementById("feed").style.display = "none";
  },

  close() {
    document.getElementById("detail").classList.add("hidden");
    document.getElementById("feed").style.display = "";
    this.current = null;
  },

  // Haggle: player sends a numeric offer, seller responds intelligently
  // Returns { response, accepted, price } — price is the buyable amount
  sendOffer(rawInput) {
    const l = this.current;
    // Numerals only
    const digits = String(rawInput).replace(/[^0-9]/g, "");
    if (!digits) {
      this.haggleResponse = { response: `"Send me a number and we'll talk."`, accepted: false, price: null };
      this.render();
      return;
    }
    const offerPrice = parseInt(digits, 10);
    if (offerPrice <= 0) {
      this.haggleResponse = { response: `"Very funny."`, accepted: false, price: null };
      this.render();
      return;
    }
    // Already blocked? Seller wants nothing to do with you.
    if (this.blocked) {
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: `"I'm not selling to you. Piss off."` });
      this.render();
      return;
    }
    // Bad faith: trying to go lower AFTER a deal was on the table
    const agreedPrice = this.haggleResponse && this.haggleResponse.price;
    if (agreedPrice && offerPrice < agreedPrice) {
      const angry = [
        `"Are you fucking kidding me? We HAD a deal at ${money(agreedPrice)}."`,
        `"Nah. Fuck this. You had ${money(agreedPrice)} and you got greedy. Deal's dead."`,
        `"Trying to renegotiate down AFTER we agreed? Hell no. I'm done with you."`,
      ];
      this.thread = this.thread || [];
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: angry[(Math.random() * angry.length) | 0] });
      this.blocked = true;
      this.haggleResponse = { response: null, accepted: false, price: null };
      this.render();
      return;
    }
    this.offer = offerPrice;
    // Smooth Talker: discount boosts effective offer ratio
    const stDiscount = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    const effectiveOffer = offerPrice * (1 + stDiscount);
    const ratio = effectiveOffer / l.price;
    let response, accepted = false, price = null;

    if (ratio >= 0.95) {
      response = `"${money(offerPrice)}? Yeah, I can do that."`;
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.85) {
      response = `"Hmm... ${money(offerPrice)}. Alright, it's yours."`;
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.70) {
      // Counter: meet in the middle, rounded to nearest $10 (Smooth Talker discount applied)
      const counter = Math.round(((offerPrice + l.price) / 2) * (1 - stDiscount) / 10) * 10;
      response = `"${money(offerPrice)}? I could do ${money(counter)}. Meet me there and it's yours."`;
      price = counter; // buy button updates to counter
    } else if (ratio >= 0.50) {
      // Firm counter at 90% (Smooth Talker discount applied)
      const counter = Math.round(l.price * 0.9 * (1 - stDiscount) / 10) * 10;
      response = `"${money(offerPrice)}? Come on. ${money(counter)} and we got a deal."`;
      price = counter;
    } else {
      response = `"${money(offerPrice)}?? No lowballs, bro."`;
    }
    // Track the thread
    this.thread = this.thread || [];
    this.thread.push({ from: "you", text: money(offerPrice) });
    this.thread.push({ from: "seller", text: response });
    this.haggleResponse = { response, accepted, price };
    this.render();
    // Keep input focused for quick follow-up offers
    const inp = document.getElementById("offer-input");
    if (inp) inp.focus();
  },

  buyNow() {
    const l = this.current;
    // Buyable price: accepted offer, seller counter, or asking price
    const price = (this.haggleResponse && this.haggleResponse.price)
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
      <div class="d-photo">
        <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" draggable="false">
        <div class="photo-count">${Icon.get('camera')} ${l.photos}</div>
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
          <div><strong>${l.seller}</strong><div class="meta">${Icon.get('star')} ${l.sellerRating} seller rating</div></div>
        </div>
        <div class="cond-report">
          <h3>Condition Report</h3>
          ${((typeof Skills !== "undefined") && Skills.tier("gearhead") > 0) ? "" : `<div class="cond-locked-note">${Icon.get('lock')} Train <strong>Gear Head</strong> to see part conditions before buying — or buy it and inspect in your garage.</div>`}
          <div class="parts-grid">
            ${availableParts(l.sprite).map(p => {
              const st = (l.partStates && l.partStates[p.key]) || "pristine";
              const gh = (typeof Skills !== "undefined") ? Skills.tier("gearhead") : 0;
              let stateLabel, pctLabel = "";
              if (gh === 0) {
                stateLabel = `<span class="cond-hidden">???</span>`;
              } else if (gh === 1) {
                stateLabel = PART_STATE_LABEL[st];
              } else {
                const pctMap = { pristine: 95, used_good: 60, used_bad: 35, totaled: 10 };
                const pct = pctMap[st] || 50;
                stateLabel = PART_STATE_LABEL[st];
                pctLabel = ` · ${pct}%`;
              }
              return `<div class="part-cell state-${gh === 0 ? "hidden" : st}">
                <img src="${partImg(l.sprite, p.key, gh === 0 ? "pristine" : st)}" alt="${p.label}" loading="lazy">
                <div class="part-label">${p.label}</div>
                <div class="part-state">${stateLabel}${pctLabel}</div>
              </div>`;
            }).join("")}
          </div>
        </div>
        ${this.thread && this.thread.length ? `<div class="msg-thread">` +
          this.thread.map(m => `<div class="msg ${m.from}">${m.text}</div>`).join("") + `</div>` : ""}
        ${this.notice ? `<div class="notice">${this.notice}</div>` : ""}
        <div class="msg-seller-card">
          <div class="msg-seller-head">${Icon.get('chat')} Message seller</div>
          ${((typeof Skills !== "undefined") && Skills.hasSellerHint()) ? `<div class="seller-hint">Psst — they'll probably take ${money(Math.round(l.price * 0.85))}</div>` : ""}
          <div class="msg-seller-row">
            <input id="offer-input" type="text" inputmode="numeric" pattern="[0-9]*"
              placeholder="Make an offer... ($)" autocomplete="off">
            <button id="offer-send">Send</button>
          </div>
          ${this.blocked && ((typeof Skills !== "undefined") && Skills.hasRetry() && !this.retryUsed) ? `<button class="retry-btn" id="d-retry">Smooth Talker: Give it one more shot</button>` : ""}
        </div>
        <button class="buy-btn${this.blocked ? " blocked" : ""}" id="d-buy"${this.blocked ? " disabled" : ""}>
          ${this.blocked ? `Seller blocked you` : (hr && hr.price) ? `Buy for ${money(hr.price)}` : `Buy now — ${money(l.price)}`}
        </button>
        <div class="as-is">Sold as-is. No warranties, no take-backs.</div>
      </div>
    </div>`;
    document.getElementById("d-back").onclick = () => this.close();
    document.getElementById("d-buy").onclick = () => this.buyNow();
    const offerInput = document.getElementById("offer-input");
    const sendBtn = document.getElementById("offer-send");
    const sendOffer = () => this.sendOffer(offerInput.value);
    // Numerals only as they type
    offerInput.addEventListener("input", () => {
      offerInput.value = offerInput.value.replace(/[^0-9]/g, "");
    });
    sendBtn.onclick = sendOffer;
    offerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendOffer();
    });
    // Smooth Talker Tier 2: one free retry after being blocked
    const retryBtn = document.getElementById("d-retry");
    if (retryBtn) retryBtn.onclick = () => {
      this.blocked = false;
      this.retryUsed = true;
      this.thread.push({ from: "you", text: `"Look, let's start over. No hard feelings?"` });
      this.thread.push({ from: "seller", text: `"Fine. One more chance. Don't waste it."` });
      this.render();
    };
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
