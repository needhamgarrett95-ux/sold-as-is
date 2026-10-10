// Sold As-Is — garage & collection views
const SITES = {
  market:     { tab: "Sold As-Is — Mopeds for sale", url: "soldasis.place/mopeds",     icon: "moped" },
  parts:      { tab: "Boneyard — Moped parts",       url: "boneyard.place",              icon: "gear" },
  garage:     { tab: "Sold As-Is — My Garage",       url: "soldasis.place/garage",     icon: "wrench" },
  collection: { tab: "Sold As-Is — My Collection",   url: "soldasis.place/collection", icon: "trophy" },
};

const Views = {
  current: "market",
  partsShop: [],

  show(name) {
    this.current = name;
    Detail.close();
    document.querySelectorAll("#tabstrip .wtab").forEach(b =>
      b.classList.toggle("active", b.dataset.view === name));
    // Update the URL bar to match the "site" we're on
    const site = SITES[name];
    const urlEl = document.querySelector(".urlbar .url");
    if (urlEl) urlEl.textContent = site.url;
    // Swap header logo for Boneyard (feels like a different site)
    const isBoneyard = name === "parts";
    document.getElementById("logo-main").classList.toggle("hidden", isBoneyard);
    document.getElementById("logo-boneyard").classList.toggle("hidden", !isBoneyard);
    // Swap search bar for bike filter on Boneyard
    document.getElementById("site-search").classList.toggle("hidden", isBoneyard);
    document.getElementById("parts-bike-filter").classList.toggle("hidden", !isBoneyard);
    // Update refresh button for the active tab
    this.updateRefreshBtn();
    document.getElementById("feed").style.display = name === "market" ? "" : "none";
    document.getElementById("cats").style.display = name === "market" && this.marketTab === "browse" ? "" : "none";
    document.getElementById("market-tabs").style.display = name === "market" ? "" : "none";
    document.getElementById("parts-view").classList.toggle("hidden", name !== "parts");
    document.getElementById("garage-view").classList.toggle("hidden", name !== "garage");
    document.getElementById("collection-view").classList.toggle("hidden", name !== "collection");
    if (name === "market") {
      this.renderMarketTabs(); this.renderMarketFeed();
      if (this.marketTab === "mine") this.clearMarketBadges();
    }
    if (name === "parts") {
      this.renderParts();
      if (this.boneyardTab === "sell") this.clearPartsBadges();
    }
    if (name === "garage") this.renderGarage();
    if (name === "collection") this.renderCollection();
    const n = document.getElementById("nav-garage-n");
    if (n) n.textContent = State.garage.length ? `${State.garage.length}` : "";
  },

  partsFilter: "all",
  partsSearch: "",
  typeFilter: "all", // "all" | "bin" | "auction"
  auctionTimer: null,
  boneyardTab: "buy", // "buy" | "sell"
  myPartListings: [], // player's own part listings
  myBikeListings: [], // player's own bike listings
  playerAuctionTimer: null,
  unseenPartSales: 0, // unviewed boneyard sales
  partDetailIdx: -1,
  partDetailOffer: null,
  cart: [], // shopping cart for parts
  bikeListingFilter: "active", // "active" | "sold"
  partListingFilter: "active", // "active" | "sold"
  marketTab: "browse", // "browse" | "mine"
  salesTimer: null,
  bikeSalesTimer: null,
  // Boneyard refresh: 3 free, then 30s cooldown
  partsRefreshesLeft: 3,
  partsCooldownUntil: 0,
  partsCooldownTimer: null,
  PARTS_COOLDOWN_KEY: "soldasis_parts_cooldown",
  PARTS_REFRESHES_KEY: "soldasis_parts_refreshes",

  refreshParts() {
    const now = Date.now();
    if (now < this.partsCooldownUntil) {
      const remain = Math.ceil((this.partsCooldownUntil - now) / 1000);
      return;
    }
    if (this.partsRefreshesLeft <= 0) {
      // Start 30s cooldown, reset free refreshes after
      this.partsCooldownUntil = now + 30 * 1000;
      try {
        localStorage.setItem(this.PARTS_COOLDOWN_KEY, String(this.partsCooldownUntil));
        localStorage.setItem(this.PARTS_REFRESHES_KEY, "0");
      } catch (e) {}
      this.tickPartsCooldown();
      return;
    }
    this.partsRefreshesLeft--;
    try { localStorage.setItem(this.PARTS_REFRESHES_KEY, String(this.partsRefreshesLeft)); } catch (e) {}
    this.partsShop = genPartsShop(16);
    // Eliseo_M always has a part listed
    this.partsShop.unshift(makeDannyPart(1000 + ((Math.random() * 9000) | 0)));
    // Reset filters on fresh stock
    this.renderParts();
    // Browser Extension Tier 3: deal alerts
    if (typeof Skills !== "undefined" && Skills.hasPriceAlerts()) {
      const deals = this.partsShop.filter(p => {
        const avg = Skills.marketAverage(p);
        return avg > 0 && p.price < avg * 0.8;
      });
      if (deals.length) {
        const best = deals.reduce((a, b) => (a.price / Skills.marketAverage(a) < b.price / Skills.marketAverage(b) ? a : b));
      }
    }
    if (this.partsRefreshesLeft <= 0) {
      this.partsCooldownUntil = Date.now() + 30 * 1000;
      try {
        localStorage.setItem(this.PARTS_COOLDOWN_KEY, String(this.partsCooldownUntil));
        localStorage.setItem(this.PARTS_REFRESHES_KEY, "0");
      } catch (e) {}
      this.tickPartsCooldown();
    } else {
      this.updateRefreshBtn();
    }
  },

  tickPartsCooldown() {
    const btn = document.getElementById("refresh-btn");
    clearInterval(this.partsCooldownTimer);
    const update = () => {
      const remain = Math.ceil((this.partsCooldownUntil - Date.now()) / 1000);
      if (remain <= 0) {
        clearInterval(this.partsCooldownTimer);
        this.partsRefreshesLeft = 3; // reset free refreshes
        try {
          localStorage.setItem(this.PARTS_REFRESHES_KEY, "3");
          localStorage.removeItem(this.PARTS_COOLDOWN_KEY);
        } catch (e) {}
        this.updateRefreshBtn();
        return;
      }
      btn.disabled = true;
      btn.classList.add("cooling");
      btn.textContent = `${remain}s`;
      btn.title = `Boneyard refresh in ${remain}s`;
    };
    update();
    this.partsCooldownTimer = setInterval(update, 1000);
  },

  updateRefreshBtn() {
    // Called when switching tabs or after cooldown ends
    // Restore persisted state on first call
    if (!this._partsRestored) {
      this._partsRestored = true;
      try {
        const savedCooldown = parseInt(localStorage.getItem(this.PARTS_COOLDOWN_KEY) || "0", 10);
        const savedRefreshes = parseInt(localStorage.getItem(this.PARTS_REFRESHES_KEY) || "3", 10);
        if (savedCooldown > Date.now()) {
          this.partsCooldownUntil = savedCooldown;
          this.partsRefreshesLeft = 0;
          setTimeout(() => this.tickPartsCooldown(), 100);
        } else {
          this.partsRefreshesLeft = isNaN(savedRefreshes) ? 3 : savedRefreshes;
          // Clear expired cooldown
          localStorage.removeItem(this.PARTS_COOLDOWN_KEY);
        }
      } catch (e) {}
    }
    const btn = document.getElementById("refresh-btn");
    if (!btn) return;
    if (this.current === "parts") {
      const now = Date.now();
      if (now < this.partsCooldownUntil) {
        // Parts cooldown active — ensure display timer is running
        if (!this.partsCooldownTimer) this.tickPartsCooldown();
        return;
      }
      // Clear any market cooldown display
      clearInterval(Feed.cooldownTimer);
      btn.disabled = false;
      btn.classList.remove("cooling");
      btn.innerHTML = "↻";
      btn.title = `Refresh Boneyard (${this.partsRefreshesLeft} free left)`;
    } else if (this.current === "market") {
      // Clear parts cooldown display, restore market state
      clearInterval(this.partsCooldownTimer);
      this.partsCooldownTimer = null;
      const now = Date.now();
      if (now < Feed.cooldownUntil) {
        Feed.tickCooldown(); // resume market countdown display
      } else {
        btn.disabled = false;
        btn.classList.remove("cooling");
        btn.innerHTML = "↻";
        btn.title = "Refresh listings";
      }
    }
    // Garage/collection: leave button as-is
  },

  // --- auction engine ---
  // --- simulated buyers for player listings ---
  startSalesTimer() {
    if (this.salesTimer) return;
    this.salesTimer = setInterval(() => this.tickSales(), 5000); // check every 5s
  },

  // --- marketplace: my bike listings ---
  renderMarketTabs() {
    const el = document.getElementById("market-tabs");
    if (!el) return;
    el.innerHTML = `
      <div class="eby-typefilter market-tabs">
        <button class="eby-type${this.marketTab === "browse" ? " active" : ""}" data-mtab="browse">Browse</button>
        <button class="eby-type${this.marketTab === "mine" ? " active" : ""}" data-mtab="mine">My Listings${(() => { const n = this.myBikeListings.filter(l => !l.sold).length; return n ? ` (${n})` : ""; })()}${this.myBikeListings.some(l => l.offer) && this.marketTab !== "mine" ? `<span class="tab-dot"></span>` : ""}</button>
      </div>`;
    el.querySelectorAll("[data-mtab]").forEach(t =>
      t.addEventListener("click", () => {
        this.marketTab = t.dataset.mtab;
        if (t.dataset.mtab === "mine") this.clearMarketBadges();
        this.renderMarketTabs();
        this.renderMarketFeed();
      }));
    const cats = document.getElementById("cats");
    if (cats) cats.style.display = this.marketTab === "browse" ? "" : "none";
  },

  // Tab dots render inline in renderMarketTabs — no separate update needed
  updateNavBadges() {},

  clearMarketBadges() {
    // No-op: tab dot clears on re-render
  },

  clearPartsBadges() {
    this.unseenPartSales = 0;
  },

  renderMarketFeed() {
    if (this.marketTab === "mine") {
      this.renderMyBikeListings();
    } else {
      Feed.render();
    }
  },

  renderMyBikeListings() {
    const feed = document.getElementById("feed");
    if (!this.myBikeListings.length) {
      feed.innerHTML = `<div class="empty"><strong>No listings yet</strong>List a bike from your garage to sell it here.</div>`;
      return;
    }
    const filterHtml = `
      <div class="eby-typefilter">
        <button class="eby-type${this.bikeListingFilter === "active" ? " active" : ""}" data-bf="active">Active</button>
        <button class="eby-type${this.bikeListingFilter === "sold" ? " active" : ""}" data-bf="sold">Sold</button>
      </div>`;
    const shown = this.myBikeListings
      .map((l, i) => ({ ...l, idx: i }))
      .filter(l => this.bikeListingFilter === "active" ? !l.sold : l.sold);
    if (!shown.length) {
      feed.innerHTML = filterHtml + `<div class="empty"><strong>Nothing here</strong>No ${this.bikeListingFilter} listings.</div>`;
      feed.querySelectorAll("[data-bf]").forEach(b =>
        b.addEventListener("click", () => { this.bikeListingFilter = b.dataset.bf; this.renderMyBikeListings(); }));
      return;
    }
    feed.innerHTML = filterHtml + `<div class="feed-grid">` +
      shown.map((l) => {
        const i = l.idx;
        const minsListed = Math.floor((Date.now() - l.listedAt) / 60000);
        const timeStr = minsListed < 1 ? "just now" : `${minsListed}m ago`;
        return `
      <article class="card" data-bike-offer="${i}">
        <div class="photo">
          <div class="just-listed">${l.sold ? "SOLD" : "Your Listing"}</div>
          ${l.offer && !l.sold ? `<div class="offer-badge">1</div>` : ""}
          <img src="assets/bikes/${l.sprite}.png" alt="${l.brand} ${l.model}" loading="lazy" draggable="false"${Feed.spriteNudge.has(l.sprite) ? ' class="nudged"' : ""}>
          <div class="card-cond">${l.condition}</div>
        </div>
        <div class="card-info">
          <div class="card-price-name"><strong>${l.sold ? money(l.soldFor) : money(l.askPrice)}</strong> &middot; ${l.brand} ${l.model}</div>
          <div class="card-loc">${l.sold ? `Sold!` : `Listed ${timeStr} · awaiting buyers`}</div>
          ${l.sold ? "" : `<button class="eby-delist" data-delist-bike="${i}" style="margin-top:6px;width:100%">Remove Listing</button>`}
        </div>
      </article>`;
      }).join("") + `</div>`;
    feed.querySelectorAll("[data-delist-bike]").forEach(b =>
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        this.delistBike(+b.dataset.delistBike);
      }));
    feed.querySelectorAll("[data-bf]").forEach(b =>
      b.addEventListener("click", () => { this.bikeListingFilter = b.dataset.bf; this.renderMyBikeListings(); }));
    // Tap listing with offer → open haggle
    feed.querySelectorAll("[data-bike-offer]").forEach(c => {
      const idx = +c.dataset.bikeOffer;
      if (!this.myBikeListings[idx].offer || this.myBikeListings[idx].sold) return;
      c.addEventListener("click", (e) => {
        // Don't open if tapping the delist button
        if (e.target.closest("[data-delist-bike]")) return;
        this.openSellerHaggle(this.myBikeListings, idx);
      });
      c.style.cursor = "pointer";
    });
  },

  listBikeForSale(garageIdx, price) {
    const bike = State.garage[garageIdx];
    if (!bike) return;
    price = parseInt(String(price).replace(/[^0-9]/g, ""), 10);
    if (!price || price <= 0) {
      return;
    }
    State.garage.splice(garageIdx, 1);
    this.myBikeListings.push({ ...bike, askPrice: price, listedAt: Date.now() });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.startBikeSalesTimer();
    this.garageTab = "bikes";
    this.garageDetailIdx = -1;
    Save.save();
    this.renderGarage();
  },

  delistBike(idx) {
    const l = this.myBikeListings[idx];
    if (!l) return;
    this.myBikeListings.splice(idx, 1);
    const { askPrice, listedAt, ...bike } = l;
    bike.listed = false;
    State.garage.push(bike);
    Save.save();
    this.renderMarketFeed();
    this.renderMarketTabs();
  },

  startBikeSalesTimer() {
    if (this.bikeSalesTimer) return;
    this.bikeSalesTimer = setInterval(() => this.tickBikeSales(), 8000);
  },

  // --- seller-side haggling: buyers make offers on player listings ---
  buyerNames: ["Mike R.", "Sarah K.", "Dave", "Jen T.", "Tommy", "Alex P.", "Chris", "Sam", "Jordan", "Pat"],

  // Generate a buyer offer for a listing (called periodically)
  maybeMakeOffer() {
    // Buyers haggle on bike listings only (parts use fixed/auction)
    for (const l of this.myBikeListings) {
      if (l.sold || l.offer) continue;
      // Buyers ignore absurdly overpriced listings
      const fair = l.fairValue || l.boughtFor || 500;
      const overprice = l.askPrice / Math.max(1, fair);
      if (overprice > 3) continue; // >3x fair value = no buyers
      const chance = overprice > 2 ? 0.05 : overprice > 1.5 ? 0.10 : 0.15;
      if (Math.random() < chance) {
        this.makeBuyerOffer(l, "bike");
      }
    }
  },

  makeBuyerOffer(listing, type) {
    const askPrice = listing.askPrice;
    // Buyer personality: eager | haggler | flaky
    const styleRoll = Math.random();
    const style = styleRoll < 0.35 ? "eager" : styleRoll < 0.75 ? "haggler" : "flaky";
    // Opening offer varies by style
    const offerPct = style === "eager" ? 0.78 + Math.random() * 0.12
      : style === "haggler" ? 0.60 + Math.random() * 0.15
      : 0.65 + Math.random() * 0.20;
    const offerAmount = Math.round((askPrice * offerPct) / 5) * 5;
    const buyerName = this.buyerNames[(Math.random() * this.buyerNames.length) | 0];
    const maxPct = style === "eager" ? 0.95 + Math.random() * 0.10
      : style === "haggler" ? 0.85 + Math.random() * 0.12
      : 0.80 + Math.random() * 0.15;
    // Smooth Talker: buyers open higher and stretch further
    const stBonus = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    // Good copy earns buyers' trust (sell score 0-3 → up to +9%, capped by fair value)
    const sellScore = this.descSellScore(listing.desc || "");
    const sellBonus = sellScore * 0.03;
    const boostedOffer = Math.round((offerAmount * (1 + stBonus + sellBonus)) / 5) * 5;
    let boostedMax = Math.round((askPrice * maxPct * (1 + stBonus)) / 5) * 5;
    // Hard cap: buyers won't pay more than 1.5x fair value, no matter the asking price
    const fairCap = Math.round(((listing.fairValue || listing.boughtFor || 500) * 1.5) / 5) * 5;
    boostedMax = Math.min(boostedMax, fairCap);
    listing.offer = {
      amount: offerAmount,
      buyerName,
      style,
      rounds: 0,
      maxAmount: boostedMax,
      type,
      thread: [{ from: "buyer", text: this.randomOpener(style, boostedOffer) }],
    };
    listing.offer.amount = boostedOffer;
    // Only toast if not on the listings screen (badge handles it there)
    const onListings = (this.current === "market" && this.marketTab === "mine") ||
                       (this.current === "parts" && this.boneyardTab === "sell");
    if (!onListings) UI.toast(`${buyerName} made an offer!`);
    this.updateNavBadges();
    // Refresh the relevant view
    if (this.current === "market" && this.marketTab === "mine") {
      this.renderMarketFeed(); this.renderMarketTabs();
    }
    if (this.current === "parts" && this.boneyardTab === "sell") {
      this.renderParts();
    }
  },

  // Open the haggle chat for a listing
  openSellerHaggle(listingsArray, idx) {
    const l = listingsArray[idx];
    if (!l || !l.offer) return;
    this.haggleListing = l;
    this.haggleListingsArray = listingsArray;
    this.haggleIdx = idx;
    this.renderSellerHaggle();
    document.getElementById("seller-haggle").classList.remove("hidden");
  },

  closeSellerHaggle() {
    document.getElementById("seller-haggle").classList.add("hidden");
    this.haggleListing = null;
  },

  renderSellerHaggle() {
    const l = this.haggleListing;
    if (!l) return;
    const el = document.getElementById("seller-haggle");
    const offer = l.offer;
    const isBike = offer.type === "bike";
    const title = isBike ? `${l.brand} ${l.model}` : `${l.partLabel} — ${l.bikeBrand} ${l.bikeModel}`;
    const img = isBike ? `assets/bikes/${l.sprite}.png`
      : partImg(l.bikeSprite, l.partKey, pctToState(ensurePct(l)));

    el.innerHTML = `
      <div class="haggle-modal">
        <div class="haggle-head">
          <button class="haggle-close" id="haggle-close">${Icon.get('close')}</button>
          <div class="haggle-title">${title}</div>
          <div class="haggle-sub">Asking ${money(l.askPrice)} · Offer ${money(offer.amount)}</div>
        </div>
        <div class="haggle-photo"><img src="${img}" alt="${title}"></div>
        <div class="msg-thread" id="haggle-thread">` +
          offer.thread.map(m => `<div class="msg ${m.from === "you" ? "you" : "seller"}"><span class="msg-name">${m.from === "you" ? "You" : offer.buyerName}</span>${m.text}</div>`).join("") +
        `</div>
        <div class="haggle-actions">
          <button class="haggle-accept" id="haggle-accept">Accept ${money(offer.amount)}</button>
          <div class="haggle-counter-row">
            <input type="number" inputmode="numeric" id="haggle-counter" placeholder="Counter offer">
            <button class="haggle-counter" id="haggle-send-counter">Counter</button>
          </div>
          <button class="haggle-decline" id="haggle-decline">Decline</button>
        </div>
      </div>`;

    document.getElementById("haggle-close").addEventListener("click", () => this.closeSellerHaggle());
    document.getElementById("haggle-accept").addEventListener("click", () => this.acceptBuyerOffer());
    document.getElementById("haggle-decline").addEventListener("click", () => this.declineBuyerOffer());
    document.getElementById("haggle-send-counter").addEventListener("click", () => {
      const input = document.getElementById("haggle-counter");
      const val = parseInt(input.value.replace(/[^0-9]/g, ""), 10);
      if (val > 0) {
        input.blur();
        this.counterBuyerOffer(val);
      }
    });
    // Scroll thread to bottom
    const thread = document.getElementById("haggle-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  },

  acceptBuyerOffer() {
    const l = this.haggleListing;
    const offer = l.offer;
    const amount = offer.amount;
    // Complete the sale
    State.cash += amount;
    UI.refreshCash();
    Save.save();
    // Mark as sold (keep visible)
    l.sold = true; l.soldFor = amount; l.soldAt = Date.now();
    l.offer = null; // clear pending offer so the notification dot goes away
    if (offer.type === "bike") {
      State.sold.push({ ...l, soldFor: amount, soldAt: Date.now() });
    }
    offer.thread.push({ from: "you", text: `Deal! ${money(amount)} it is.` });
    offer.thread.push({ from: "buyer", text: this.randomAcceptResponse() });
    // XP: profit = sale price - cost basis (purchase + repairs)
    const costBasis = (l.boughtFor || l.paidPrice || 0) + (l.repairSpent || 0);
    const profit = amount - costBasis;
    if (profit > 0) {
      State.stats.totalProfit += profit;
      State.stats.bikesSoldForProfit++;
    }
    State.stats.successfulHaggles++;
    if (typeof Milestones !== "undefined") Milestones.check(State.stats);
    const xpResult = Skills.awardForSale(amount, costBasis);
    if (xpResult.xp > 0) XPPopup.show(xpResult.xp, xpResult.newPoints);
    this.closeSellerHaggle();
    // Refresh views
    if (this.current === "market") { this.renderMarketFeed(); this.renderMarketTabs(); }
    if (this.current === "parts") this.renderParts();
  },

  declineBuyerOffer() {
    const l = this.haggleListing;
    const offer = l.offer;
    offer.thread.push({ from: "you", text: `Sorry, can't do ${money(offer.amount)}.` });
    offer.thread.push({ from: "buyer", text: this.randomDeclineResponse() });
    // Clear the offer, listing stays active
    l.offer = null;
    this.closeSellerHaggle();
    if (this.current === "market") { this.renderMarketFeed(); this.renderMarketTabs(); }
    if (this.current === "parts") this.renderParts();
  },

  counterBuyerOffer(counterAmount) {
    const l = this.haggleListing;
    const offer = l.offer;
    offer.rounds = (offer.rounds || 0) + 1;
    offer.thread.push({ from: "you", text: `How about ${money(counterAmount)}?` });

    const max = offer.maxAmount;
    const style = offer.style || "haggler";
    let response, accepted = false, walkedAway = false;

    // Style modifiers
    const patience = style === "eager" ? 0.9 : style === "haggler" ? 0.5 : 0.3;
    const walkChance = style === "flaky" ? 0.40 : style === "eager" ? 0.10 : 0.25;

    if (counterAmount <= max) {
      // Within budget — eagers accept fast, hagglers try one more squeeze
      if (style === "haggler" && offer.rounds < 2 && Math.random() < 0.4) {
        const squeeze = Math.round(((offer.amount + counterAmount) / 2) / 5) * 5;
        offer.amount = Math.min(squeeze, max);
        response = `Almost... can we do ${money(offer.amount)}? Meet me there and it's a deal.`;
      } else {
        accepted = true;
        response = this.randomCounterAcceptResponse(counterAmount, style);
        offer.amount = counterAmount;
      }
    } else if (counterAmount <= max * 1.10) {
      // Close to max
      if (Math.random() < patience) {
        const newOffer = Math.round(((offer.amount + counterAmount) / 2) / 5) * 5;
        offer.amount = Math.min(newOffer, max);
        response = this.randomCounterBackResponse(offer.amount, style);
      } else {
        accepted = true;
        response = this.randomCounterAcceptResponse(counterAmount, style);
        offer.amount = counterAmount;
      }
    } else {
      // Way over — likely walk, or stretch to max
      if (Math.random() < walkChance) {
        walkedAway = true;
        response = this.randomWalkAwayResponse(style);
      } else {
        offer.amount = max;
        response = `That's my absolute ceiling — ${money(max)}. Take it or leave it.`;
      }
    }

    offer.thread.push({ from: "buyer", text: response });

    if (accepted) {
      // Auto-complete the sale
      setTimeout(() => this.acceptBuyerOffer(), 800);
    } else if (walkedAway) {
      setTimeout(() => {
        l.offer = null;
        this.closeSellerHaggle();
        if (this.current === "market") { this.renderMarketFeed(); this.renderMarketTabs(); }
        if (this.current === "parts") this.renderParts();
      }, 1200);
    } else {
      // Re-render with updated offer
      this.renderSellerHaggle();
    }
  },

  // Buyer reply picker — never repeats the last one
  _lastBuyerReply: null,
  pickBuyerReply(options) {
    this._recentBuyerReplies = this._recentBuyerReplies || [];
    let pool = options.filter(o => !this._recentBuyerReplies.includes(o));
    if (!pool.length) pool = options;
    const pick = pool[(Math.random() * pool.length) | 0];
    this._recentBuyerReplies.push(pick);
    if (this._recentBuyerReplies.length > 3) this._recentBuyerReplies.shift();
    return pick;
  },

  randomOpener(style, amount) {
    if (style === "eager") return this.pickBuyerReply([
      `Hi! I love this bike. Would you take ${money(amount)}? I can pick up today.`,
      `This is exactly what I've been looking for! Is ${money(amount)} fair?`,
      `Hey! I'll take it for ${money(amount)} — cash in hand, can come now.`,
      `OMG yes. ${money(amount)}? Please say yes.`,
      `I've been hunting for one of these forever. ${money(amount)} work for you?`,
      `Hi there! Very interested. I can do ${money(amount)} and pick up this weekend.`,
      `This looks perfect. Would ${money(amount)} get it done?`,
      `Hey, I'm serious about buying. ${money(amount)} — I can Venmo a deposit right now.`,
      `Hey!! This is the one!! Would you do ${money(amount)}?? I can come TODAY.`,
      `I've been refreshing this listing for days. ${money(amount)}? Please?`,
      `Yes! Finally! ${money(amount)} — I can be there in an hour.`,
      `Hi! I'm ready to buy right now. Is ${money(amount)} okay??`,
      `This is PERFECT. ${money(amount)}? I won't haggle, I promise.`,
      `Hey hey! I'll take it! ${money(amount)} cash, today, no games.`,
      `OMG I've wanted one of these since I was a kid. ${money(amount)}?`,
      `Hi there — I'm very motivated. ${money(amount)} and I pick up tonight?`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `Hi, is this still available? Would ${money(amount)} work?`,
      `hey is this avail?? i got ${money(amount)}`,
      `Interested... maybe. ${money(amount)}?`,
      `Hi! Might be interested. What's the lowest you'd go? I was thinking ${money(amount)}.`,
      `yo still got this? ${money(amount)} cash`,
      `Hello, I am interested in your moped. I can offer ${money(amount)}.`,
      `Is this still for sale? Lmk, I have ${money(amount)}.`,
      `Hii! Do you still have it?? I could do like ${money(amount)}?`,
      `hi... is this thing still around? ${money(amount)}? maybe?`,
      `yo. u still selling? i could do ${money(amount)} i think`,
      `Hey, sorry, might've messaged before lol. ${money(amount)}?`,
      `is this available still?? asking for a friend. ${money(amount)}`,
      `Hi! I'm kinda interested? ${money(amount)}? no pressure lol`,
      `hey man still got it? ${money(amount)} cash money`,
      `Hello — just browsing really. But ${money(amount)}?`,
      `yo is this the one from the pics? ${money(amount)}?`,
    ]);
    return this.pickBuyerReply([
      `Hey, interested. What's your bottom dollar? I could do ${money(amount)}.`,
      `Nice bike. I'm looking at a few — ${money(amount)} is where I'm at.`,
      `Hey there. I know what these go for. ${money(amount)}, cash today.`,
      `Interested buyer here. My offer is ${money(amount)} — firm.`,
      `Good looking bike. I'll give you ${money(amount)} for it right now.`,
      `Hey, I'll be straight with you: ${money(amount)} is my max.`,
      `I've bought a few of these. ${money(amount)} is a fair price.`,
      `Morning. ${money(amount)} cash, no hassle, no tire-kickers.`,
      `Hey. Done my homework on these. ${money(amount)} is the number.`,
      `Interested. I've got ${money(amount)} cash and I'm nearby.`,
      `Nice. I'm comparing a couple options — ${money(amount)} gets my attention.`,
      `I'll offer ${money(amount)}. That's a strong offer in this market.`,
      `Hey there, I flip these myself. ${money(amount)} is fair, you know it.`,
      `Cash buyer, no drama. ${money(amount)}. Let me know.`,
      `Morning. I can do ${money(amount)} today — that's my honest offer.`,
      `Look, I'll cut to it: ${money(amount)}. No back and forth needed.`,
    ]);
  },

  randomAcceptResponse() {
    return this.pickBuyerReply([
      "Awesome, thanks!",
      "Perfect! When can I pick it up?",
      "Great, deal!",
      "Sweet, I'll take it!",
      "Amazing! I'll bring cash. What time works?",
      "Yes! So excited for this.",
      "Deal! You're the best.",
      "Perfect. I'll see you soon!",
      "Let's do it! Sending you my number.",
      "Awesome! This made my week.",
      "Great! I'll bring a truck.",
      "Done deal! Thank you!",
      "Fantastic! When works for pickup?",
      "Yes! I'll bring cash. Thank you!",
      "Great! I'm on my way — text me the address.",
      "Perfect, deal! You just made my day.",
      "Awesome! I'll see you this evening?",
      "Done! I'll bring a buddy with a truck.",
      "Sweet! Can't wait to see it in person.",
      "Excellent! I'll Venmo a deposit now if you want.",
      "Woo! Okay, what time should I come by?",
      "Great news! I'll bring exact cash.",
      "Love it. See you soon — thanks again!",
      "Deal! I'll clear my schedule for pickup.",
    ]);
  },

  randomDeclineResponse() {
    return this.pickBuyerReply([
      "No worries, thanks anyway.",
      "Alright, let me know if you change your mind.",
      "Ok, good luck with the sale!",
      "Thanks for getting back to me. I'll keep looking.",
      "No problem! Hope you sell it soon.",
      "Understood. Good luck!",
      "Appreciate the reply. Maybe next time.",
      "Got it, thanks! I'll keep hunting.",
      "Fair enough. Good luck with the sale!",
      "No hard feelings. Thanks!",
      "All good, thanks for the reply!",
      "Okay, I'll keep looking. Good luck!",
      "No problem at all. Hope it sells fast!",
      "Gotcha. Thanks for letting me know!",
      "Fair enough! Good luck with the sale.",
      "Thanks anyway — I'll find the right one eventually.",
      "Appreciate you getting back to me!",
      "Understood, no worries. Good luck!",
      "Okay cool, thanks! I'll keep browsing.",
      "No sweat. Hope you get your asking price!",
    ]);
  },

  randomCounterAcceptResponse(amount, style) {
    if (style === "eager") return this.pickBuyerReply([
      `Yes! ${money(amount)} — I'll take it!`,
      `Deal! ${money(amount)}. When can I come get it?`,
      `${money(amount)}? YES. I'm on my way.`,
      `Absolutely! ${money(amount)} works. Thank you!`,
      `${money(amount)} — done! I'll bring cash.`,
      `Yes yes yes! ${money(amount)}. See you soon!`,
      `${money(amount)}? Deal! I'm so excited.`,
      `Perfect! ${money(amount)}. I'll pick up today if that works.`,
      `YES! ${money(amount)}! I'm literally grabbing my keys.`,
      `Deal deal deal! ${money(amount)}! What time??`,
      `${money(amount)} — absolutely! You're the best!`,
      `I'll take it at ${money(amount)}! See you in 20 minutes?`,
      `YES. ${money(amount)}. This is happening!`,
      `Perfect!! ${money(amount)} — I'm so happy right now.`,
      `${money(amount)}? SOLD. I'll bring cash and a huge smile.`,
      `Done! ${money(amount)}! Text me where to meet!`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `Ugh, fine. ${money(amount)}.`,
      `Alright alright, ${money(amount)}.`,
      `...okay. ${money(amount)}. I guess.`,
      `Fine. ${money(amount)}. When can I get it?`,
      `Ehh. ${money(amount)}. Sure.`,
      `OK ${money(amount)}. Don't make me regret this lol`,
      `${money(amount)}. Yeah okay.`,
      `Whatever, ${money(amount)}. It's fine.`,
      `ugh ok fine. ${money(amount)}. when tho`,
      `alright ${money(amount)}. i guess im buying a moped today lol`,
      `...fine. ${money(amount)}. dont flake on me tho`,
      `${money(amount)}. k.`,
      `meh ok. ${money(amount)}. see u whenever`,
      `FINE. ${money(amount)}. happy? lol`,
      `${money(amount)} sure. lmk when`,
      `ok ok ${money(amount)}. i'll figure out pickup later`,
    ]);
    return this.pickBuyerReply([
      `Hmm... ${money(amount)}. Yeah, I can do that.`,
      `Alright, ${money(amount)} works for me.`,
      `You drive a hard bargain. ${money(amount)} it is.`,
      `${money(amount)}? Deal. You've got yourself a buyer.`,
      `Okay, ${money(amount)}. I can live with that.`,
      `Fine — ${money(amount)}. Let's get this done.`,
      `${money(amount)}. Agreed. When's good for pickup?`,
      `Alright, I'll do ${money(amount)}. Good negotiating.`,
      `${money(amount)}... yeah. Okay, I'm in.`,
      `Deal at ${money(amount)}. I respect the hustle.`,
      `${money(amount)}. Alright, you've got a deal. Well played.`,
      `Okay — ${money(amount)}. I can respect a tough negotiator.`,
      `Deal. ${money(amount)}. I think we both did fine here.`,
      `${money(amount)} it is. I'll bring cash this afternoon.`,
      `You've got yourself a deal at ${money(amount)}.`,
      `Fine, ${money(amount)}. You held firm — I respect that.`,
      `Agreed at ${money(amount)}. Let's wrap this up.`,
      `${money(amount)}... alright. I'm in. Good doing business.`,
      `I'll take it at ${money(amount)}. Fair is fair.`,
      `Done at ${money(amount)}. When's a good time for pickup?`,
    ]);
  },

  randomCounterBackResponse(amount, style) {
    if (style === "eager") return this.pickBuyerReply([
      `I can stretch to ${money(amount)} — that's really my limit.`,
      `${money(amount)} is the absolute most I can do. Please?`,
      `Okay what about ${money(amount)}? That's everything I have.`,
      `I could go ${money(amount)}... that's my ceiling though.`,
      `${money(amount)}? I'm already over budget but I want this bike.`,
      `Best I can do is ${money(amount)}. I really hope that's enough.`,
      `${money(amount)} — I'm scraping together everything I've got.`,
      `Could you do ${money(amount)}? I'd be so grateful.`,
      `I can do ${money(amount)}! Please, I really want this one.`,
      `${money(amount)} — that's every dollar I have, I swear.`,
      `What if I do ${money(amount)}? I can come right now!`,
      `Okay okay — ${money(amount)}? That's my max, for real.`,
      `I could stretch to ${money(amount)}... that's it though!`,
      `Please? ${money(amount)}? I'll bring coffee too!`,
      `${money(amount)}! Final offer! I'm begging here!`,
      `I can make ${money(amount)} work — can you? Please say yes.`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `Meh, ${money(amount)} is all I'd do.`,
      `${money(amount)}? Take it or I'm out.`,
      `idk, ${money(amount)} max. lmk`,
      `${money(amount)}. that's it. no more.`,
      `I guess I could do ${money(amount)}? Maybe?`,
      `${money(amount)} or I'm gonna look at the other one.`,
      `Ehh ${money(amount)}. Final. Probably.`,
      `${money(amount)}? I'll think about it. Actually yeah, ${money(amount)}.`,
      `like... ${money(amount)}? idk`,
      `${money(amount)}. maybe. we'll see lol`,
      `i mean i could do ${money(amount)}? or not. lmk`,
      `${money(amount)}? eh. i'll let u know`,
      `whatever, ${money(amount)}. if u want`,
      `hmm ${money(amount)}. i'll think abt it`,
      `${money(amount)}?? fine? i guess?`,
      `ok ${money(amount)}. actually wait. yeah ${money(amount)}.`,
    ]);
    return this.pickBuyerReply([
      `That's a bit steep for me. How about ${money(amount)}?`,
      `I can't go that high. ${money(amount)} is my best.`,
      `Meet me at ${money(amount)}?`,
      `I hear you, but ${money(amount)} is where I land.`,
      `What about ${money(amount)}? I'm trying to stay in budget.`,
      `${money(amount)} is my max. I wish I could go higher.`,
      `Could we do ${money(amount)}? That's a stretch for me already.`,
      `I'd love to say yes, but ${money(amount)} is all I've got.`,
      `${money(amount)}. That's me meeting you in the middle.`,
      `How's ${money(amount)}? I think that's fair for both of us.`,
      `I can come up to ${money(amount)}. That's genuinely my ceiling.`,
      `How about ${money(amount)}? I'm being straight with you.`,
      `${money(amount)} — and I'll pick up today, no hassle.`,
      `Let's settle at ${money(amount)}. I think that's right.`,
      `My final is ${money(amount)}. I hope we can make it work.`,
      `I'll go ${money(amount)}. That's a fair number for both of us.`,
      `What do you say to ${money(amount)}? Cash, today.`,
      `${money(amount)} is the best I can do — and it's a good offer.`,
      `Split the difference at ${money(amount)}? I'm trying here.`,
      `Okay, ${money(amount)}. That's me stretching. Your move.`,
    ]);
  },

  randomWalkAwayResponse(style) {
    if (style === "flaky") return this.pickBuyerReply([
      "lol no. bye.",
      "Yeah I'm out.",
      "nvm lol",
      "nah I'm good",
      "lol okay bye",
      "yeah no thanks",
      "I'm gonna pass lol",
      "meh. bye!",
      "lol nah",
      "k bye",
      "pass lol",
      "nvm changed my mind",
      "ehh no",
      "lol sorry bye",
      "nahhh",
      "im out lol",
    ]);
    if (style === "eager") return this.pickBuyerReply([
      "Ah man, I really wanted this. Good luck!",
      "Dang. Okay, thanks anyway. If it doesn't sell, lmk?",
      "I can't swing that. Really bummed. Good luck!",
      "That's out of my range. Hope you find a buyer!",
      "Man... okay. Thanks for your time!",
      "I wish I could. Good luck with the sale!",
      "Ahh, I can't do it. So sad. Good luck though!",
      "That's too much for me. I'm crushed, honestly. Good luck!",
      "I really wanted it... okay. Hope it goes to a good home!",
      "Can't make it work. Thanks anyway — good luck!",
      "Dang, that's a bummer. Good luck with the sale!",
      "I wish! Maybe next time. Good luck!",
    ]);
    return this.pickBuyerReply([
      "Yeah that's too rich for my blood. Good luck!",
      "Can't do that. I'll keep looking.",
      "No way. Thanks anyway.",
      "That's above market. I'll pass.",
      "Appreciate it, but I'll have to walk.",
      "Too steep for me. Good luck selling!",
      "I'll keep shopping around. Thanks!",
      "Not at that price. Best of luck!",
      "Too high. I'll find one cheaper. Good luck.",
      "Not at that price. Thanks for your time.",
      "Yeah, I can't justify that. Moving on.",
      "That's over what these go for. I'll pass.",
      "Appreciate it, but no. Good luck selling.",
      "I'm out at that number. Take care.",
      "No deal. I'll keep hunting.",
      "Too steep. Someone else will pay it — not me.",
    ]);
  },

  tickBikeSales() {
    this.maybeMakeOffer();
    if (!this.myBikeListings.length) return;
    for (let i = this.myBikeListings.length - 1; i >= 0; i--) {
      const l = this.myBikeListings[i];
      if (l.sold) continue;
      const fairness = (l.fairValue || l.boughtFor || 500) / Math.max(1, l.askPrice);
      const chance = Math.min(0.20, 0.05 * fairness);
      if (Math.random() < chance) {
        l.sold = true; l.soldFor = l.askPrice; l.soldAt = Date.now();
        State.cash += l.askPrice;
        State.sold.push({ ...l, soldFor: l.askPrice, soldAt: Date.now() });
        UI.refreshCash();
        Save.save();
        if (!(this.current === "market" && this.marketTab === "mine")) {
        }
        if (this.current === "market") {
          this.renderMarketFeed();
          this.renderMarketTabs();
        }
      }
    }
  },

  tickSales() {
    this.maybeMakeOffer();
    if (!this.myPartListings.length) return;
    // Each listing has a chance to sell every tick
    // Better prices (closer to market value) sell faster
    for (let i = this.myPartListings.length - 1; i >= 0; i--) {
      const l = this.myPartListings[i];
      if (l.sold) continue;
      l.ticksListed = (l.ticksListed || 0) + 1;
      // Base 8% chance per 5s tick, adjusted by price fairness
      const marketPrice = Math.round(PART_BASE_PRICE[l.partKey] * PART_COND_MULT[l.state] || 20);
      const fairness = marketPrice / Math.max(1, l.askPrice); // >1 = good deal, <1 = overpriced
      const chance = Math.min(0.30, 0.08 * fairness);
      if (Math.random() < chance) {
        l.sold = true; l.soldFor = l.askPrice; l.soldAt = Date.now();
        this.unseenPartSales++;
        this.updateNavBadges();
        State.cash += l.askPrice;
        UI.refreshCash();
        // XP for part sale profit
        const partCostBasis = (l.paidPrice || 0) + (l.repairSpent || 0);
        const partXp = Skills.awardForSale(l.askPrice, partCostBasis);
        if (partXp.xp > 0 && !(this.current === "parts" && this.boneyardTab === "sell")) {
          XPPopup.show(partXp.xp, partXp.newPoints);
        }
        Save.save();
        if (!(this.current === "parts" && this.boneyardTab === "sell")) {
        }
        if (this.current === "parts" && this.boneyardTab === "sell") {
          this.renderParts();
        }
      }
    }
  },

  showPartPriceInput(el, idx, listType, marketPrice) {
    const isAuction = listType === "auction";
    const btnText = isAuction ? "Start Auction (60s)" : "List";
    const part = (State.parts || [])[idx];
    const paid = part && part.paidPrice ? money(part.paidPrice) : "—";
    // Replace the type row with price input
    const row = el.querySelector(".sell-type-row");
    if (row) {
      row.outerHTML = `<div class="sell-price-row">
        <div class="sell-price-info">Fair market: <strong>${money(marketPrice)}</strong> · You paid: <strong>${paid}</strong></div>
        <div class="sell-price-inputrow">
          <input type="number" inputmode="numeric" id="sell-price-${idx}" value="${marketPrice}" min="1">
          <button class="eby-confirm" data-confirm-sell="${idx}" data-ltype="${listType}">${btnText}</button>
          <button class="eby-cancel" data-cancel-sell>${Icon.get('close')}</button>
        </div>
      </div>`;
      const input = el.querySelector(`#sell-price-${idx}`);
      const confirmBtn = el.querySelector(`[data-confirm-sell="${idx}"]`);
      const cancelBtn = el.querySelector(`[data-cancel-sell]`);
      if (confirmBtn) confirmBtn.addEventListener("click", () => {
        input.blur();
        const ltype = confirmBtn.dataset.ltype;
        if (ltype === "auction") {
          this.listPartAuction(idx, input.value);
        } else {
          this.listPartForSale(idx, input.value);
        }
      });
      if (cancelBtn) cancelBtn.addEventListener("click", () => this.renderGarage());
      if (input) input.focus();
    }
  },

  // List a part from inventory for sale (fixed price)
  listPartForSale(invIdx, price) {
    const parts = State.parts || [];
    const p = parts[invIdx];
    if (!p) return;
    price = parseInt(String(price).replace(/[^0-9]/g, ""), 10);
    if (!price || price <= 0) {
      return;
    }
    // Remove from inventory, add to listings
    parts.splice(invIdx, 1);
    this.myPartListings.push({
      ...p,
      askPrice: price,
      listedAt: Date.now(),
      ticksListed: 0,
    });
    // Dismiss keyboard
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    // Stay on garage inventory (where the user is) — part is now gone from here
    this.garageTab = "parts";
    this.garageDetailIdx = -1;
    Save.save();
    this.renderGarage();
  },

  // List a part as a 60-second auction
  listPartAuction(invIdx, startPrice) {
    const parts = State.parts || [];
    const p = parts[invIdx];
    if (!p) return;
    startPrice = parseInt(String(startPrice).replace(/[^0-9]/g, ""), 10);
    if (!startPrice || startPrice <= 0) {
      return;
    }
    parts.splice(invIdx, 1);
    const pct = ensurePct(p);
    const state = pctToState(pct);
    // Generate bidders with secret budgets
    const bidderCount = 2 + ((Math.random() * 3) | 0);
    const bidders = [];
    const names = ["Mike R.", "Sarah K.", "Dave", "Jen T.", "Tommy", "Alex P.", "Chris", "Sam"];
    const used = new Set();
    for (let i = 0; i < bidderCount; i++) {
      let n;
      do { n = names[(Math.random() * names.length) | 0]; } while (used.has(n));
      used.add(n);
      const market = (PART_BASE_PRICE[p.partKey] || 20) * (PART_COND_MULT[state] || 0.3);
      bidders.push({ name: n, maxBid: Math.round(market * (0.9 + Math.random() * 0.6)) });
    }
    this.myPartListings.push({
      ...p,
      listingType: "auction",
      startPrice,
      currentBid: startPrice,
      highBidder: null,
      timeLeft: 60,
      bidders,
      listedAt: Date.now(),
    });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.startPlayerAuctionTimer();
    this.garageTab = "parts";
    this.garageDetailIdx = -1;
    Save.save();
    this.renderGarage();
  },

  startPlayerAuctionTimer() {
    if (this.playerAuctionTimer) return;
    this.playerAuctionTimer = setInterval(() => this.tickPlayerAuctions(), 1000);
  },

  tickPlayerAuctions() {
    let hasActive = false;
    for (let i = this.myPartListings.length - 1; i >= 0; i--) {
      const l = this.myPartListings[i];
      if (l.listingType !== "auction" || l.sold) continue;
      hasActive = true;
      l.timeLeft--;
      const urgency = l.timeLeft <= 10 ? 0.35 : 0.12;
      if (Math.random() < urgency) {
        const candidates = l.bidders.filter(b => b.name !== l.highBidder && b.maxBid > l.currentBid);
        if (candidates.length) {
          const bidder = candidates[(Math.random() * candidates.length) | 0];
          const increment = Math.max(1, Math.round(l.currentBid * 0.08));
          const newBid = Math.min(l.currentBid + increment, bidder.maxBid);
          if (newBid > l.currentBid) {
            l.currentBid = newBid;
            l.highBidder = bidder.name;
          }
        }
      }
      if (l.timeLeft <= 0) {
        const endedNow = true;
        if (l.highBidder) {
          l.sold = true; l.soldFor = l.currentBid; l.soldAt = Date.now();
          State.cash += l.currentBid;
          this.unseenPartSales++;
          this.updateNavBadges();
          UI.refreshCash();
          // XP for auction sale profit
          const aucCostBasis = (l.paidPrice || 0) + (l.repairSpent || 0);
          const aucXp = Skills.awardForSale(l.currentBid, aucCostBasis);
          if (aucXp.xp > 0 && !(this.current === "parts" && this.boneyardTab === "sell")) {
            XPPopup.show(aucXp.xp, aucXp.newPoints);
          }
          Save.save();
          if (!(this.current === "parts" && this.boneyardTab === "sell")) {
          }
        } else {
          const { listingType, startPrice, currentBid, highBidder, timeLeft, bidders, listedAt, ...part } = l;
          State.parts = State.parts || [];
          State.parts.push(part);
          // Remove the listing entirely (ended with no sale) — prevents reprocessing
          this.myPartListings.splice(i, 1);
          Save.save();
        }
        // Refresh to show SOLD state
        setTimeout(() => this.refreshAfterAuctionEnd(), 100);
      }
    }
    if (!hasActive && this.playerAuctionTimer) {
      clearInterval(this.playerAuctionTimer);
      this.playerAuctionTimer = null;
    }
    // Update timers in place (no full re-render = no flashing)
    if (this.current === "parts" && this.boneyardTab === "sell") {
      const el = document.getElementById("parts-view");
      if (el) {
        // Update each auction's timer badge and bid display
        this.myPartListings.forEach((l) => {
          if (l.listingType !== "auction" || l.sold) return;
          // Find the badge by matching the listing — use index-based lookup
          const idx = this.myPartListings.indexOf(l);
          const items = el.querySelectorAll(".eby-item.eby-auction");
          // Match by position in filtered list
          const shown = this.myPartListings
            .filter(x => this.partListingFilter === "all" ? true
              : this.partListingFilter === "active" ? !x.sold : x.sold);
          const shownIdx = shown.indexOf(l);
          if (shownIdx >= 0 && items[shownIdx]) {
            const badge = items[shownIdx].querySelector(".eby-auc-badge");
            if (badge) badge.textContent = `⏱ ${Math.max(0, l.timeLeft)}s`;
            const priceEl = items[shownIdx].querySelector(".eby-price");
            if (priceEl) priceEl.textContent = money(l.currentBid);
            const bidsEl = items[shownIdx].querySelector(".eby-bids");
            if (bidsEl) bidsEl.textContent = l.highBidder ? `High bidder: ${l.highBidder}` : "No bids yet";
            const metaEl = items[shownIdx].querySelector(".eby-meta");
            if (metaEl && !l.sold) metaEl.textContent = `Your auction · ends in ${Math.max(0, l.timeLeft)}s`;
          }
        });
      }
      // If an auction just ended, do a full refresh to show SOLD state
      // (check if any recently sold)
    }
  },

  // Call this when an auction ends to refresh the SOLD display
  refreshAfterAuctionEnd() {
    if (this.current === "parts" && this.boneyardTab === "sell") {
      this.renderParts(true);
    }
  },

  delistPart(idx) {
    const l = this.myPartListings[idx];
    if (!l) return;
    this.myPartListings.splice(idx, 1);
    State.parts = State.parts || [];
    // Return to inventory (strip listing metadata)
    const { askPrice, listedAt, ticksListed, ...part } = l;
    State.parts.push(part);
    Save.save();
    this.renderParts();
  },

  myListingsHTML() {
    if (!this.myPartListings.length) {
      return `<div class="eby-list"><div class="empty">
        <strong>No listings yet</strong>
        List parts from your inventory to sell them here.</div></div>`;
    }
    const filterHtml = `
      <div class="eby-typefilter">
        <button class="eby-type${this.partListingFilter === "active" ? " active" : ""}" data-pf="active">Active</button>
        <button class="eby-type${this.partListingFilter === "sold" ? " active" : ""}" data-pf="sold">Sold</button>
      </div>`;
    const shown = this.myPartListings
      .map((l, i) => ({ ...l, idx: i }))
      .filter(l => this.partListingFilter === "active" ? !l.sold : l.sold);
    if (!shown.length) {
      return filterHtml + `<div class="eby-list"><div class="empty"><strong>Nothing here</strong>No ${this.partListingFilter} listings.</div></div>`;
    }
    return filterHtml + `<div class="eby-list">` +
      shown.map((l) => {
        const i = l.idx;
        const pct = ensurePct(l);
        const state = pctToState(pct);
        const img = partImg(l.bikeSprite, l.partKey, state);
        const isAuction = l.listingType === "auction";
        if (isAuction) {
          const secs = Math.max(0, l.timeLeft);
          return `
      <div class="eby-item eby-auction">
        <div class="eby-thumb"><img src="${img}" alt="${l.partLabel}" loading="lazy">
          <div class="eby-auc-badge">⏱ ${secs}s</div></div>
        <div class="eby-info">
          <div class="eby-name">${l.partLabel} for ${l.bikeBrand} ${l.bikeModel}</div>
          <div class="eby-cond">${PART_STATE_LABEL[state]} · ${pct}%</div>
          <div class="eby-price-row">
            <span class="eby-price">${money(l.currentBid)}</span>
            <span class="eby-bids">${l.highBidder ? `High bidder: ${l.highBidder}` : "No bids yet"}</span>
          </div>
          <div class="eby-meta">${l.sold ? `Sold for ${money(l.soldFor)} to ${l.highBidder}!` : `Your auction · ends in ${secs}s`}</div>
        </div>
      </div>`;
        }
        const minsListed = Math.floor((Date.now() - l.listedAt) / 60000);
        const timeStr = minsListed < 1 ? "just now" : `${minsListed}m ago`;
        return `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${img}" alt="${l.partLabel}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${l.partLabel} for ${l.bikeBrand} ${l.bikeModel}</div>
          <div class="eby-cond">${PART_STATE_LABEL[state]} · ${pct}%</div>
          <div class="eby-price-row">
            <span class="eby-price">${l.sold ? money(l.soldFor) : money(l.askPrice)}</span>
            ${l.sold ? `<span class="sold-tag">SOLD</span>` : ""}
          </div>
          <div class="eby-meta">${l.sold ? `Sold!` : `Listed ${timeStr} · waiting for buyers...`}</div>
          ${l.sold ? "" : `<button class="eby-delist" data-delist="${i}">Remove Listing</button>`}
        </div>
      </div>`;
      }).join("") + `</div>`;
  },

  bindMyListings(el) {
    el.querySelectorAll("[data-pf]").forEach(b =>
      b.addEventListener("click", () => { this.partListingFilter = b.dataset.pf; this.renderParts(); }));
    el.querySelectorAll("[data-btab]").forEach(t =>
      t.addEventListener("click", () => {
        this.boneyardTab = t.dataset.btab;
        if (t.dataset.btab === "sell") this.clearPartsBadges();
        this.renderParts();
      }));
    el.querySelectorAll("[data-delist]").forEach(b =>
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        this.delistPart(+b.dataset.delist);
      }));

  },
  startAuctionTimer() {
    if (this.auctionTimer) return;
    this.auctionTimer = setInterval(() => this.tickAuctions(), 1000);
  },

  tickAuctions() {
    let changed = false;
    for (const p of this.partsShop) {
      if (p.listingType !== "auction" || p.ended) continue;
      p.timeLeft--;
      changed = true;
      if (p.timeLeft <= 0) {
        this.endAuction(p);
      } else {
        this.autoBid(p);
      }
    }
    // Update auction UI in place (no full re-render = no image flashing)
    if (changed && this.current === "parts" && !document.getElementById("parts-view").classList.contains("hidden")) {
      this.updateAuctionUI();
    }
    // Stop timer if no active auctions
    if (!this.partsShop.some(p => p.listingType === "auction" && !p.ended)) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }
    // Update part detail in place if open on an auction (no scroll reset)
    if (this.partDetailIdx >= 0 && !document.getElementById("part-detail").classList.contains("hidden")) {
      const p = this.partsShop[this.partDetailIdx];
      const pdEl = document.getElementById("part-detail");
      if (p && p.listingType === "auction" && !p.ended) {
        const mins = Math.floor(p.timeLeft / 60), secs = p.timeLeft % 60;
        const timeEl = pdEl.querySelector(".pd-time");
        if (timeEl) timeEl.textContent = `${mins}:${String(secs).padStart(2, "0")} left`;
        // Update bid rows
        const bidRows = pdEl.querySelectorAll(".pd-bid-row");
        if (bidRows[0]) bidRows[0].innerHTML = `Current bid: <strong>${money(p.currentBid)}</strong>`;
        if (bidRows[1]) bidRows[1].textContent = p.highBidder
          ? (p.highBidder === "you" ? "You're winning!" : `High bidder: ${p.highBidder}`)
          : "No bids yet";
        // Update price at top
        const priceEl = pdEl.querySelector(".pd-price");
        if (priceEl) priceEl.textContent = money(p.currentBid);
        // Update min bid hint and input
        const minBid = p.currentBid + (p.bidIncrement || 1);
        const hintEl = pdEl.querySelector(".pd-hint");
        if (hintEl) hintEl.textContent = `Enter ${money(minBid)} or more`;
        const inputEl = pdEl.querySelector("#pd-bid-amount");
        if (inputEl && document.activeElement !== inputEl) inputEl.value = minBid;
      } else if (!p || p.ended) {
        this.closePartDetail();
      }
    }
  },

  updateAuctionUI() {
    const el = document.getElementById("parts-view");
    for (const p of this.partsShop) {
      if (p.listingType !== "auction" || p.ended) continue;
      const idx = this.partsShop.indexOf(p);
      // Timer badge
      const badge = el.querySelector(`[data-auc-timer="${idx}"]`);
      if (badge) {
        const mins = Math.floor(p.timeLeft / 60), secs = p.timeLeft % 60;
        badge.textContent = `⏱ ${mins}:${String(secs).padStart(2, "0")}`;
      }
      // Current bid price
      const priceEl = el.querySelector(`[data-auc-price="${idx}"]`);
      if (priceEl) priceEl.textContent = money(p.currentBid);
      // Bidder status
      const bidsEl = el.querySelector(`[data-auc-bids="${idx}"]`);
      if (bidsEl) {
        const isWinning = p.highBidder === "you";
        bidsEl.textContent = p.highBidder
          ? (isWinning ? "You're winning!" : `High bidder: ${p.highBidder}`)
          : "No bids yet";
      }
      // Bid button
      const btn = el.querySelector(`[data-bid="${idx}"]`);
      if (btn) {
        const isWinning = p.highBidder === "you";
        btn.classList.toggle("winning", isWinning);
        btn.textContent = isWinning
          ? `Winning — Bid ${money(p.currentBid + p.bidIncrement)}`
          : `Place Bid — ${money(p.currentBid + p.bidIncrement)}`;
      }
    }
  },

  autoBid(p) {
    // Each bidder acts with some probability; more aggressive near the end
    const urgency = p.timeLeft <= 5 ? 0.55 : p.timeLeft <= 15 ? 0.3 : 0.15;
    for (const b of p.bidders) {
      if (p.highBidder === b.name) continue; // already winning
      const nextBid = p.currentBid + p.bidIncrement;
      if (nextBid > b.max) continue; // over budget — drops out (realistic)
      if (Math.random() < urgency) {
        p.currentBid = nextBid;
        p.highBidder = b.name;
        break; // one bid per tick max
      }
    }
  },

  playerBid(idx) {
    const p = this.partsShop[idx];
    if (!p || p.ended || p.timeLeft <= 0) return;
    const nextBid = p.currentBid + p.bidIncrement;
    if (State.cash < nextBid) {
      return;
    }
    p.currentBid = nextBid;
    p.highBidder = "you";
    this.updateAuctionUI();
  },

  endAuction(p) {
    p.ended = true;
    p.timeLeft = 0;
    const i = this.partsShop.indexOf(p);
    if (p.highBidder === "you") {
      if (State.cash >= p.currentBid) {
        State.cash -= p.currentBid;
        State.parts = State.parts || [];
        State.parts.push(p);
        if (i >= 0) this.partsShop.splice(i, 1);
        State.stats.auctionsWon++;
        if (typeof Milestones !== "undefined") Milestones.check(State.stats);
        UI.refreshCash();
      } else if (i >= 0) {
        this.partsShop.splice(i, 1);
      }
    }
    else if (i >= 0) {
      this.partsShop.splice(i, 1);
    }
    // Full re-render on auction end (item removed)
    if (this.current === "parts") this.renderParts(true);
  },

  initPartsFilter() {
    const sel = document.getElementById("parts-bike-filter");
    sel.innerHTML = `<option value="all">All bikes</option>` +
      BIKES.map(b => `<option value="${b.sprite}">${b.brand} ${b.name}</option>`).join("");
    sel.addEventListener("change", (e) => {
      this.partsFilter = e.target.value;
      this.renderParts();
    });
  },

  renderParts(preserve) {
    if (!this.partsShop.length) {
      this.partsShop = genPartsShop(16);
      this.partsShop.unshift(makeDannyPart(1000 + ((Math.random() * 9000) | 0)));
    }
    this.startAuctionTimer();
    this.startSalesTimer();
    this.startPlayerAuctionTimer();
    const el = document.getElementById("parts-view");
    // Preserve scroll position during auction ticks
    const scrollY = preserve ? el.scrollTop : 0;
    const shown = this.partsShop
      .map((p, i) => ({ ...p, idx: i }))
      .filter(p => {
        if (this.typeFilter !== "all" && p.listingType !== this.typeFilter) return false;
        if (this.partsFilter !== "all" && p.bikeSprite !== this.partsFilter) return false;
        if (this.partsSearch) {
          const q = this.partsSearch.toLowerCase();
          const hay = `${p.partLabel} ${p.bikeBrand} ${p.bikeModel}`.toLowerCase();
          return hay.includes(q);
        }
        return true;
      });
    // Buy/Sell tabs
    const btabHtml = `
      <div class="eby-typefilter">
        <button class="eby-type${this.boneyardTab === "buy" ? " active" : ""}" data-btab="buy">Buy Parts</button>
        <button class="eby-type${this.boneyardTab === "sell" ? " active" : ""}" data-btab="sell">My Listings${(() => { const n = this.myPartListings.filter(l => !l.sold).length; return n ? ` (${n})` : ""; })()}</button>
      </div>`;
    if (this.boneyardTab === "sell") {
      el.innerHTML = `
      <div class="eby-head">
        <div class="eby-title">${Icon.get('scooter')} Find parts that fit</div>
      </div>` + btabHtml + this.myListingsHTML();
      if (preserve) el.scrollTop = scrollY;
      this.bindMyListings(el);
      return;
    }
    el.innerHTML = `
      <div class="eby-head">
        <div class="eby-title">${Icon.get('scooter')} Find parts that fit</div>
        <button class="cart-btn" id="open-cart">${Icon.get('cart')}<span class="cart-badge hidden" id="cart-badge"></span></button>
      </div>` + btabHtml + `
      <div class="eby-typefilter">
        <button class="eby-type${this.typeFilter === "all" ? " active" : ""}" data-type="all">All</button>
        <button class="eby-type${this.typeFilter === "bin" ? " active" : ""}" data-type="bin">Buy It Now</button>
        <button class="eby-type${this.typeFilter === "auction" ? " active" : ""}" data-type="auction">Auctions</button>
      </div>
      <div class="eby-search"><input type="text" id="parts-search" placeholder="Search parts..." value="${this.partsSearch.replace(/"/g, "&quot;")}" autocomplete="off"></div>
      <div class="eby-list">` +
      (shown.length ? shown.map(p => {
        if (p.listingType === "auction") {
          const isWinning = p.highBidder === "you";
          const mins = Math.floor(p.timeLeft / 60), secs = p.timeLeft % 60;
          return `
      <div class="eby-item eby-auction" data-part-detail="${p.idx}">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy">
          <div class="eby-auc-badge" data-auc-timer="${p.idx}">⏱ ${mins}:${String(secs).padStart(2, "0")}</div>
        </div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${p.stateLabel} · Auction</div>
          <div class="eby-blurb">${this.partBlurb(p.state)}</div>
          ${Skills.marketTag(p)}
          <div class="eby-price-row">
            <span class="eby-price" data-auc-price="${p.idx}">${money(p.currentBid)}</span>
            <span class="eby-bids" data-auc-bids="${p.idx}">${p.highBidder ? (isWinning ? "You're winning!" : `High bidder: ${p.highBidder}`) : "No bids yet"}</span>
          </div>
          <div class="eby-meta">${p.watchers} watchers</div>
          <button class="eby-bid${isWinning ? " winning" : ""}" data-bid="${p.idx}">
            ${isWinning ? `Winning — Bid ${money(p.currentBid + p.bidIncrement)}` : `Place Bid — ${money(p.currentBid + p.bidIncrement)}`}
          </button>
        </div>
      </div>`;
        }
        return `
      <div class="eby-item" data-part-detail="${p.idx}">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${p.stateLabel}</div>
          <div class="eby-blurb">${this.partBlurb(p.state)}</div>
          ${Skills.marketTag(p)}
          <div class="eby-price-row">
            <span class="eby-price">${money(p.price)}</span>
            ${p.wasPrice ? `<span class="eby-was">${money(p.wasPrice)}</span>` : ""}
          </div>
          <div class="eby-meta">Buy It Now - Free delivery</div>
          <div class="eby-meta">${p.watchers} watchers</div>
          <button class="eby-buy" data-buy-part="${p.idx}">Buy It Now</button>
        </div>
      </div>`;
      }).join("")
      : `<div class="empty"><strong>No parts match</strong>Try different filters.</div>`) +
      `</div>`;
    if (preserve) el.scrollTop = scrollY;
    const cartBtn = el.querySelector("#open-cart");
    if (cartBtn) cartBtn.addEventListener("click", () => this.openCart());
    this.updateCartBadge();
    // Click listing → detail page (but not on buttons)
    el.querySelectorAll("[data-part-detail]").forEach(item => {
      const open = (e) => {
        if (e.target.closest("button")) return; // let buttons work
        e.preventDefault();
        this.openPartDetail(+item.dataset.partDetail);
      };
      item.addEventListener("click", open);
      let ty = 0, tx = 0;
      item.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      item.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) open(e);
      }, { passive: false });
    });
    el.querySelectorAll("[data-buy-part]").forEach(btn => {
      const buy = (e) => { e.preventDefault(); e.stopPropagation(); this.buyPart(+btn.dataset.buyPart); };
      btn.addEventListener("click", buy);
      let ty = 0, tx = 0;
      btn.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      btn.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) buy(e);
      }, { passive: false });
    });
    // Parts search (preserve focus while typing)
    const psInput = document.getElementById("parts-search");
    if (psInput && !preserve) {
      psInput.addEventListener("input", (e) => {
        this.partsSearch = e.target.value;
        const pos = e.target.selectionStart;
        this.renderParts();
        const ni = document.getElementById("parts-search");
        if (ni) { ni.focus(); ni.setSelectionRange(pos, pos); }
      });
    }
    // Buy/Sell tabs
    el.querySelectorAll("[data-btab]").forEach(t =>
      t.addEventListener("click", () => {
        this.boneyardTab = t.dataset.btab;
        if (t.dataset.btab === "sell") this.clearPartsBadges();
        this.renderParts();
      }));
    // Listing type filter
    el.querySelectorAll("[data-type]").forEach(t =>
      t.addEventListener("click", () => {
        this.typeFilter = t.dataset.type;
        this.renderParts();
      }));
    // Auction bid buttons
    el.querySelectorAll("[data-bid]").forEach(btn => {
      const bid = (e) => { e.preventDefault(); e.stopPropagation(); this.playerBid(+btn.dataset.bid); };
      btn.addEventListener("click", bid);
      let ty = 0, tx = 0;
      btn.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      btn.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) bid(e);
      }, { passive: false });
    });
  },

  // --- part detail view ---
  openPartDetail(idx) {
    const p = this.partsShop[idx];
    if (!p) return;
    this.partDetailIdx = idx;
    this.partDetailOffer = null;
    this.renderPartDetail();
    document.getElementById("part-detail").classList.remove("hidden");
  },

  closePartDetail() {
    document.getElementById("part-detail").classList.add("hidden");
    this.partDetailIdx = -1;
    this.partDetailOffer = null;
  },

  renderPartDetail() {
    const p = this.partsShop[this.partDetailIdx];
    if (!p) return;
    const el = document.getElementById("part-detail");
    const isAuction = p.listingType === "auction";

    let actionHtml = "";
    if (isAuction) {
      const mins = Math.floor(p.timeLeft / 60), secs = p.timeLeft % 60;
      const minBid = p.currentBid + (p.bidIncrement || 1);
      const isWinning = p.highBidder === "you";
      actionHtml = `
        <div class="pd-auction-info">
          <div class="pd-time">${mins}:${String(secs).padStart(2, "0")} left</div>
          <div class="pd-bid-row">Current bid: <strong>${money(p.currentBid)}</strong></div>
          <div class="pd-bid-row">${p.highBidder ? (isWinning ? "You're winning!" : `High bidder: ${p.highBidder}`) : "No bids yet"}</div>
        </div>
        <div class="pd-bid-input">
          <input type="number" inputmode="numeric" id="pd-bid-amount" value="${minBid}" min="${minBid}">
        </div>
        <button class="pd-btn-primary" id="pd-place-bid">Place bid</button>
        <div class="pd-hint">Enter ${money(minBid)} or more</div>`;
    } else {
      actionHtml = `
        <button class="pd-btn-primary" id="pd-buy-now">Buy It Now</button>
        <button class="pd-btn-outline" id="pd-add-cart">Add to cart</button>
        <button class="pd-btn-outline" id="pd-make-offer-btn">Make offer</button>
        <div class="pd-offer-section hidden" id="pd-offer-section">
          <div class="pd-offer-head">${Icon.get('chat')} Make an Offer</div>
          ${this.partDetailOffer ? `
            <div class="msg-thread">
              ${this.partDetailOffer.thread.map(m => `<div class="msg ${m.from}">${m.text}</div>`).join("")}
            </div>
            ${this.partDetailOffer.accepted ? `
              <button class="eby-buy pd-buy" id="pd-accept-offer">Buy for ${money(this.partDetailOffer.price)}</button>
            ` : ""}
          ` : `
            <div class="pd-offer-row">
              <input type="number" inputmode="numeric" id="pd-offer-amount" placeholder="Your offer ($)">
              <button class="eby-offer" id="pd-send-offer">Send Offer</button>
            </div>
          `}
        </div>`;
    }

    el.innerHTML = `
      <div class="pd-modal">
        <div class="pd-head">
          <button class="haggle-close" id="pd-close">${Icon.get('close')}</button>
        </div>
        <div class="pd-photo"><img src="${p.img}" alt="${p.partLabel}"></div>
        <div class="pd-body">
          <div class="pd-title">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="pd-price-row">
            <span class="pd-price">${isAuction ? money(p.currentBid) : money(p.price)}</span>
            ${!isAuction ? `<span class="pd-bo">or Best Offer</span>` : `<span class="pd-bo">current bid</span>`}
          </div>
          <div class="pd-ship">Free shipping</div>
          <div class="pd-ship">Free delivery</div>
          <div class="pd-cond-row">Condition <strong>${p.stateLabel}</strong></div>
          ${Skills.marketTag(p)}
          ${Skills.priceHistoryHTML(p)}
          <div class="pd-actions">${actionHtml}</div>
          <div class="pd-about">
            <div class="pd-about-head">About this item</div>
            <div class="pd-spec"><span>Condition</span><span>${p.stateLabel}</span></div>
            <div class="pd-spec"><span>Fits</span><span>${p.bikeBrand} ${p.bikeModel}</span></div>
            <div class="pd-spec"><span>Part</span><span>${p.partLabel}</span></div>
          </div>
        </div>
      </div>`;

    document.getElementById("pd-close").addEventListener("click", () => this.closePartDetail());
    if (isAuction) {
      document.getElementById("pd-place-bid").addEventListener("click", () => {
        const input = document.getElementById("pd-bid-amount");
        const val = parseInt(input.value.replace(/[^0-9]/g, ""), 10);
        const minBid = p.currentBid + (p.bidIncrement || 1);
        if (val < minBid) {
          input.value = minBid;
          return;
        }
        input.blur();
        this.placePartBid(this.partDetailIdx, val);
        this.renderPartDetail(); // refresh
      });
    } else {
      const buyBtn = document.getElementById("pd-buy-now");
      if (buyBtn) buyBtn.addEventListener("click", () => {
        this.closePartDetail();
        this.buyPart(this.partDetailIdx);
      });
      const makeOfferBtn = document.getElementById("pd-make-offer-btn");
      if (makeOfferBtn) makeOfferBtn.addEventListener("click", () => {
        document.getElementById("pd-offer-section").classList.toggle("hidden");
      });
      const cartBtn = document.getElementById("pd-add-cart");
      if (cartBtn) cartBtn.addEventListener("click", () => {
        this.addToCart(this.partDetailIdx);
      });
      const offerBtn = document.getElementById("pd-send-offer");
      if (offerBtn) offerBtn.addEventListener("click", () => {
        const input = document.getElementById("pd-offer-amount");
        const val = parseInt(input.value.replace(/[^0-9]/g, ""), 10);
        if (val > 0) {
          input.blur();
          this.sendPartOffer(val);
        }
      });
      const acceptBtn = document.getElementById("pd-accept-offer");
      if (acceptBtn) acceptBtn.addEventListener("click", () => {
        const price = this.partDetailOffer.price;
        const idx = this.partDetailIdx; // read BEFORE closing (close resets to -1)
        const part = this.partsShop[idx];
        this.closePartDetail();
        // Buy at the agreed price
        if (part && State.canAfford(price)) {
          State.cash -= price;
          part.paidPrice = price;
          State.parts = State.parts || [];
          State.parts.push(part);
          this.partsShop.splice(idx, 1);
          UI.refreshCash();
          Save.save();
          this.renderParts();
        } else if (part) {
        }
      });
    }
  },

  // Pick a random response, never repeating the last one
  _lastPartReply: null,
  pickPartReply(options) {
    let pool = options.filter(o => o !== this._lastPartReply);
    if (!pool.length) pool = options;
    const pick = pool[(Math.random() * pool.length) | 0];
    this._lastPartReply = pick;
    return pick;
  },

  // Player makes an offer on a BIN part — seller responds
  sendPartOffer(offerAmount) {
    const p = this.partsShop[this.partDetailIdx];
    if (!p) return;
    // Easter egg: the 67 meme
    if (offerAmount === 67) {
      this.partDetailOffer = { response: `"Are you serious, that meme is dead bro"`, accepted: false, price: null };
      this.renderPartDetail();
      return;
    }
    // Smooth Talker: discount boosts effective offer ratio
    const stDisc = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    const ratio = (offerAmount * (1 + stDisc)) / p.price;
    let response, accepted = false, price = null;

    if (ratio >= 0.95) {
      response = this.pickPartReply([
        `"${money(offerAmount)}? Yeah, I can do that."`,
        `"${money(offerAmount)} — sold. It's boxed and ready."`,
        `"Done. ${money(offerAmount)} and it's yours."`,
        `"${money(offerAmount)}. I'll get it in the mail today."`,
        `"Sure, ${money(offerAmount)}. Good part, good price."`,
        `"${money(offerAmount)} works for me. Shipping tomorrow."`,
        `"You got it. ${money(offerAmount)}, packed with care."`,
        `"${money(offerAmount)} — deal. Check your inbox for tracking."`,
        `"${money(offerAmount)}? You got it. This part's a good one."`,
        `"Done at ${money(offerAmount)}. I'll wrap it like it's my own."`,
        `"${money(offerAmount)} — sold. You'll be happy with this."`,
        `"Accepted! ${money(offerAmount)}. Ships within 24 hours."`,
        `"${money(offerAmount)}. Pleasure doing business."`,
        `"I'll take ${money(offerAmount)}. It's already in a box."`,
        `"${money(offerAmount)}? That's fair. It's yours."`,
      ]);
      accepted = true; price = offerAmount;
    } else if (ratio >= 0.85) {
      response = this.pickPartReply([
        `"Hmm... ${money(offerAmount)}. Alright, it's yours."`,
        `"${money(offerAmount)}? Eh... fine. Take it."`,
        `"You got me at ${money(offerAmount)}. Don't push it."`,
        `"${money(offerAmount)}... I wanted more, but okay."`,
        `"Fine. ${money(offerAmount)}. You're lucky I need shelf space."`,
        `"${money(offerAmount)}. Sold — but you're not getting another deal like this."`,
        `"Ugh, okay. ${money(offerAmount)}. It's yours."`,
        `"${money(offerAmount)} and we never speak of this discount again."`,
        `"${money(offerAmount)}? ...Okay. But I'm not happy about it."`,
        `"Fine, ${money(offerAmount)}. You caught me before coffee."`,
        `"${money(offerAmount)}. Deal. I need to clear inventory anyway."`,
        `"Alright, ${money(offerAmount)}. Don't tell the other buyers."`,
        `"I'll do ${money(offerAmount)}. You're persistent, I'll give you that."`,
        `"${money(offerAmount)} — okay. But no more haggling after this."`,
        `"Sold for ${money(offerAmount)}. I hope you appreciate this."`,
      ]);
      accepted = true; price = offerAmount;
    } else if (ratio >= 0.70) {
      const counter = Math.round(((offerAmount + p.price) / 2) * (1 - stDisc) / 5) * 5;
      response = this.pickPartReply([
        `"Can't do ${money(offerAmount)}. How about ${money(counter)}?"`,
        `"${money(offerAmount)}'s light. ${money(counter)} gets it shipped today."`,
        `"Meet me at ${money(counter)} and we got a deal."`,
        `"I can go ${money(counter)}. That's the best I can do on this one."`,
        `"How's ${money(counter)} sound? I'm already losing money here."`,
        `"${money(counter)} — final offer. These don't sit long."`,
        `"Split it with me at ${money(counter)}. Fair?"`,
        `"${money(offerAmount)} won't cover shipping. ${money(counter)} and it's on its way."`,
        `"I hear you, but ${money(counter)} is where I need to be."`,
        `"${money(counter)}? I can do that. It's a solid part."`,
        `"Let's settle at ${money(counter)}. I think that's reasonable."`,
        `"${money(offerAmount)} is close. ${money(counter)} closes the deal."`,
        `"I could do ${money(counter)} if you pay today."`,
        `"${money(counter)} and I'll upgrade you to priority shipping."`,
        `"How about ${money(counter)}? Meet me there."`,
      ]);
      price = counter;
    } else if (ratio >= 0.50) {
      const counter = Math.round((p.price * 0.9) * (1 - stDisc) / 5) * 5;
      response = this.pickPartReply([
        `"${money(offerAmount)}? That's insulting. ${money(counter)} and not a penny less."`,
        `"For ${money(offerAmount)}? Nah. ${money(counter)}, firm."`,
        `"${money(counter)}. I know what I got."`,
        `"${money(offerAmount)} is a joke. ${money(counter)}, take it or leave it."`,
        `"I've got three watchers on this. ${money(counter)} or it goes to one of them."`,
        `"${money(counter)}. That's already below market and you know it."`,
        `"Nope. ${money(counter)}. I don't haggle on the good stuff."`,
        `"${money(offerAmount)}? Cute. ${money(counter)} is the price."`,
        `"${money(counter)}. I don't budge on parts this clean."`,
        `"Look, ${money(counter)} is already a deal. Take it."`,
        `"My price is ${money(counter)}. It's worth it, trust me."`,
        `"${money(offerAmount)} doesn't work. ${money(counter)} does."`,
        `"I've sold three of these at ${money(counter)}. That's the number."`,
        `"${money(counter)}, firm. Good parts aren't cheap."`,
        `"No can do at ${money(offerAmount)}. ${money(counter)} is my line."`,
      ]);
      price = counter;
    } else {
      response = this.pickPartReply([
        `"${money(offerAmount)}?? Get outta here with that lowball."`,
        `"${money(offerAmount)} for this? Blocked. (Not really. But wow.)"`,
        `"Is this a joke? ${money(offerAmount)}?"`,
        `"${money(offerAmount)}. My scrap guy pays more than that."`,
        `"${money(offerAmount)}? I paid more for the bubble wrap."`,
        `"Do you do this at the grocery store too? ${money(offerAmount)} — no."`,
        `"${money(offerAmount)}. I'd make more parting it out myself."`,
        `"That's not an offer, that's a typo. Try again."`,
        `"${money(offerAmount)}? The photos alone cost me more in time."`,
        `"I'm going to assume you missed a zero. ${money(offerAmount)}? Really?"`,
        `"${money(offerAmount)}? This isn't a flea market."`,
        `"Ha! ${money(offerAmount)}. That's adorable."`,
        `"${money(offerAmount)} for a part this clean? Absolutely not."`,
        `"I'd lose money at ${money(offerAmount)}. Hard pass."`,
        `"${money(offerAmount)}. Did you mean to add another digit?"`,
        `"That's... no. Just no. ${money(offerAmount)}?"`,
        `"${money(offerAmount)}? I think you misread the listing."`,
        `"Come on. ${money(offerAmount)}? Even I can't do that."`,
        `"${money(offerAmount)}. I'm not even going to counter that."`,
      ]);
    }

    this.partDetailOffer = {
      thread: [
        { from: "you", text: money(offerAmount) },
        { from: "seller", text: response },
      ],
      accepted, price,
    };
    this.renderPartDetail();
  },

  // Place a custom bid amount on auction
  placePartBid(idx, amount) {
    const p = this.partsShop[idx];
    if (!p || p.listingType !== "auction") return;
    if (!State.canAfford(amount)) {
      return;
    }
    p.currentBid = amount;
    p.highBidder = "you";
    // Bidders will respond via the auction timer
    this.updateAuctionUI();
  },

  // --- shopping cart ---
  addToCart(idx) {
    const p = this.partsShop[idx];
    if (!p) return;
    if (p.listingType === "auction") {
      return;
    }
    // Don't add duplicates
    if (this.cart.includes(idx)) {
      return;
    }
    this.cart.push(idx);
    Save.save();
    this.updateCartBadge();
  },

  removeFromCart(idx) {
    const i = this.cart.indexOf(idx);
    if (i >= 0) this.cart.splice(i, 1);
    Save.save();
    this.updateCartBadge();
    this.renderCart();
  },

  cartTotal() {
    const subtotal = this.cart.reduce((sum, idx) => {
      const p = this.partsShop[idx];
      return sum + (p ? p.price : 0);
    }, 0);
    // Browser Extension: discount on parts purchases
    const discount = (typeof Skills !== "undefined") ? Skills.partsDiscount() : 0;
    return Math.round(subtotal * (1 - discount));
  },

  updateCartBadge() {
    const badge = document.getElementById("cart-badge");
    if (badge) {
      badge.textContent = this.cart.length;
      badge.classList.toggle("hidden", this.cart.length === 0);
    }
  },

  openCart() {
    this.renderCart();
    document.getElementById("cart-view").classList.remove("hidden");
  },

  closeCart() {
    document.getElementById("cart-view").classList.add("hidden");
  },

  renderCart() {
    const el = document.getElementById("cart-view");
    if (!this.cart.length) {
      el.innerHTML = `
        <div class="cart-modal">
          <div class="cart-head">
            <button class="haggle-close" id="cart-close">${Icon.get('close')}</button>
            <div class="cart-title">Your Cart</div>
          </div>
          <div class="empty"><strong>Cart is empty</strong>Add parts from the Boneyard.</div>
        </div>`;
    } else {
      const total = this.cartTotal();
      el.innerHTML = `
        <div class="cart-modal">
          <div class="cart-head">
            <button class="haggle-close" id="cart-close">${Icon.get('close')}</button>
            <div class="cart-title">Your Cart (${this.cart.length})</div>
          </div>
          <div class="cart-list">` +
            this.cart.map(idx => {
              const p = this.partsShop[idx];
              if (!p) return "";
              return `
            <div class="cart-item">
              <div class="cart-thumb"><img src="${p.img}" alt="${p.partLabel}"></div>
              <div class="cart-info">
                <div class="cart-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
                <div class="cart-cond">${p.stateLabel}</div>
                <div class="cart-price">${money(p.price)}</div>
              </div>
              <button class="cart-remove" data-cart-remove="${idx}">${Icon.get('close')}</button>
            </div>`;
            }).join("") +
          `</div>
          <div class="cart-foot">
            ${(() => { const d = (typeof Skills !== "undefined") ? Skills.partsDiscount() : 0; return d > 0 ? `<div class="cart-disc">Browser Extension: ${Math.round(d * 100)}% off applied!</div>` : ""; })()}
            <div class="cart-total">Total: <strong>${money(total)}</strong></div>
            <button class="pd-btn-primary" id="cart-checkout">Checkout — ${money(total)}</button>
          </div>
        </div>`;
    }
    document.getElementById("cart-close").addEventListener("click", () => this.closeCart());
    el.querySelectorAll("[data-cart-remove]").forEach(b =>
      b.addEventListener("click", () => this.removeFromCart(+b.dataset.cartRemove)));
    const checkout = document.getElementById("cart-checkout");
    if (checkout) checkout.addEventListener("click", () => this.checkoutCart());
  },

  checkoutCart() {
    const total = this.cartTotal();
    if (!this.cart.length) return;
    if (!State.canAfford(total)) {
      return;
    }
    State.cash -= total;
    // Move cart items to inventory (in reverse to preserve indices)
    const sorted = [...this.cart].sort((a, b) => b - a);
    const bought = [];
    for (const idx of sorted) {
      const p = this.partsShop[idx];
      if (p) {
        p.paidPrice = p.price;
        State.parts = State.parts || [];
        State.parts.push(p);
        bought.push(p.partLabel);
        this.partsShop.splice(idx, 1);
      }
    }
    this.cart = [];
    UI.refreshCash();
    Save.save();
    this.updateCartBadge();
    this.closeCart();
    this.renderParts();
  },

  buyPart(i) {
    const p = this.partsShop[i];
    if (!p) return;
    // Browser Extension discount
    const discount = (typeof Skills !== "undefined") ? Skills.partsDiscount() : 0;
    const price = Math.round(p.price * (1 - discount));
    if (State.cash < price) {
      return;
    }
    State.cash -= price;
    State.parts = State.parts || [];
    p.paidPrice = price; // track what we paid (after discount)
    State.parts.push(p);
    const wasDanny = p.isDanny;
    this.partsShop.splice(i, 1);
    if (wasDanny) {
      this.partsShop.unshift(makeDannyPart(1000 + ((Math.random() * 9000) | 0)));
    }
    UI.refreshCash();
    Save.save();
    this.renderParts();
  },

  // ============ GARAGE ============
  garageTab: "bikes", // "bikes" | "parts" | "assemble"
  garageDetailIdx: -1,

  // Description presets by bike condition
  // Listing descriptions gated by Smooth Talker tier.
  // Tier 0: honest only. Higher tiers unlock salesy, catchy, swindler copy.
  // Each preset carries a "sell" score (0-3) that nudges buyer offers.
  descPresets(cond) {
    const tier = (typeof Skills !== "undefined") ? Skills.unlocked["smoothtalker"] || 0 : 0;
    const top = ["Mint", "Clean"];
    const mid = ["Good", "Fair"];
    // Every description is honest to the bike's actual condition.
    // Higher Smooth Talker tiers unlock better-written honest copy, never lies.
    // sell score: 0 = plain honest, 1 = well-written honest, 2 = compelling honest
    const copy = {
      top: [
        // Tier 0 — honest basics
        { t: "Clean bike. Runs well, no major issues.", sell: 0 },
        { t: "Good condition. Starts up and rides fine.", sell: 0 },
        { t: "Solid bike. Everything works as it should.", sell: 0 },
        // Tier 1 — polished honest
        { t: "Showroom condition. Meticulously maintained, always garaged.", sell: 1 },
        { t: "Collector quality. All original, runs like new.", sell: 1 },
        // Tier 2 — compelling honest
        { t: "Stunning example. Turn-key and ready to ride today.", sell: 2 },
        { t: "Clean title in hand. Fires right up, idles smooth.", sell: 2 },
      ],
      mid: [
        // Tier 0 — honest basics
        { t: "Runs and rides. Has some wear, priced fairly.", sell: 0 },
        { t: "Decent bike. Some cosmetic wear, mechanically okay.", sell: 0 },
        { t: "Usable bike. Not perfect, but gets you around.", sell: 0 },
        // Tier 1 — polished honest
        { t: "Solid rider. Starts easy, runs strong.", sell: 1 },
        { t: "Good honest bike. Some patina, mechanically sound.", sell: 1 },
        // Tier 2 — compelling honest
        { t: "Daily rider ready. Just serviced, new plug.", sell: 2 },
        { t: "Honest miles, honest price. Ready to ride home.", sell: 2 },
      ],
      rough: [
        // Tier 0 — honest basics
        { t: "Project bike. Needs work, sold as-is.", sell: 0 },
        { t: "Rough condition. For someone who wrenches.", sell: 0 },
        { t: "Not running right. Priced for the condition.", sell: 0 },
        // Tier 1 — polished honest
        { t: "Project bike. Sold as-is, priced accordingly.", sell: 1 },
        { t: "Barn find. Needs work but all there.", sell: 1 },
        // Tier 2 — compelling honest
        { t: "For restoration or parts. Bring a trailer.", sell: 2 },
        { t: "Mechanic's special. Know what you're getting into.", sell: 2 },
      ],
    };
    // Tier 3 Smooth Talker: unlocks "salesman" copy — stretches the truth, but
    // buyer caps (1.5x fair value) keep it fun without breaking the economy
    const salesman = {
      top: [
        { t: "Head-turner. Gets compliments at every stoplight.", sell: 3 },
        { t: "Investment-grade. These only go up in value.", sell: 3 },
      ],
      mid: [
        { t: "One-owner garage queen. Babied its whole life.", sell: 3 },
        { t: "Priced to move but worth every penny. Won't last.", sell: 3 },
      ],
      rough: [
        { t: "Diamond in the rough. Someone's gonna steal this.", sell: 3 },
        { t: "Needs a few parts but the bones are solid. Priced to reflect it.", sell: 3 },
      ],
    };
    const pool = top.includes(cond) ? copy.top : mid.includes(cond) ? copy.mid : copy.rough;
    // Tier 0 sees first 3, tier 1 sees first 5, tier 2 sees all 7, tier 3 adds salesman copy
    const count = tier >= 2 ? 7 : tier >= 1 ? 5 : 3;
    let out = pool.slice(0, count);
    if (tier >= 3) {
      const sm = top.includes(cond) ? salesman.top : mid.includes(cond) ? salesman.mid : salesman.rough;
      out = out.concat(sm);
    }
    return out;
  },

  // Fun condition-matching blurb for Boneyard part listings
  partBlurb(state) {
    const blurbs = {
      pristine: [
        "Pulled from a garage queen. Barely a fingerprint on it.",
        "NOS vibes. This thing has never seen rain.",
        "So clean you'd eat off it. Don't, though.",
      ],
      used_good: [
        "Honest wear, plenty of life left.",
        "Broke in, not broken down.",
        "A few scuffs, zero regrets.",
      ],
      used_bad: [
        "It's seen things. It'll still send it.",
        "Rough around the edges, cheap for a reason.",
        "Patina is just character. Lots of character.",
      ],
      totaled: [
        "For parts or art projects. Maybe both.",
        "Technically a part. Spiritually a paperweight.",
        "Sold as-is. No, really. As-is.",
      ],
    };
    const arr = blurbs[state] || blurbs.used_good;
    return arr[(Math.random() * arr.length) | 0];
  },

  // Sell score of a listing's description (0-3), drives buyer trust
  descSellScore(desc) {
    const all = this.descPresets("Mint").concat(this.descPresets("Good")).concat(this.descPresets("Rough"));
    const found = all.find(p => p.t === desc);
    return found ? found.sell : 0;
  },

  renderGarage() {
    const el = document.getElementById("garage-view");
    const tabs = `
      <div class="g-tabs">
        <button class="g-tab${this.garageTab === "bikes" ? " active" : ""}" data-gtab="bikes">${Icon.get('moped')} Bikes${State.garage.length ? ` (${State.garage.length})` : ""}</button>
        <button class="g-tab${this.garageTab === "parts" ? " active" : ""}" data-gtab="parts">${Icon.get('gear')} Parts${State.parts && State.parts.length ? ` (${State.parts.length})` : ""}</button>
        <button class="g-tab${this.garageTab === "assemble" ? " active" : ""}" data-gtab="assemble">${Icon.get('wrench')} Assemble</button>
        <button class="g-tab${this.garageTab === "skills" ? " active" : ""}" data-gtab="skills">${Icon.get('trophy')} Skills${Skills.unspentPoints() ? ` (${Skills.unspentPoints()})` : ""}</button>
      </div>`;
    if (this.garageTab === "parts") {
      el.innerHTML = tabs + this.partsInventoryHTML();
    } else if (this.garageTab === "assemble") {
      el.innerHTML = tabs + (this.rollerDetailIdx >= 0 ? this.rollerDetailHTML(this.rollerDetailIdx) : this.assembleHTML());
    } else if (this.garageTab === "skills") {
      el.innerHTML = tabs + this.skillsHTML();
      this.bindSkills(el);
    } else if (this.garageDetailIdx >= 0) {
      el.innerHTML = tabs + this.garageDetailHTML();
    } else {
      el.innerHTML = tabs + this.garageGridHTML();
    }
    // Tab switching
    el.querySelectorAll("[data-gtab]").forEach(t =>
      t.addEventListener("click", () => {
        this.garageTab = t.dataset.gtab;
        this.garageDetailIdx = -1;
        this.renderGarage();
      }));
    this.bindGarageActions(el);
  },

  garageGridHTML() {
    if (!State.garage.length) {
      return `<div class="pane-head"><h2>Pending Listings</h2>
        <div class="sub">Bikes you own, waiting to be listed.</div></div>
        <div class="empty"><strong>Empty garage</strong>Hit the market and buy your first flip.</div>`;
    }
    return `<div class="pane-head"><h2>Pending Listings</h2>
      <div class="sub">${State.garage.length} bike(s) · tap to manage</div></div>
      <div class="feed-grid">` +
      State.garage.map((b, i) => `
      <article class="card" data-gbike="${i}">
        <div class="photo">
          ${b.listed ? '<div class="just-listed">Listed</div>' : ""}
          <img src="assets/bikes/${b.sprite}.png" alt="${b.brand} ${b.model}" loading="lazy" draggable="false"${Feed.spriteNudge.has(b.sprite) ? ' class="nudged"' : ""}>
          <div class="card-cond">${b.condition}</div>
        </div>
        <div class="card-info">
          <div class="card-price-name"><strong>${money(b.boughtFor)}</strong> &middot; ${b.brand} ${b.model}</div>
          <div class="card-loc">${b.kept ? "${Icon.get('star')} In collection" : "Pending"}</div>
        </div>
      </article>`).join("") + `</div>`;
  },

  garageDetailHTML() {
    const b = State.garage[this.garageDetailIdx];
    if (!b) return `<div class="empty">Bike not found.</div>`;
    const presets = this.descPresets(b.condition);
    const tier = (typeof Skills !== "undefined") ? Skills.unlocked["smoothtalker"] || 0 : 0;
    if (!b.desc) b.desc = presets[0].t;
    return `
      <button class="back-btn" id="g-back">← Back</button>
      <div class="g-detail">
        <div class="g-detail-photo">
          <img src="assets/bikes/${b.sprite}.png" alt="${b.brand} ${b.model}">
          <div class="card-cond">${b.condition}</div>
        </div>
        <h2>${b.brand} ${b.model}</h2>
        <div class="sub">Bought for ${money(b.boughtFor)} · fair value ~${money(b.fairValue)}</div>
        <div class="g-desc-block">
          <label>Listing description</label>
          <textarea id="g-desc" rows="3">${b.desc}</textarea>
          <div class="g-presets">
            ${presets.map((p, i) => `<button class="g-preset${p.sell >= 2 ? " sell-hot" : ""}" data-preset="${i}">${p.t.slice(0, 40)}...</button>`).join("")}
            ${tier < 3 ? `<div class="sub" style="margin-top:6px">Train Smooth Talker for better sales copy (Tier ${tier}/3)</div>` : ""}
          </div>
        </div>
        <div class="cond-report">
          <h3>Inspect Parts</h3>
          <div class="sub" style="margin-bottom:8px">Tap a part to reveal its condition. <button class="link-btn" id="strip-toggle">Strip parts instead</button></div>
          <div class="parts-grid" id="inspect-grid">
            ${availableParts(b.sprite).map(p => {
              const st = (b.partStates && b.partStates[p.key]) || "pristine";
              const isMissing = st === "missing" || (b.missingParts || []).includes(p.key);
              if (isMissing) {
                return `<div class="part-cell state-missing" data-inspect-part="${p.key}">
                  <div class="part-missing-x">${Icon.get('missing')}</div>
                  <div class="part-label">${p.label}</div>
                  <div class="part-state">Missing</div>
                </div>`;
              }
              const revealed = (b.revealedParts || []).includes(p.key);
              const label = revealed ? PART_STATE_LABEL[st] : `<span class="cond-hidden">???</span>`;
              return `<div class="part-cell state-${revealed ? st : "hidden"}${this.stripMode ? " strip-mode" : ""}" data-inspect-part="${p.key}">
                <img src="${partImg(b.sprite, p.key, revealed ? st : "pristine")}" alt="${p.label}" loading="lazy">
                <div class="part-label">${p.label}</div>
                <div class="part-state">${label}</div>
              </div>`;
            }).join("")}
          </div>
        </div>
        <div class="g-detail-actions">
          <button class="btn-list" data-gact="list">${Icon.get('clipboard')} List on Marketplace</button>
          <button class="btn-keep" data-gact="keep">${b.kept ? Icon.get('star') + " In Collection" : Icon.get('trophy') + " Add to Collection"}</button>
          <button class="btn-strip" data-gact="toassemble">${Icon.get('wrench')} Move to Assemble</button>
        </div>
        <div class="sub" style="margin-top:8px">To strip parts, use "Strip parts instead" above and tap parts individually.</div>
        ${b.listed ? `<div class="notice">Live on the marketplace — buyers can see it.</div>` : ""}
      </div>`;
  },


  skillsHTML() {
    const prog = Skills.xpProgress();
    const unspent = Skills.unspentPoints();
    const head = `<div class="skills-head">
      <div class="xp-row">
        <span class="xp-total">${Skills.totalXP.toLocaleString()} XP</span>
        <span class="xp-pts">${unspent} skill point${unspent === 1 ? "" : "s"}</span>
      </div>
      <div class="xp-bar"><div class="xp-bar-fill" style="width:${prog.pct}%"></div></div>
      <div class="xp-next">${prog.current.toLocaleString()} / ${prog.needed.toLocaleString()} XP to next point</div>
    </div>`;
    const cards = SKILL_DEFS.map(def => {
      const cur = Skills.tier(def.id);
      const tiers = [1, 2, 3].map(t => {
        const cost = Skills.tierCost(t);
        let cls, label;
        if (t <= cur) { cls = "unlocked"; label = "Unlocked"; }
        else if (t === cur + 1 && unspent >= cost) { cls = "available"; label = `${cost} pt${cost > 1 ? "s" : ""}`; }
        else { cls = "locked"; label = `${cost} pt${cost > 1 ? "s" : ""}`; }
        return `<div class="tier-node ${cls}" data-skill="${def.id}" data-tier="${t}">
          <span class="tier-num">Tier ${t}</span>${def.tiers[t - 1]}
          <span class="tier-cost">${label}</span>
        </div>`;
      }).join("");
      return `<div class="skill-card">
        <h3>${Icon.get(def.icon)} ${def.name}</h3>
        <div class="skill-desc">${def.desc}</div>
        <div class="tier-row">${tiers}</div>
      </div>`;
    }).join("");
    return `<div class="pane-head"><h2>Skills</h2>
      <div class="sub">Earn XP from profitable sales. Spend points to get better.</div></div>`
      + head + cards;
  },

  bindSkills(el) {
    el.querySelectorAll(".tier-node.available").forEach(node => {
      node.addEventListener("click", () => {
        const skillId = node.dataset.skill;
        const tier = parseInt(node.dataset.tier, 10);
        const def = SKILL_DEFS.find(d => d.id === skillId);
        const cost = Skills.tierCost(tier);
        if (!confirm(`Unlock ${def.name} Tier ${tier} for ${cost} skill point${cost > 1 ? "s" : ""}?\n\n${def.tiers[tier - 1]}`)) return;
        if (Skills.unlockTier(skillId)) {
          this.renderGarage();
        } else {
        }
      });
    });
  },

  partsInventoryHTML() {
    const parts = State.parts || [];    if (!parts.length) {
      return `<div class="pane-head"><h2>Parts Inventory</h2>
        <div class="sub">Stripped parts and Boneyard purchases live here.</div></div>
        <div class="empty"><strong>No parts yet</strong>Part out a bike or buy from the Boneyard.</div>`;
    }
    return `<div class="pane-head"><h2>Parts Inventory</h2>
      <div class="sub">${parts.length} part(s) in storage · tap ${Icon.get('wrench')} to repair</div></div>
      <div class="eby-list">` +
      parts.map((p, i) => {
        const pct = ensurePct(p);
        const state = pctToState(pct);
        const img = partImg(p.bikeSprite, p.partKey, state);
        const canRepair = pct >= 25 && pct < 70;
        const tooFarGone = pct < 25;
        const cost = repairCost(p);
        // Color the bar by condition
        const barColor = pct >= 70 ? "#4caf50" : pct >= 40 ? "#ff9800" : "#f44336";
        return `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${img}" alt="${p.partLabel}" loading="lazy" data-part-img="${i}"></div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} — ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${PART_STATE_LABEL[state]} · ${pct}%</div>
          <div class="cond-bar"><div class="cond-fill" style="width:${pct}%;background:${barColor}"></div></div>
          ${(() => {
            const attempts = p.repairAttempts || 0;
            const left = 3 - attempts;
            if (tooFarGone) return `<div class="eby-meta" style="color:#f44336">Too far gone to repair</div>`;
            if (left <= 0) return `<div class="eby-meta" style="color:#999">No repairs left</div>`;
            if (!canRepair) return `<div class="eby-meta" style="color:#4caf50">Max condition reached</div>`;
            return `<button class="eby-repair" data-repair="${i}">${Icon.get('wrench')} Repair — ${money(cost)} (${left} left)</button>`;
          })()}
          <button class="eby-sell" data-sell-part="${i}">${Icon.get('cash')} Sell This Part</button>
        </div>
      </div>`;
      }).join("") + `</div>`;
  },

  repairPart(i) {
    const p = (State.parts || [])[i];
    if (!p) return;
    const pct = ensurePct(p);
    const attempts = p.repairAttempts || 0;
    if (attempts >= 3) {
      return;
    }
    if (pct < 25) {
      return;
    }
    if (pct >= 70) {
      return;
    }
    const cost = repairCost(p);
    if (!State.canAfford(cost)) {
      return;
    }
    State.cash -= cost;
    p.repairAttempts = attempts + 1;
    p.repairSpent = (p.repairSpent || 0) + cost; // track for XP cost basis

    // Very rare (5%): repair goes wrong, part gets worse
    let newPct, improved, worsened = false;
    if (Math.random() < 0.05) {
      const damage = 5 + ((Math.random() * 10) | 0); // -5 to -15
      newPct = Math.max(0, pct - damage);
      worsened = true;
      improved = false;
    } else {
      const result = attemptRepair(p);
      newPct = result.newPct;
      improved = result.improved;
    }

    p.conditionPct = newPct;
    const newState = pctToState(newPct);
    p.state = newState;
    p.stateLabel = PART_STATE_LABEL[newState];
    p.img = partImg(p.bikeSprite, p.partKey, newState);
    UI.refreshCash();
    Save.save();
    const left = 3 - p.repairAttempts;
    if (worsened) {
    } else if (improved) {
    } else {
    }
    this.renderGarage();
  },

  assembleHTML() {
    const rollers = State.rollers || [];
    if (!rollers.length) {
      return `<div class="pane-head"><h2>Assemble</h2>
        <div class="sub">Rebuild stripped bikes with parts from inventory.</div></div>
        <div class="empty"><strong>No rollers here</strong>Strip a bike to send its roller to Assemble, then bolt parts back on.</div>`;
    }
    return `<div class="pane-head"><h2>Assemble</h2>
      <div class="sub">Tap a roller to install parts</div></div>
      <div class="eby-list">` +
      rollers.map((r, i) => {
        const avail = availableParts(r.sprite);
        const total = avail.length;
        const installed = total - (r.missingParts || []).length;
        const pct = Math.round(installed / total * 100);
        const val = this.rollerValue(r);
        return `
      <div class="eby-item" data-roller="${i}" style="cursor:pointer">
        <div class="eby-thumb"><img src="assets/bikes/${r.sprite}.png" alt="${r.model}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${r.brand} ${r.model} — Roller</div>
          <div class="eby-cond">${installed}/${total} parts (${pct}%)</div>
          <div class="eby-parts-bar"><div class="eby-parts-fill" style="width:${pct}%"></div></div>
          <div class="eby-price">${money(val)} est. value</div>
        </div>
      </div>`;
      }).join("") + `</div>`;
  },

  // Which missing slot is expanded for part picking
  rollerPickSlot: null,

  // Roller detail: install matching parts (player picks which owned part)
  rollerDetailHTML(idx) {
    const r = (State.rollers || [])[idx];
    if (!r) return "";
    const avail = availableParts(r.sprite);
    const parts = State.parts || [];
    const pickKey = this.rollerPickSlot;
    let html = `<div class="pane-head"><button class="back-btn" id="roller-back">← Back</button>
      <h2>${r.brand} ${r.model} — Roller</h2>
      <div class="sub">Est. value: ${money(this.rollerValue(r))}</div></div>`;
    // Part picker drawer (expanded slot)
    if (pickKey) {
      const pDef = avail.find(p => p.key === pickKey);
      const matches = parts
        .map((sp, i) => ({ ...sp, invIdx: i }))
        .filter(sp => sp.bikeSprite === r.sprite && sp.partKey === pickKey)
        .sort((a, b) => (b.conditionPct || 0) - (a.conditionPct || 0));
      html += `<div class="roller-picker">
        <div class="roller-picker-head">
          <strong>Pick a ${pDef ? pDef.label : pickKey}</strong>
          <button class="back-btn" id="roller-picker-close">✕</button>
        </div>`;
      if (!matches.length) {
        html += `<div class="empty" style="padding:16px"><strong>None in inventory</strong>Buy or strip a ${pDef ? pDef.label.toLowerCase() : "part"} that fits this bike.</div>`;
      } else {
        html += `<div class="roller-picker-list">` + matches.map(m => `
          <div class="roller-pick-row" data-pick-part="${m.invIdx}" data-roller="${idx}">
            <img src="${m.img}" alt="${m.partLabel}" loading="lazy">
            <div class="roller-pick-info">
              <div class="roller-pick-name">${m.partLabel}</div>
              <div class="roller-pick-cond state-${m.state}">${m.stateLabel} · ${m.conditionPct || "?"}%</div>
            </div>
            <button class="eby-buy roller-pick-btn">Install</button>
          </div>`).join("") + `</div>`;
      }
      html += `</div>`;
    }
    // Parts grid
    html += `<div class="parts-grid">` +
      avail.map(p => {
        const st = (r.partStates && r.partStates[p.key]) || "pristine";
        const isMissing = st === "missing" || (r.missingParts || []).includes(p.key);
        if (!isMissing) {
          return `<div class="part-cell state-${st}" data-roller-part="${p.key}" data-roller="${idx}" style="cursor:pointer" title="Tap to remove or swap">
            <img src="${partImg(r.sprite, p.key, st)}" alt="${p.label}" loading="lazy">
            <div class="part-label">${p.label}</div>
            <div class="part-state">${PART_STATE_LABEL[st] || st}</div>
          </div>`;
        }
        const count = parts.filter(sp => sp.bikeSprite === r.sprite && sp.partKey === p.key).length;
        const active = pickKey === p.key ? " picker-open" : "";
        return `<div class="part-cell state-missing${active}" data-pick-slot="${p.key}">
          <div class="part-missing-x">${Icon.get('missing')}</div>
          <div class="part-label">${p.label}</div>
          <div class="part-state">Missing</div>
          ${count
            ? `<button class="eby-buy roller-choose-btn">Choose part (${count})</button>`
            : `<div class="part-state" style="color:#999">none owned</div>`}
        </div>`;
      }).join("") + `</div>
      <div style="padding:12px"><button class="eby-buy" id="roller-to-garage">${(r.missingParts || []).length ? `Move to Garage (missing ${(r.missingParts || []).length})` : "Move to Garage"}</button></div>`;
    return html;
  },

  installPartOnRoller(rollerIdx, invIdx) {
    const r = (State.rollers || [])[rollerIdx];
    const parts = State.parts || [];
    const part = parts[invIdx];
    if (!r || !part) return;
    // Recalculate condition after install (at end of function)
    const _recalc = () => {
      if (typeof calcBikeCondition !== "undefined") {
        r.condition = calcBikeCondition(r.partStates, r.sprite);
      }
    };
    if (part.bikeSprite !== r.sprite || !(r.missingParts || []).includes(part.partKey)) {
      return;
    }
    parts.splice(invIdx, 1);
    // Install: set condition, remove from missing
    const partKey = part.partKey;
    r.partStates = r.partStates || {};
    r.partStates[partKey] = part.state || "used_good";
    r.missingParts = r.missingParts.filter(k => k !== partKey);
    this.rollerPickSlot = null;
    // Track install cost for XP basis
    r.installedCost = (r.installedCost || 0) + (part.paidPrice || 0);
    Save.save();
        _recalc();
    this.renderGarage();
  },

  rollerToGarage(idx) {
    const r = (State.rollers || [])[idx];
    if (!r) return;
    const missing = (r.missingParts || []).length;
    // Bike goes back to garage (may have missing parts — value reflects it)
    r.isRoller = false;
    // Mark missing parts in partStates so they show in listings
    r.partStates = r.partStates || {};
    (r.missingParts || []).forEach(k => { r.partStates[k] = "missing"; });
    r.condition = missing > 0 ? "Rough" : "Good";
    r.fairValue = this.rollerValue(r);
    // Clear the missing list since it's now encoded in partStates
    r.missingParts = [];
    State.garage.push(r);
    State.rollers.splice(idx, 1);
    this.rollerDetailIdx = -1;
    this.garageTab = "bikes";
    Save.save();
    this.renderGarage();
  },

  rollerDetailIdx: -1,

  bindGarageActions(el) {
    // Bike card taps → detail
    el.querySelectorAll("[data-gbike]").forEach(c => {
      const open = (e) => {
        if (e) e.preventDefault();
        this.garageDetailIdx = +c.dataset.gbike;
        this.renderGarage();
      };
      c.addEventListener("click", open);
      let ty = 0, tx = 0;
      c.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      c.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) open(e);
      }, { passive: false });
    });
    // Back from detail
    const back = el.querySelector("#g-back");
    if (back) back.addEventListener("click", () => {
      this.garageDetailIdx = -1;
      this.stripMode = false;
      this.renderGarage();
    });
    // Description presets
    el.querySelectorAll("[data-preset]").forEach(b =>
      b.addEventListener("click", () => {
        const bike = State.garage[this.garageDetailIdx];
        bike.desc = this.descPresets(bike.condition)[+b.dataset.preset].t;
        el.querySelector("#g-desc").value = bike.desc;
      }));
    // Description save on edit
    const descInput = el.querySelector("#g-desc");
    if (descInput) descInput.addEventListener("input", (e) => {
      State.garage[this.garageDetailIdx].desc = e.target.value;
    });
    // Detail actions
    el.querySelectorAll("[data-gact]").forEach(b =>
      b.addEventListener("click", () => this.garageDetailAction(b.dataset.gact)));
    // Roller list: tap to open detail
    el.querySelectorAll("[data-roller]").forEach(item => {
      item.addEventListener("click", (e) => {
        if (e.target.closest("[data-install-part]")) return; // handled below
        this.rollerDetailIdx = +item.dataset.roller;
        this.renderGarage();
      });
    });
    // Roller detail: back button
    const rollerBack = el.querySelector("#roller-back");
    if (rollerBack) rollerBack.addEventListener("click", () => {
      this.rollerDetailIdx = -1;
      this.rollerPickSlot = null;
      this.renderGarage();
    });
    // Roller detail: tap a missing slot to open the part picker
    el.querySelectorAll("[data-pick-slot]").forEach(cell => {
      cell.addEventListener("click", (e) => {
        if (e.target.closest(".roller-choose-btn") || !e.target.closest("button")) {
          const key = cell.dataset.pickSlot;
          this.rollerPickSlot = this.rollerPickSlot === key ? null : key;
          this.renderGarage();
        }
      });
    });
    // Roller detail: tap installed part to remove it (back to inventory)
    el.querySelectorAll("[data-roller-part]").forEach(cell => {
      cell.addEventListener("click", () => {
        const rIdx = +cell.dataset.roller;
        const key = cell.dataset.rollerPart;
        const r = (State.rollers || [])[rIdx];
        if (!r) return;
        const st = (r.partStates && r.partStates[key]) || "pristine";
        // Remove part, mark slot as missing (no confirm — just do it)
        r.partStates = r.partStates || {};
        const avail = availableParts(r.sprite);
        const pDef = avail.find(p => p.key === key);
        if (pDef) {
          State.parts = State.parts || [];
          State.parts.push({
            bikeSprite: r.sprite, bikeBrand: r.brand, bikeModel: r.model,
            partKey: key, partLabel: pDef.label, state: st,
            stateLabel: PART_STATE_LABEL[st] || st,
            img: partImg(r.sprite, key, st),
          });
        }
        r.partStates[key] = "missing";
        if (!r.missingParts) r.missingParts = [];
        if (!r.missingParts.includes(key)) r.missingParts.push(key);
        Save.save();
        this.renderGarage();
      });
    });
    // Roller detail: close picker
    const pickerClose = el.querySelector("#roller-picker-close");
    if (pickerClose) pickerClose.addEventListener("click", () => {
      this.rollerPickSlot = null;
      this.renderGarage();
    });
    // Roller detail: pick a specific part to install
    el.querySelectorAll("[data-pick-part]").forEach(row => {
      const btn = row.querySelector(".roller-pick-btn");
      const doInstall = (e) => {
        e.stopPropagation();
        this.installPartOnRoller(+row.dataset.roller, +row.dataset.pickPart);
      };
      if (btn) btn.addEventListener("click", doInstall);
      row.addEventListener("click", doInstall);
    });
    // Roller detail: move to garage
    const toGarage = el.querySelector("#roller-to-garage");
    if (toGarage && !toGarage.disabled) toGarage.addEventListener("click", () => {
      this.rollerToGarage(this.rollerDetailIdx);
    });
    // Strip mode toggle
    const stripToggle = el.querySelector("#strip-toggle");
    if (stripToggle) stripToggle.addEventListener("click", () => {
      this.stripMode = !this.stripMode;
      this.renderGarage();
    });
    // Inspect / strip parts: tap to reveal or pull
    el.querySelectorAll("[data-inspect-part]").forEach(cell => {
      cell.addEventListener("click", () => {
        const bike = State.garage[this.garageDetailIdx];
        if (!bike) return;
        const key = cell.dataset.inspectPart;
        if (this.stripMode) {
          this.stripPartFromBike(bike, key);
          return;
        }
        bike.revealedParts = bike.revealedParts || [];
        if (!bike.revealedParts.includes(key)) {
          bike.revealedParts.push(key);
          Save.save();
          this.renderGarage();
        }
      });
    });
    // Assemble buttons
    el.querySelectorAll("[data-assemble]").forEach(b =>
      b.addEventListener("click", () => this.assembleBike(b.dataset.assemble)));
    // Repair buttons
    el.querySelectorAll("[data-repair]").forEach(b => {
      const rep = (e) => { e.preventDefault(); e.stopPropagation(); this.repairPart(+b.dataset.repair); };
      b.addEventListener("click", rep);
      let ty = 0, tx = 0;
      b.addEventListener("touchstart", (e) => {
        ty = e.touches[0].clientY; tx = e.touches[0].clientX;
      }, { passive: true });
      b.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) rep(e);
      }, { passive: false });
    });
    // Sell buttons → inline price input
    el.querySelectorAll("[data-sell-part]").forEach(b => {
      const idx = +b.dataset.sellPart;
      const sell = (e) => {
        e.preventDefault(); e.stopPropagation();
        const p = (State.parts || [])[idx];
        if (!p) return;
        const pct = ensurePct(p);
        const state = pctToState(pct);
        const marketPrice = Math.round((PART_BASE_PRICE[p.partKey] || 20) * (PART_COND_MULT[state] || 0.3));
        // Show listing type choice
        b.outerHTML = `<div class="sell-type-row">
          <button class="eby-typechoice" data-listtype="fixed" data-idx="${idx}">${Icon.get('cash')} Fixed Price</button>
          <button class="eby-typechoice" data-listtype="auction" data-idx="${idx}">${Icon.get('gavel')} Auction</button>
          <button class="eby-cancel" data-cancel-sell>${Icon.get('close')}</button>
        </div>`;
        el.querySelectorAll("[data-listtype]").forEach(tb =>
          tb.addEventListener("click", () => this.showPartPriceInput(el, idx, tb.dataset.listtype, marketPrice)));
        const cancelBtn = el.querySelector(`[data-cancel-sell]`);
        if (cancelBtn) cancelBtn.addEventListener("click", () => this.renderGarage());
      };
      b.addEventListener("click", sell);
    });
  },

  garageDetailAction(act) {
    const bike = State.garage[this.garageDetailIdx];
    if (!bike) return;
    if (act === "list") {
      // Show inline price input for listing
      const btn = document.querySelector('[data-gact="list"]');
      if (btn) {
        const suggest = bike.fairValue || bike.boughtFor || 500;
        btn.outerHTML = `<div class="sell-price-row">
          <input type="number" inputmode="numeric" id="bike-list-price" value="${suggest}" min="1">
          <button class="eby-confirm" id="bike-list-confirm">List</button>
          <button class="eby-cancel" id="bike-list-cancel">${Icon.get('close')}</button>
        </div>`;
        const input = document.getElementById("bike-list-price");
        const confirm = document.getElementById("bike-list-confirm");
        const cancel = document.getElementById("bike-list-cancel");
        if (confirm) confirm.addEventListener("click", () => {
          input.blur();
          this.listBikeForSale(this.garageDetailIdx, input.value);
        });
        if (cancel) cancel.addEventListener("click", () => this.renderGarage());
        if (input) input.focus();
      }
    } else if (act === "keep") {
      if (!bike.kept) {
        // Collection requires ALL pristine parts
        const avail = availableParts(bike.sprite);
        const bad = avail.filter(p => {
          if ((bike.missingParts || []).includes(p.key)) return true;
          return ((bike.partStates && bike.partStates[p.key]) || "pristine") !== "pristine";
        });
        if (bad.length) {
          return;
        }
      }
      bike.kept = !bike.kept;
      if (bike.kept) {
        State.stats.collected++;
        // Check brand set completion
        const brandBikes = State.garage.filter(b => b.kept && b.brand === bike.brand);
        // Count unique models for this brand in collection
        const brandModels = new Set(brandBikes.map(b => b.model));
        // Check if this completes a brand (need to know brand size — approximate)
        if (typeof Milestones !== "undefined") Milestones.check(State.stats);
      } else {
        State.stats.collected = Math.max(0, State.stats.collected - 1);
      }
      Save.save();
      this.renderGarage();
    } else if (act === "toassemble") {
      this.moveBikeToAssemble(this.garageDetailIdx);
    }
  },

  stripMode: false,

  stripPartFromBike(bike, partKey) {
    bike.missingParts = bike.missingParts || [];
    if (bike.missingParts.includes(partKey)) {
      return;
    }
    // Mark as missing in partStates too
    bike.partStates = bike.partStates || {};
    bike.partStates[partKey] = "missing";
    const avail = availableParts(bike.sprite);
    const pDef = avail.find(p => p.key === partKey);
    if (!pDef) return;
    const state = (bike.partStates && bike.partStates[partKey]) || "pristine";
    // Move to inventory
    State.parts = State.parts || [];
    State.parts.push({
      partKey, partLabel: pDef.label,
      bikeBrand: bike.brand, bikeModel: bike.model, bikeSprite: bike.sprite,
      state, stateLabel: PART_STATE_LABEL[state],
      conditionPct: { pristine: 95, used_good: 60, used_bad: 35, totaled: 10 }[state] || 50,
      paidPrice: 0, // pulled from own bike, no cost
      img: partImg(bike.sprite, partKey, state),
    });
    bike.missingParts.push(partKey);
    // Remove from revealed (it's gone)
    if (bike.revealedParts) bike.revealedParts = bike.revealedParts.filter(k => k !== partKey);
        // Recalculate overall condition from parts
    if (typeof calcBikeCondition !== "undefined") {
      bike.condition = calcBikeCondition(bike.partStates, bike.sprite);
    }
    Save.save();
    this.renderGarage();
  },

  moveBikeToAssemble(idx) {
    const bike = State.garage[idx];
    if (!bike) return;
    const stripped = (bike.missingParts || []).length;
    if (!confirm(`Move the ${bike.brand} ${bike.model} to Assemble?${stripped ? ` (${stripped} part${stripped === 1 ? "" : "s"} already stripped)` : ""}`)) return;
    // Move as-is — already-stripped parts stay stripped, rest stay installed
    // (parts were stripped piece-by-piece in the bikes tab)
    State.rollers = State.rollers || [];
    bike.isRoller = true;
    State.rollers.push(bike);
    State.garage.splice(idx, 1);
    this.garageDetailIdx = -1;
    this.stripMode = false;
    this.garageTab = "assemble";
    Save.save();
    this.renderGarage();
  },

  // Roller value: base × completeness, weighted by installed part conditions
  rollerValue(bike) {
    const avail = availableParts(bike.sprite);
    const total = avail.length;
    const missing = (bike.missingParts || []).length;
    const installed = total - missing;
    if (total === 0) return 0;
    // Base completeness ratio
    let value = (bike.fairValue || bike.boughtFor || 500) * 0.25; // roller floor: 25%
    // Each installed part adds value weighted by condition
    const condMult = { pristine: 1.0, used_good: 0.7, used_bad: 0.4, totaled: 0.15 };
    for (const p of avail) {
      if ((bike.missingParts || []).includes(p.key)) continue;
      const st = (bike.partStates && bike.partStates[p.key]) || "pristine";
      value += ((bike.fairValue || 500) * 0.75 / total) * (condMult[st] || 0.5);
    }
    return Math.round(value);
  },

  assembleBike(sprite) {
    const parts = State.parts || [];
    const avail = availableParts(sprite);
    // Check we have all parts (at least one of each)
    const missing = avail.filter(p =>
      !parts.some(sp => sp.bikeSprite === sprite && sp.partKey === p.key));
    if (missing.length) {
      return;
    }
    // Remove one of each part from inventory
    for (const p of avail) {
      const i = parts.findIndex(sp => sp.bikeSprite === sprite && sp.partKey === p.key);
      if (i >= 0) parts.splice(i, 1);
    }
    // Find the bike data
    const bikeData = BIKES.find(b => b.sprite === sprite);
    if (!bikeData) return;
    // Create the assembled bike (condition based on parts used — simplified to Good)
    const newBike = {
      id: `assembled-${Date.now()}`,
      bikeId: bikeData.id, brand: bikeData.brand, model: bikeData.name,
      sprite: bikeData.sprite, baseValue: bikeData.base, rarity: bikeData.rarity,
      condition: "Good", price: bikeData.base, boughtFor: 0,
      partStates: {}, fairValue: bikeData.base,
      desc: "Assembled from parts. Built, not bought.",
      listed: false, kept: false,
    };
    // Roll part states as Good
    for (const p of avail) newBike.partStates[p.key] = "used_good";
    State.garage.push(newBike);
    this.garageTab = "bikes";
    this.renderGarage();
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
          `<div class="slot ${i < s.owned ? "filled" : ""}">${i < s.owned ? Icon.get('check') : "?"}</div>`).join("")}
        </div>
      </div>`).join("") +
      this.renderMilestones();
  },

  renderMilestones() {
    if (typeof Milestones === "undefined") return "";
    const done = new Set(Milestones.completed());
    const items = Milestones.defs.map(d => {
      const isDone = done.has(d.id);
      return `<div class="milestone ${isDone ? "done" : ""}">
        <div class="milestone-icon">${isDone ? "🏆" : "○"}</div>
        <div><strong>${d.name}</strong><div class="milestone-desc">${d.desc}</div></div>
      </div>`;
    }).join("");
    return `<h2 style="margin-top:24px">Milestones</h2>
      <div class="sub">${done.size} of ${Milestones.defs.length} completed</div>
      <div class="milestones">${items}</div>`;
  },
};
