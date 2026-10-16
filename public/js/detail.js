// Sold As-Is — listing detail view
const Detail = {
  current: null,
  offer: null,

  open(id) {
    const l = Feed.listings.find(x => x.id === id);
    if (!l) return;
    this.current = l;
    this.offer = null;
    this._lastCounter = null; // fresh negotiation
    this._haggleRounds = 0;
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
    if (typeof Feed !== "undefined" && Feed.render) Feed.render();
  },

  // Haggle: player sends a numeric offer, seller responds intelligently
  // Returns { response, accepted, price } — price is the buyable amount
  _lastHaggle: null,
  pickReply(options) {
    this._recentHaggles = this._recentHaggles || [];
    let pool = options.filter(o => !this._recentHaggles.includes(o));
    if (!pool.length) pool = options;
    const pick = pool[(Math.random() * pool.length) | 0];
    this._recentHaggles.push(pick);
    if (this._recentHaggles.length > 3) this._recentHaggles.shift();
    return pick;
  },

  _removeBlockedListing(passedListing) {
    // Seller blocked you — listing is replaced with a fresh one
    // Single choke point: every marketplace block path funnels through here
    State.stats.timesBlocked = (State.stats.timesBlocked || 0) + 1;
    const l = passedListing || this.current;
    if (l && typeof Feed !== "undefined" && Feed.replaceBlocked) {
      Feed.replaceBlocked(l.id);
    }
    // Activity notification (silent — red dot, no sound)
    if (l) {
      try {
        const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
        const blockMsgs = [
          `${l.seller || "Seller"} blocked you. The ${l.brand} ${l.model} is gone forever. Smooth.`,
          `You got blocked by ${l.seller || "the seller"}. The ${l.brand} ${l.model} listing has left the chat.`,
          `${l.seller || "Seller"} hit the block button. That ${l.brand} ${l.model} will never know your love.`,
        ];
        feed.unshift({ msg: blockMsgs[(Math.random() * blockMsgs.length) | 0], at: Date.now(), cat: "marketplace" });
        if (feed.length > 50) feed.length = 50;
        localStorage.setItem("soldasis_activity", JSON.stringify(feed));
        // Bump unread on UI (owns the bell) — silent, no toast, no sound
        if (typeof UI !== "undefined") {
          UI._unreadActivity = (UI._unreadActivity || 0) + 1;
          UI._unreadMarketplace = (UI._unreadMarketplace || 0) + 1;
          if (UI.updateBellBadge) UI.updateBellBadge();
        }
      } catch (e) {}
    }
    // Disable buying immediately — this listing is dead
    this.blocked = true;
    // Close after a beat so they see the block message, then refresh feed —
    // but NOT while a Smooth Talker retry is on the table: the player needs
    // the detail open to tap it. (The 1500ms auto-close used to race the tap
    // and swallow the retry button before anyone could hit it.)
    const canRetry = !this.retryUsed && (typeof Skills !== "undefined") && Skills.hasRetry();
    if (!canRetry) {
      setTimeout(() => {
        this.close();
        if (typeof Views !== "undefined" && Views.current === "market") {
          Views.renderMarketFeed();
          Views.renderMarketTabs();
        }
      }, 1500);
    }
  },
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
    this._haggleRounds = (this._haggleRounds || 0) + 1;
    // Seller patience: starts round 2, balanced escalation
    // R2: 10% → R3: 25% → R4: 50% → R5+: 75% cap
    if (this._haggleRounds >= 2 && !this.blocked) {
      const chances = [0, 0.10, 0.25, 0.50, 0.75];
      const blockChance = chances[Math.min(this._haggleRounds, 4)];
      // A serious, converging offer doesn't draw the patience block — the
      // seller can smell a deal closing (near their last counter, or deep
      // into accept territory). The escalation still punishes grinding.
      const converging = (this._lastCounter && offerPrice >= this._lastCounter * 0.92)
        || offerPrice >= l.price * 0.85;
      if (!converging && Math.random() < blockChance) {
        this.blocked = true;
        this.haggleResponse = { response: this.pickReply([
          `"You know what? I'm tired of going back and forth. Deal's off."`,
          `"We've been at this too long. I'm moving on."`,
          `"I don't have all day for this. Find another bike."`,
          `"This is going nowhere. We're done here."`,
        ]), accepted: false, price: null };
        const blockedListing3 = this.current;
        this.render();
        this._removeBlockedListing(blockedListing3);
        return;
      }
    }
    // Easter egg: the 67 meme
    if (offerPrice === 67) {
      this.thread = this.thread || [];
      this.thread.push({ from: "you", text: money(offerPrice) });
      this.thread.push({ from: "seller", text: `"Are you serious, that meme is dead bro"` });
      this.render();
      return;
    }
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
    // Bad faith: trying to go lower AFTER explicitly accepting a deal
    // (a seller counter is NOT an agreement — only a prior accept counts)
    const wasAccepted = this.haggleResponse && this.haggleResponse.accepted;
    const agreedPrice = wasAccepted && this.haggleResponse.price;
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
      const blockedListing = this.current;
      this.render();
      this._removeBlockedListing(blockedListing);
      return;
    }
    this.offer = offerPrice;
    const persona = l.persona || personaOf(l.seller);
    // Smooth Talker: discount boosts effective offer ratio
    const stDiscount = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    const effectiveOffer = offerPrice * (1 + stDiscount);
    const ratio = effectiveOffer / l.price;
    let response, accepted = false, price = null;

    // Track consecutive lowballs for unpredictable blocking
    this._lowballStreak = (ratio < 0.50) ? (this._lowballStreak || 0) + 1 : 0;

    // Generous seller: rare early on, Smooth Talker warms people up (+4%/tier)
    const stTier = (typeof Skills !== "undefined") ? Skills.tier("smoothtalker") : 0;
    const generous = ratio >= 0.50 && ratio < 0.85 && Math.random() < (0.03 + stTier * 0.04);

    // He met your last counter — that's a deal, not another round of haggling
    if (this._lastCounter && offerPrice >= this._lastCounter && !wasAccepted) {
      response = HAGGLE.say(persona, "met", offerPrice);
      accepted = true; price = offerPrice;
    } else if (generous) {
      response = HAGGLE.say(persona, "generous", offerPrice);
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.95) {
      response = HAGGLE.say(persona, "accept", offerPrice);
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.85) {
      response = HAGGLE.say(persona, "grudging", offerPrice);
      accepted = true; price = offerPrice;
    } else if (ratio >= 0.70) {
      // Counter between his offer and the seller's last position — the seller
      // only ever moves DOWN toward him, and never below his own offer
      const sellerAnchor = this._lastCounter && this._lastCounter < l.price ? this._lastCounter : l.price;
      const counter = haggleCounter(offerPrice, sellerAnchor, (offerPrice + sellerAnchor) / 2, 10);
      if (!counter) {
        // Gap too small to counter — his offer is effectively the meeting point
        response = HAGGLE.say(persona, "met", offerPrice);
        accepted = true; price = offerPrice;
      } else {
        this._lastCounter = counter;
        response = HAGGLE.say(persona, "counter", offerPrice, counter);
        price = counter; // buy button updates to counter
      }
    } else if (ratio >= 0.50) {
      // Firm counter at 90% of the seller's current position, clamped the
      // same way — it can never land at or below the player's offer
      const sellerAnchor = this._lastCounter && this._lastCounter < l.price ? this._lastCounter : l.price;
      const counter = haggleCounter(offerPrice, sellerAnchor, sellerAnchor * 0.9, 10);
      if (!counter) {
        response = HAGGLE.say(persona, "met", offerPrice);
        accepted = true; price = offerPrice;
      } else {
        this._lastCounter = counter;
        response = HAGGLE.say(persona, "firm", offerPrice, counter);
        price = counter;
      }
    } else {
      // Lowball: unpredictable blocking (more lowballs = more likely to get blocked)
      const blockChance = Math.min(0.15 + (this._lowballStreak - 1) * 0.25, 0.85);
      if (Math.random() < blockChance) {
        this.thread = this.thread || [];
        this.thread.push({ from: "you", text: money(offerPrice) });
        this.thread.push({ from: "seller", text: HAGGLE.say(persona, "block", offerPrice) });
        this.blocked = true;
        this.haggleResponse = { response: null, accepted: false, price: null };
        const blockedListing2 = this.current;
        this.render();
        this._removeBlockedListing(blockedListing2);
        return;
      }
      response = HAGGLE.say(persona, "reject", offerPrice);
    }
    // Track the thread
    this.thread = this.thread || [];
    this.thread.push({ from: "you", text: money(offerPrice) });
    this.thread.push({ from: "seller", text: response });
    this.haggleResponse = { response, accepted, price };
    this.render();
    // Keep input focused for quick follow-up offers
    const inp = document.getElementById("offer-input");
    if (inp) inp.focus({preventScroll:true});
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
    const wasDanny = !!l.isDanny;
    // Carry over Gear Head reveals — parts you could see in the listing stay revealed
    const gh = (typeof Skills !== "undefined") ? Skills.tier("gearhead") : 0;
    let revealedParts = [];
    if (gh > 0 && l.partStates) {
      const parts = availableParts(l.sprite);
      if (gh >= 3) {
        revealedParts = parts.map(p => p.key);
      } else {
        const seed = (l.id || 0) * 9301 + 49297;
        const scored = parts.map(p => ({
          p,
          h: (seed * (p.key.charCodeAt(0) * 7 + p.key.length)) % 1000
        })).sort((a, b) => a.h - b.h);
        const count = gh === 1 ? 3 : Math.ceil(parts.length * 0.6);
        revealedParts = scored.slice(0, count).map(x => x.p.key);
      }
    }
    // A price that came out of back-and-forth (accept or counter) is a
    // struck deal; a straight asking-price buy is not.
    const negotiated = !!(this.haggleResponse && this.haggleResponse.price);
    const town = townForListing(l.id);
    // Fuel warning: deal leaves player without fuel money (2A)
    const FUEL_RESERVE = 25;
    if (town !== "Port Angeles" && State.cash - price < FUEL_RESERVE && !this._fuelWarned) {
      this._fuelWarned = true;
      this.notice = `Heads up — this leaves you with $${(State.cash - price).toLocaleString()}, not enough for fuel. Tap Buy again to go through with it.`;
      this.render();
      return;
    }
    this._fuelWarned = false;
    if (town === "Port Angeles") {
      // Home-town deal: straight to garage, no travel
      const buyResult = State.buy({ ...l, price, revealedParts });
      if (!buyResult) {
        this.notice = "Purchase failed.";
        this.render();
        return;
      }
    } else {
      // Travel deal: cash commits now, bike becomes a green pin for pickup
      if (!State.canAfford(price)) {
        this.notice = "Not enough cash for this one.";
        this.render();
        return;
      }
      State.cash -= price;
      const ts = State.travel || (State.travel = { fuel: 15, wallet: 140, deals: [] });
      if (!ts.deals) ts.deals = [];
      ts.deals.push({
        listingId: l.id,
        town: town,
        bike: { ...l, price, revealedParts, boughtFor: price, boughtAt: Date.now() },
        pricePaid: price,
        struckAt: Date.now(),
      });
      State.stats.bikesBought = (State.stats.bikesBought || 0) + 1;
      const seller = l.seller || "unknown";
      const sb = State.stats.sellerBikes || (State.stats.sellerBikes = {});
      sb[seller] = (sb[seller] || 0) + 1;
      if (typeof Milestones !== "undefined") Milestones.check(State.stats);
      Save.save();
    }
    if (negotiated) State.stats.dealsStruck = (State.stats.dealsStruck || 0) + 1;
    Feed.remove(l.id);
    // Backfill to 16 listings
    try {
      const fresh = genListings(1, Feed.nextId, null, { exclude: Feed.listings.map(x => x.sprite), tick: false });
      Feed.nextId += 1;
      Feed.listings.push(...fresh);
      Feed.render();
    } catch (e) {}
    this.close();
    UI.refreshCash();
  },

  render() {
    const l = this.current;
    const el = document.getElementById("detail");
    // Preserve scroll position across re-renders (offer submissions etc.)
    const prevScroll = el.querySelector(".detail-scroll");
    const savedScroll = prevScroll ? prevScroll.scrollTop : 0;
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
            ${(() => {
              const parts = availableParts(l.sprite);
              const gh = (typeof Skills !== "undefined") ? Skills.tier("gearhead") : 0;
              // Which parts are revealed (seeded by listing ID so it's consistent)
              const revealed = new Set();
              if (gh >= 3) {
                parts.forEach(p => revealed.add(p.key));
              } else if (gh > 0) {
                const seed = (l.id || 0) * 9301 + 49297;
                const scored = parts.map(p => ({
                  p,
                  h: (seed * (p.key.charCodeAt(0) * 7 + p.key.length)) % 1000
                })).sort((a, b) => a.h - b.h);
                const count = gh === 1 ? 3 : Math.ceil(parts.length * 0.6);
                scored.slice(0, count).forEach(x => revealed.add(x.p.key));
              }
              return parts.map(p => {
              const st = (l.partStates && l.partStates[p.key]) || "pristine";
              const isRev = revealed.has(p.key);
              let stateLabel, pctLabel = "";
              if (!isRev) {
                stateLabel = `<span class="cond-hidden">???</span>`;
              } else {
                const pctMap = { pristine: 95, used_good: 60, used_bad: 35, totaled: 10, missing: 0 };
                const pct = pctMap[st] ?? 50;
                stateLabel = PART_STATE_LABEL[st] || st;
                pctLabel = st === "missing" ? "" : ` · ${pct}%`;
              }
              const imgSrc = (!isRev || st === "missing") ? null : partImg(l.sprite, p.key, st);
              const imgHtml = imgSrc
                ? `<img src="${imgSrc}" alt="${p.label}" loading="lazy">`
                : (isRev && st === "missing" ? `<div class="part-missing">${Icon.get('missing')}</div>` : `<div class="part-hidden">${Icon.get('hidden')}</div>`);
              return `<div class="part-cell state-${!isRev ? "hidden" : st}">
                ${imgHtml}
                <div class="part-label">${p.label}</div>
                <div class="part-state">${stateLabel}${pctLabel}</div>
              </div>`;
              }).join("");
            })()}
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
    if (offerInput && typeof GameKB !== "undefined") {
      GameKB.attach(offerInput, (val) => {
        if (val > 0) this.sendOffer(String(val));
      }, (typed) => {
        const ask = this.current.price;
        const counter = this._lastCounter;
        const target = counter && counter < ask ? counter : ask;
        let html = counter && counter < ask
          ? `Seller's at <span class="kb-ctx-price">$${counter.toLocaleString()}</span> · Asking $${ask.toLocaleString()}`
          : `Asking <span class="kb-ctx-price">$${ask.toLocaleString()}</span>`;
        if (typed > 0) {
          const diff = target - typed;
          if (diff > 0) html += ` · <span class="kb-ctx-under">$${diff.toLocaleString()} under</span>`;
          else if (diff < 0) html += ` · <span class="kb-ctx-over">$${(-diff).toLocaleString()} over</span>`;
          else html += ` · meets their price`;
        }
        return html;
      });
    }
    const sendOffer = () => this.sendOffer(offerInput.dataset.raw || offerInput.value);
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
    // Restore scroll position
    if (savedScroll > 0) {
      const ds = el.querySelector(".detail-scroll");
      if (ds) ds.scrollTop = savedScroll;
    }
  },
};

