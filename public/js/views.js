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

  refreshParts() {
    const now = Date.now();
    if (now < this.partsCooldownUntil) {
      const remain = Math.ceil((this.partsCooldownUntil - now) / 1000);
      UI.toast(`Boneyard refresh in ${remain}s`);
      return;
    }
    if (this.partsRefreshesLeft <= 0) {
      // Start 30s cooldown, reset free refreshes after
      this.partsCooldownUntil = now + 30 * 1000;
      this.tickPartsCooldown();
      return;
    }
    this.partsRefreshesLeft--;
    this.partsShop = genPartsShop(16);
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
        setTimeout(() => UI.toast(`🔥 Deal alert: ${best.partLabel} ${Math.round((1 - best.price / Skills.marketAverage(best)) * 100)}% below market!`), 600);
      }
    }
    UI.toast(`New parts listings (${this.partsRefreshesLeft} free refreshes left)`);
    if (this.partsRefreshesLeft <= 0) {
      this.partsCooldownUntil = Date.now() + 30 * 1000;
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
      UI.toast("Enter a valid price");
      return;
    }
    State.garage.splice(garageIdx, 1);
    this.myBikeListings.push({ ...bike, askPrice: price, listedAt: Date.now() });
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    UI.toast(`${bike.brand} ${bike.model} listed for ${money(price)}`);
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
    UI.toast(`${l.brand} ${l.model} returned to garage`);
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
      if (!l.sold && !l.offer && Math.random() < 0.15) {
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
    const boostedOffer = Math.round((offerAmount * (1 + stBonus)) / 5) * 5;
    const boostedMax = Math.round((askPrice * maxPct * (1 + stBonus)) / 5) * 5;
    const opener = style === "eager"
      ? `Hi! I love this bike. Would you take ${money(offerAmount)}? I can pick up today.`
      : style === "haggler"
      ? `Hey, interested. What's your bottom dollar? I could do ${money(offerAmount)}.`
      : `Hi, is this still available? Would ${money(offerAmount)} work?`;
    listing.offer = {
      amount: offerAmount,
      buyerName,
      style,
      rounds: 0,
      maxAmount: boostedMax,
      type,
      thread: [{ from: "buyer", text: opener.replace(money(offerAmount), money(boostedOffer)) }],
    };
    listing.offer.amount = boostedOffer;
    UI.toast(`${buyerName} made an offer!`);
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
    UI.toast(`Sold for ${money(amount)}!`);
    // XP: profit = sale price - cost basis (purchase + repairs)
    const costBasis = (l.boughtFor || l.paidPrice || 0) + (l.repairSpent || 0);
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
    UI.toast("Offer declined");
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
        UI.toast(`${offer.buyerName} walked away`);
        if (this.current === "market") { this.renderMarketFeed(); this.renderMarketTabs(); }
        if (this.current === "parts") this.renderParts();
      }, 1200);
    } else {
      // Re-render with updated offer
      this.renderSellerHaggle();
    }
  },

  randomAcceptResponse() {
    return [
      "Awesome, thanks!",
      "Perfect! When can I pick it up?",
      "Great, deal!",
      "Sweet, I'll take it!",
    ][(Math.random() * 4) | 0];
  },

  randomDeclineResponse() {
    return [
      "No worries, thanks anyway.",
      "Alright, let me know if you change your mind.",
      "Ok, good luck with the sale!",
    ][(Math.random() * 3) | 0];
  },

  randomCounterAcceptResponse(amount, style) {
    if (style === "eager") return [
      `Yes! ${money(amount)} — I'll take it!`,
      `Deal! ${money(amount)}. When can I come get it?`,
    ][(Math.random() * 2) | 0];
    if (style === "flaky") return [
      `Ugh, fine. ${money(amount)}.`,
      `Alright alright, ${money(amount)}.`,
    ][(Math.random() * 2) | 0];
    return [
      `Hmm... ${money(amount)}. Yeah, I can do that.`,
      `Alright, ${money(amount)} works for me.`,
      `You drive a hard bargain. ${money(amount)} it is.`,
    ][(Math.random() * 3) | 0];
  },

  randomCounterBackResponse(amount, style) {
    if (style === "eager") return [
      `I can stretch to ${money(amount)} — that's really my limit.`,
    ][0];
    if (style === "flaky") return [
      `Meh, ${money(amount)} is all I'd do.`,
      `${money(amount)}? Take it or I'm out.`,
    ][(Math.random() * 2) | 0];
    return [
      `That's a bit steep for me. How about ${money(amount)}?`,
      `I can't go that high. ${money(amount)} is my best.`,
      `Meet me at ${money(amount)}?`,
    ][(Math.random() * 3) | 0];
  },

  randomWalkAwayResponse(style) {
    if (style === "flaky") return [
      "lol no. bye.",
      "Yeah I'm out.",
    ][(Math.random() * 2) | 0];
    return [
      "Yeah that's too rich for my blood. Good luck!",
      "Can't do that. I'll keep looking.",
      "No way. Thanks anyway.",
    ][(Math.random() * 3) | 0];
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
          UI.toast(`Sold your ${l.brand} ${l.model} for ${money(l.askPrice)}!`);
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
          UI.toast(`Sold ${l.partLabel} for ${money(l.askPrice)}!`);
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
      UI.toast("Enter a valid price");
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
    UI.toast(`${p.partLabel} listed for ${money(price)}`);
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
      UI.toast("Enter a valid starting bid");
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
    UI.toast(`Auction started for ${p.partLabel}!`);
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
            UI.toast(`Auction sold! ${l.partLabel} went for ${money(l.currentBid)} to ${l.highBidder}`);
          }
        } else {
          const { listingType, startPrice, currentBid, highBidder, timeLeft, bidders, listedAt, ...part } = l;
          State.parts = State.parts || [];
          State.parts.push(part);
          // Remove the listing entirely (ended with no sale) — prevents reprocessing
          this.myPartListings.splice(i, 1);
          Save.save();
          UI.toast(`No bids on ${l.partLabel} — returned to inventory`);
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
    UI.toast(`${l.partLabel} returned to inventory`);
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
      UI.toast("Not enough cash to cover that bid");
      return;
    }
    p.currentBid = nextBid;
    p.highBidder = "you";
    UI.toast(`Bid placed: ${money(nextBid)}`);
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
        UI.refreshCash();
        UI.toast(`Won the ${p.partLabel} for ${money(p.currentBid)}!`);
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
    if (!this.partsShop.length) this.partsShop = genPartsShop(16);
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
          <div class="eby-cond">${Skills.condDisplay(p)} · Auction</div>
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
          <div class="eby-cond">${Skills.condDisplay(p)}</div>
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
          <div class="pd-cond-row">Condition <strong>${Skills.condDisplay(p)}</strong></div>
          ${Skills.marketTag(p)}
          ${Skills.priceHistoryHTML(p)}
          <div class="pd-actions">${actionHtml}</div>
          <div class="pd-about">
            <div class="pd-about-head">About this item</div>
            <div class="pd-spec"><span>Condition</span><span>${Skills.condDisplay(p)}</span></div>
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
          UI.toast(`Bid must be at least ${money(minBid)}`);
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
        this.closePartDetail();
        // Buy at the agreed price
        const idx = this.partDetailIdx;
        const part = this.partsShop[idx];
        if (part && State.canAfford(price)) {
          State.cash -= price;
          part.paidPrice = price;
          State.parts = State.parts || [];
          State.parts.push(part);
          this.partsShop.splice(idx, 1);
          UI.refreshCash();
          Save.save();
          UI.toast(`${part.partLabel} bought for ${money(price)}!`);
          this.renderParts();
        }
      });
    }
  },

  // Player makes an offer on a BIN part — seller responds
  sendPartOffer(offerAmount) {
    const p = this.partsShop[this.partDetailIdx];
    if (!p) return;
    const ratio = offerAmount / p.price;
    let response, accepted = false, price = null;

    if (ratio >= 0.95) {
      response = `"${money(offerAmount)}? Yeah, I can do that."`;
      accepted = true; price = offerAmount;
    } else if (ratio >= 0.85) {
      response = `"Hmm... ${money(offerAmount)}. Alright, it's yours."`;
      accepted = true; price = offerAmount;
    } else if (ratio >= 0.70) {
      const counter = Math.round(((offerAmount + p.price) / 2) / 5) * 5;
      response = `"Can't do ${money(offerAmount)}. How about ${money(counter)}?"`;
      price = counter;
    } else if (ratio >= 0.50) {
      const counter = Math.round((p.price * 0.9) / 5) * 5;
      response = `"${money(offerAmount)}? That's insulting. ${money(counter)} and not a penny less."`;
      price = counter;
    } else {
      response = `"${money(offerAmount)}?? Get outta here with that lowball."`;
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
      UI.toast("Not enough cash for that bid");
      return;
    }
    p.currentBid = amount;
    p.highBidder = "you";
    // Bidders will respond via the auction timer
    UI.toast(`Bid placed: ${money(amount)}`);
    this.updateAuctionUI();
  },

  // --- shopping cart ---
  addToCart(idx) {
    const p = this.partsShop[idx];
    if (!p) return;
    if (p.listingType === "auction") {
      UI.toast("Can't add auctions to cart");
      return;
    }
    // Don't add duplicates
    if (this.cart.includes(idx)) {
      UI.toast("Already in cart");
      return;
    }
    this.cart.push(idx);
    Save.save();
    UI.toast(`${p.partLabel} added to cart`);
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
      UI.toast(`Not enough cash — need ${money(total)}`);
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
    UI.toast(`Bought ${bought.length} part${bought.length === 1 ? "" : "s"} for ${money(total)}!`);
    this.renderParts();
  },

  buyPart(i) {
    const p = this.partsShop[i];
    if (!p) return;
    // Browser Extension discount
    const discount = (typeof Skills !== "undefined") ? Skills.partsDiscount() : 0;
    const price = Math.round(p.price * (1 - discount));
    if (State.cash < price) {
      UI.toast("Not enough cash for that part");
      return;
    }
    State.cash -= price;
    State.parts = State.parts || [];
    p.paidPrice = price; // track what we paid (after discount)
    State.parts.push(p);
    this.partsShop.splice(i, 1);
    UI.refreshCash();
    Save.save();
    UI.toast(`${p.partLabel} (${p.bikeBrand} ${p.bikeModel}) bought${discount > 0 ? ` — ${Math.round(discount * 100)}% off!` : ""}`);
    this.renderParts();
  },

  // ============ GARAGE ============
  garageTab: "bikes", // "bikes" | "parts" | "assemble"
  garageDetailIdx: -1,

  // Description presets by bike condition
  descPresets(cond) {
    const top = ["Mint", "Clean"];
    const mid = ["Good", "Fair"];
    if (top.includes(cond)) return [
      "Showroom condition. Meticulously maintained, always garaged.",
      "Collector quality. All original, runs like new.",
      "Stunning example. Turn-key and ready to ride.",
    ];
    if (mid.includes(cond)) return [
      "Solid rider. Starts easy, runs strong.",
      "Good honest bike. Some patina, mechanically sound.",
      "Daily rider ready. Just serviced, new plug.",
    ];
    return [
      "Project bike. Sold as-is, priced accordingly.",
      "Barn find. Needs work but all there.",
      "For restoration or parts. Bring a trailer.",
    ];
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
      el.innerHTML = tabs + this.assembleHTML();
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
    if (!b.desc) b.desc = presets[0];
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
            ${presets.map((p, i) => `<button class="g-preset" data-preset="${i}">${p.slice(0, 40)}...</button>`).join("")}
          </div>
        </div>
        <div class="g-detail-actions">
          <button class="btn-list" data-gact="list">${Icon.get('clipboard')} List on Marketplace</button>
          <button class="btn-keep" data-gact="keep">${b.kept ? Icon.get('star') + " In Collection" : Icon.get('trophy') + " Add to Collection"}</button>
          <button class="btn-strip" data-gact="partout">${Icon.get('wrench')} Part Out</button>
        </div>
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
          UI.toast(`${def.name} Tier ${tier} unlocked!`);
          this.renderGarage();
        } else {
          UI.toast("Not enough skill points");
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
      UI.toast("No repair attempts left on this part");
      return;
    }
    if (pct < 25) {
      UI.toast("That part is too far gone to repair");
      return;
    }
    if (pct >= 70) {
      UI.toast("Already at max repair condition");
      return;
    }
    const cost = repairCost(p);
    if (!State.canAfford(cost)) {
      UI.toast("Not enough cash for that repair");
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
      UI.toast(`Repair went wrong! Down to ${newPct}% (${p.stateLabel})`);
    } else if (improved) {
      UI.toast(`Repaired to ${newPct}% (${p.stateLabel})! ${left} attempt${left === 1 ? "" : "s"} left`);
    } else {
      UI.toast(`Repair didn't take — no improvement. ${left} attempt${left === 1 ? "" : "s"} left`);
    }
    this.renderGarage();
  },

  assembleHTML() {
    const parts = State.parts || [];
    // Find frames in inventory (frame = core part)
    const frames = parts.filter(p => p.partKey === "frame");
    if (!frames.length) {
      return `<div class="pane-head"><h2>Assemble</h2>
        <div class="sub">Build a bike from your parts.</div></div>
        <div class="empty"><strong>No frames in inventory</strong>You need a frame to start a build. Part out a bike to get one.</div>`;
    }
    // Group frames by bike
    const byBike = {};
    frames.forEach((f, i) => {
      const k = f.bikeSprite;
      if (!byBike[k]) byBike[k] = { ...f, indices: [] };
      byBike[k].indices.push(parts.indexOf(f));
    });
    return `<div class="pane-head"><h2>Assemble</h2>
      <div class="sub">Pick a frame to start your build</div></div>
      <div class="eby-list">` +
      Object.values(byBike).map(f => {
        const avail = availableParts(f.bikeSprite);
        const have = avail.filter(p =>
          parts.some(sp => sp.bikeSprite === f.bikeSprite && sp.partKey === p.key));
        const pct = Math.round(have.length / avail.length * 100);
        return `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${f.img}" alt="Frame" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${f.bikeBrand} ${f.bikeModel} — Frame</div>
          <div class="eby-cond">${have.length}/${avail.length} parts (${pct}%)</div>
          <div class="eby-parts-bar"><div class="eby-parts-fill" style="width:${pct}%"></div></div>
          <button class="eby-buy" data-assemble="${f.bikeSprite}">Assemble Bike</button>
        </div>
      </div>`;
      }).join("") + `</div>`;
  },

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
      this.renderGarage();
    });
    // Description presets
    el.querySelectorAll("[data-preset]").forEach(b =>
      b.addEventListener("click", () => {
        const bike = State.garage[this.garageDetailIdx];
        bike.desc = this.descPresets(bike.condition)[+b.dataset.preset];
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
      bike.kept = !bike.kept;
      UI.toast(bike.kept
        ? `${bike.brand} ${bike.model} added to your collection`
        : `${bike.brand} ${bike.model} removed from collection`);
      this.renderGarage();
    } else if (act === "partout") {
      this.partOutBike(this.garageDetailIdx);
    }
  },

  partOutBike(idx) {
    const bike = State.garage[idx];
    if (!bike) return;
    if (!confirm(`Strip the ${bike.brand} ${bike.model} for parts? This cannot be undone.`)) return;
    const avail = availableParts(bike.sprite);
    State.parts = State.parts || [];
    // Each part inherits the bike's part condition
    const costPerPart = Math.round((bike.boughtFor || 0) / Math.max(1, avail.length));
    for (const p of avail) {
      const state = (bike.partStates && bike.partStates[p.key]) || "pristine";
      State.parts.push({
        partKey: p.key, partLabel: p.label,
        bikeBrand: bike.brand, bikeModel: bike.model, bikeSprite: bike.sprite,
        state, stateLabel: PART_STATE_LABEL[state],
        paidPrice: costPerPart, // share of what we paid for the bike
        img: partImg(bike.sprite, p.key, "pristine"), // V4: pristine art for now
      });
    }
    State.garage.splice(idx, 1);
    this.garageDetailIdx = -1;
    this.garageTab = "parts";
    UI.toast(`${bike.brand} ${bike.model} stripped — ${avail.length} parts in inventory`);
    Save.save();
    this.renderGarage();
  },

  assembleBike(sprite) {
    const parts = State.parts || [];
    const avail = availableParts(sprite);
    // Check we have all parts (at least one of each)
    const missing = avail.filter(p =>
      !parts.some(sp => sp.bikeSprite === sprite && sp.partKey === p.key));
    if (missing.length) {
      UI.toast(`Missing: ${missing.map(m => m.label).join(", ")}`);
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
    UI.toast(`${bikeData.brand} ${bikeData.name} assembled!`);
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
          `<div class="slot ${i < s.owned ? "filled" : ""}">${i < s.owned ? "${Icon.get('check')}" : "?"}</div>`).join("")}
        </div>
      </div>`).join("");
  },
};