const UI = {
  refreshCash() {
    document.getElementById("cash").textContent = State.fmtCash();
  },
  _toastQueue: [],
  _toastShowing: false,
  _unreadActivity: 0,
  _unreadMarketplace: 0,
  _unreadBoneyard: 0,
  updateBellBadge() {
    const bell = document.getElementById("activity-bell");
    if (!bell) return;
    let dot = bell.querySelector(".bell-dot");
    if (this._unreadActivity > 0) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "bell-dot";
        bell.appendChild(dot);
      }
    } else if (dot) {
      dot.remove();
    }
  },
  toast(msg, category) {
    this._toastQueue.push(msg);
    this._showNextToast();
    // Bump unread badge on bell
    this._unreadActivity++;
    this.updateBellBadge();
    // Log to activity feed (auto-detect category if not given)
    try {
      if (!category) {
        const m = msg.toLowerCase();
        category = (m.includes("part") || m.includes("boneyard")) ? "boneyard" : "marketplace";
      }
      const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
      feed.unshift({ msg, at: Date.now(), cat: category });
      if (feed.length > 50) feed.length = 50;
      localStorage.setItem("soldasis_activity", JSON.stringify(feed));
    } catch (e) {}
  },
  _activityTab: "marketplace",
  showActivity(tab) {
    // Clear unread badge
    this._unreadActivity = 0;
    this.updateBellBadge();
    // Clear tab-specific dot when that tab is opened
    const curTab = tab || this._activityTab || "marketplace";
    if (curTab === "marketplace") this._unreadMarketplace = 0;
    if (curTab === "boneyard") this._unreadBoneyard = 0;
    const popup = document.getElementById("activity-popup");
    const list = document.getElementById("activity-list");
    if (!popup || !list) return;
    if (tab) this._activityTab = tab;
    const cur = this._activityTab;
    let feed = [];
    try { feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]"); } catch (e) {}
    const filtered = feed.filter(a => (a.cat || "marketplace") === cur);
    const tabsHTML = `
      <div class="activity-tabs">
        <button class="activity-tab${cur === "marketplace" ? " active" : ""}" data-atab="marketplace">Marketplace${this._unreadMarketplace > 0 ? `<span class="tab-dot-sm"></span>` : ""}</button>
        <button class="activity-tab${cur === "boneyard" ? " active" : ""}" data-atab="boneyard">Boneyard${this._unreadBoneyard > 0 ? `<span class="tab-dot-sm"></span>` : ""}</button>
      </div>
      ${filtered.length ? `<button class="activity-clear" id="activity-clear">Clear</button>` : ""}`;
    if (!filtered.length) {
      list.innerHTML = tabsHTML + '<div class="activity-empty">No activity yet.</div>';
    } else {
      list.innerHTML = tabsHTML + filtered.map((a, idx) => {
        const d = new Date(a.at);
        const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const isClickable = a.clickable || (a.listingId && a.cat === "marketplace");
        const cls = isClickable ? "activity-item clickable" : "activity-item";
        const dataAttr = isClickable && a.listingId ? ` data-listing="${a.listingId}"` : "";
        return `<div class="${cls}"${dataAttr}><span class="activity-time">${time}</span><span>${a.msg}</span></div>`;
      }).join("");
    }
    list.querySelectorAll("[data-atab]").forEach(b => {
      b.addEventListener("click", (e) => { e.stopPropagation(); this.showActivity(b.dataset.atab); });
    });
    list.querySelectorAll(".activity-item.clickable").forEach((item, idx) => {
      item.addEventListener("click", (e) => {
        e.stopPropagation();
        const listingId = item.dataset.listing;
        if (!listingId) return;
        // Close popup
        document.getElementById("activity-popup")?.classList.add("hidden");
        // Check if this was a sold (buy-it-now) notification
        let feed = [];
        try { feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]"); } catch (err) {}
        const cur = this._activityTab || "marketplace";
        const filtered = feed.filter(a => (a.cat || "marketplace") === cur);
        const entry = filtered[idx];
        if (typeof Views !== "undefined") {
          if (entry && entry.soldView && Views.openSoldFromActivity) {
            Views.openSoldFromActivity(listingId);
          } else if (Views.openOfferFromActivity) {
            Views.openOfferFromActivity(listingId);
          }
        }
      });
    });
    const clearBtn = list.querySelector("#activity-clear");
    if (clearBtn) {
      clearBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        try { localStorage.setItem("soldasis_activity", "[]"); } catch (err) {}
        this._unreadActivity = 0;
        this.updateBellBadge();
        this.showActivity();
      });
    }
    // Close other popups
    document.getElementById("music-popup")?.classList.add("hidden");
    document.getElementById("settings-menu")?.classList.add("hidden");
    // Only toggle when opening from bell (no tab arg); tab switches keep it open
    if (!tab) {
      popup.classList.toggle("hidden");
    } else {
      popup.classList.remove("hidden");
    }
  },
  updateBellBadge() {
    const bell = document.getElementById("activity-bell");
    if (!bell) return;
    let dot = bell.querySelector(".bell-dot");
    if (this._unreadActivity > 0) {
      if (!dot) {
        dot = document.createElement("span");
        dot.className = "bell-dot";
        bell.appendChild(dot);
      }
    } else if (dot) {
      dot.remove();
    }
  },
  // Force-show the bell dot (for block notifications)
  _forceBellDot() {
    const bell = document.getElementById("activity-bell");
    if (!bell) return;
    if (!bell.querySelector(".bell-dot")) {
      const dot = document.createElement("span");
      dot.className = "bell-dot";
      bell.appendChild(dot);
    }
  },
  _showNextToast() {
    if (this._toastShowing || !this._toastQueue.length) return;
    this._toastShowing = true;
    const msg = this._toastQueue.shift();
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => {
      t.classList.remove("show");
      setTimeout(() => {
        t.remove();
        this._toastShowing = false;
        this._showNextToast();
      }, 300);
    }, 2500);
  },
};
