// Sold As-Is — garage & collection views
const SITES = {
  market:     { tab: "Sold As-Is — Mopeds for sale", url: "soldasis.place/mopeds",     icon: "moped" },
  parts:      { tab: "Boneyard — Moped parts",       url: "boneyard.place",              icon: "gear" },
  crate:      { tab: "Crate Fresh — NOS Parts Co.",  url: "cratefresh.place",            icon: "crate" },
  garage:     { tab: "Sold As-Is — My Garage",       url: "soldasis.place/garage",     icon: "wrench" },
  collection: { tab: "Sold As-Is — My Collection",   url: "soldasis.place/collection", icon: "trophy" },
  ledger:     { tab: "Sold As-Is — The Ledger",       url: "soldasis.place/ledger",     icon: "ledger" },
  settings:   { tab: "Sold As-Is — Settings",           url: "soldasis.place/settings",   icon: "gear" },
};

// Buyer archetypes (aud196): economy ranges stay inside the aud187 envelope.
// open/max are fractions of the asking price; walk/accept multiply the base chances.
const BUYER_ECON = {
  eager:      { open: [0.78, 0.90], max: [0.95, 1.05], walk: 0.6,  accept: 1.15, w: 0.20 },
  haggler:    { open: [0.60, 0.75], max: [0.85, 0.97], walk: 1.0,  accept: 0.8,  w: 0.30 },
  flaky:      { open: [0.65, 0.85], max: [0.80, 0.95], walk: 1.3,  accept: 1.0,  w: 0.12 },
  lowballer:  { open: [0.45, 0.58], max: [0.68, 0.80], walk: 1.2,  accept: 0.85, w: 0.08 },
  collector:  { open: [0.80, 0.92], max: [0.98, 1.10], walk: 0.5,  accept: 1.1,  w: 0.06 },
  dad:        { open: [0.72, 0.84], max: [0.90, 0.98], walk: 0.8,  accept: 1.0,  w: 0.07 },
  reseller:   { open: [0.58, 0.68], max: [0.80, 0.88], walk: 1.0,  accept: 0.9,  w: 0.07 },
  tirekicker: { open: [0.70, 0.85], max: [0.85, 0.95], walk: 1.8,  accept: 0.9,  w: 0.05 },
  neighbor:   { open: [0.78, 0.88], max: [0.92, 1.00], walk: 0.55, accept: 1.1,  w: 0.05 },
};
function rollBuyerStyle() {
  let r = Math.random();
  for (const [k, v] of Object.entries(BUYER_ECON)) { if ((r -= v.w) <= 0) return k; }
  return "haggler";
}
// Whacky buyer voices for the six new archetypes. {A} = the money amount in play.
const BUYER_LINES = {
  lowballer: {
    opener: ["still got it? {A} cash", "{A} and I come now. not a dollar more", "{A}. that's real money, most people offer nothing", "whats ur lowest. actually just take {A}"],
    counterAccept: ["fine. {A}. your lucky day", "ok {A}. don't tell anyone I paid that", "{A} done. I usually get these cheaper but whatever"],
    generous: ["fine fine {A}. take it before I remember my principles", "{A}. I'm being generous and I hate it"],
    counterBack: ["{A}. I don't go higher, that's my whole thing", "{A}. final. I've got three more tabs open with these", "thats still above {A} in my book. {A}. take it"],
    walk: ["lol ok good luck getting more", "pass. they never sell at that", "too rich. I'll check back when it drops"],
    ultimatum: ["{A}. ceiling. I've bought six of these, I know", "last: {A}. the market is me and I have spoken"],
    ultimatumWalk: ["told you. bye", "good luck then lol"]
  },
  collector: {
    opener: ["I've been looking for this exact one. {A}?", "finally, one of these in the wild. {A}, and I won't play games under it", "you have no idea how long I've searched. {A} fair?"],
    counterAccept: ["{A}. done. she completes the set", "deal at {A}. she'll be garaged with her sisters", "{A}. yes. these deserve to be kept together"],
    generous: ["{A}. gladly. condition like this is getting rare", "{A}. fine — originality is worth paying for"],
    counterBack: ["I can do {A}. I know what these are worth — that's respect, not a lowball", "{A}. check the auctions. I'm above all of them", "come to {A} and she goes to a real collection"],
    walk: ["a shame. if you reconsider, my offer stands", "I'll pass, with genuine regret", "keep my name. these come back around"],
    ultimatum: ["{A}. that's top of market and we both know it", "my ceiling is {A}, and it's a collector's ceiling"],
    ultimatumWalk: ["understood. the hunt continues", "I said my number. good luck — truly"]
  },
  dad: {
    opener: ["hi! looking for my kid — first bike. {A}?", "{A}? it's for my son, he's been saving all summer", "is it a good beginner bike? also {A}?", "dad here. {A} for my daughter's first ride?"],
    counterAccept: ["{A}. deal. he's going to lose his mind", "done at {A}. father of the year, locked in", "{A}. yes! don't tell him, it's a surprise"],
    generous: ["{A}. alright — his grades earned it", "{A}. fine. a good first bike is worth it"],
    counterBack: ["{A}? that's the birthday fund AND the christmas fund", "I can do {A}. help a dad out", "{A} is everything he saved plus what I promised to match"],
    walk: ["too steep for us. thanks anyway!", "we'll keep saving. good luck!", "can't swing it. he's gonna be bummed lol"],
    ultimatum: ["{A}. that's the whole budget, I triple-checked with my wife", "my ceiling is {A} — any higher needs spousal approval and a meeting"],
    ultimatumWalk: ["I said the number... thanks anyway", "understood. the search continues. pray for me"]
  },
  reseller: {
    opener: ["{A} cash, I pick up today, no stories", "{A}. I buy these every week. quick close?", "what's your real number. mine's {A}", "{A}, cash in hand, gone within the hour"],
    counterAccept: ["{A}. done. I don't waste time", "deal. {A}. where am I going", "{A} works. see you in an hour"],
    generous: ["{A}. fine. margins thin but volume is volume", "{A}. ok. you negotiate like a pro"],
    counterBack: ["{A} is my number. I've got margin math on this", "can't. {A}. I resell, I don't retail", "{A} today or I buy the other one tomorrow. simple"],
    walk: ["no hard feelings. business", "pass. if it sits, my number stands", "I'm out at that price. good luck"],
    ultimatum: ["{A}. ceiling. after that the numbers stop working", "final: {A}. take it or I redeploy the cash"],
    ultimatumWalk: ["told you it was the ceiling. bye", "business is business. later"]
  },
  tirekicker: {
    opener: ["{A}? maybe. is the seat comfy", "thinking about {A}. no rush. I'm always thinking about bikes", "{A}. let me think about it. also can I sit on it first", "I could see myself on this. {A}?"],
    counterAccept: ["ok {A}. wait — yeah. ok. {A}", "{A}. fine. I think. yes. probably yes", "deal at {A}. don't let me back out lol"],
    generous: ["{A}?? ok wow I'm doing this. I'm buying a bike", "{A}. fine!! impulsive but fine"],
    counterBack: ["{A}? eh. let me sleep on it. but like, probably {A}", "I could do {A}. or the other one I saw. yours has better vibes", "{A}. maybe. ask me again tomorrow, I might feel richer"],
    walk: ["yeah I'm gonna pass for now. or forever. unclear", "nvm I just measured my garage. tragic", "I'm out. I was never fully in. but good luck"],
    ultimatum: ["{A}. my final. subject to me changing my mind. but final", "{A} — ceiling. I asked my group chat and they said that's enough"],
    ultimatumWalk: ["I said final-ish. bye I guess", "yeah ok bye. nice bike tho"]
  },
  neighbor: {
    opener: ["hey neighbor! I'm over by the water tower. {A}?", "{A} and I can walk over with cash today", "seen this listed — I'm 10 min away. {A}?", "howdy. local here. {A} and a handshake?"],
    counterAccept: ["{A}! done. I'll bring the truck around", "deal — {A}. small town, good bikes", "{A}. yes! see you shortly"],
    generous: ["{A}. gladly. rather buy local anyway", "{A}. fine — you keep the town riding"],
    counterBack: ["{A} and I throw in a six pack for the trouble", "can you do {A}? I'm right here in town, easy pickup", "{A} is my number, neighbor. no shipping, no drama"],
    walk: ["ah well. if it doesn't sell, I'm right here in town!", "too rich for me. good luck, neighbor", "I'll wave when I see it riding around town lol"],
    ultimatum: ["{A}. that's the whole cookie jar", "{A} final — and I'll still wave at you in town"],
    ultimatumWalk: ["said my number. take care neighbor", "no hard feelings. small town!"]
  }
};
function buyerLine(style, kind, amount) {
  const pool = BUYER_LINES[style] && BUYER_LINES[style][kind];
  if (!pool || !pool.length) return null;
  const a = amount != null ? money(amount) : "";
  return pool.map((t) => t.split("{A}").join(a));
}

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
    // Swap header logo per site (Boneyard / Crate Fresh feel like different sites)
    const isBoneyard = name === "parts";
    const isCrate = name === "crate";
    document.getElementById("logo-main").classList.toggle("hidden", isBoneyard || isCrate);
    document.getElementById("logo-boneyard").classList.toggle("hidden", !isBoneyard);
    const logoCrate = document.getElementById("logo-crate");
    if (logoCrate) logoCrate.classList.toggle("hidden", !isCrate);
    // Swap the "Search by moped" dropdown for the "find parts that fit" bike
    // filter on both parts stores; no search control at all on Collection,
    // Ledger, or Settings
    document.getElementById("site-search").classList.toggle("hidden", isBoneyard || isCrate || name === "collection" || name === "ledger" || name === "settings");
    const mpr = document.getElementById("model-pick-row");
    if (mpr) {
      mpr.classList.toggle("hidden", !(isBoneyard || isCrate));
      if (isBoneyard || isCrate) this.renderModelPickRow();
      else this.closeModelPicker();
    }
    // The moped dropdown shows the filter that belongs to the view you're on
    const bsSel = document.getElementById("bike-search");
    if (bsSel && (name === "market" || name === "garage")) {
      const v = name === "garage" ? (this.garageBikeFilter || "all") : (Feed.bikeFilter || "all");
      if (bsSel.value !== v) { bsSel.value = v; if (bsSel._ddRender) bsSel._ddRender(); }
    }
    // Update refresh button for the active tab
    this.updateRefreshBtn();
    document.getElementById("feed").style.display = name === "market" ? "" : "none";
    document.getElementById("cats").style.display = name === "market" && this.marketTab === "browse" ? "" : "none";
    document.getElementById("market-tabs").style.display = name === "market" ? "" : "none";
    document.getElementById("parts-view").classList.toggle("hidden", name !== "parts");
    const crateView = document.getElementById("crate-view");
    if (crateView) crateView.classList.toggle("hidden", name !== "crate");
    document.getElementById("garage-view").classList.toggle("hidden", name !== "garage");
    document.getElementById("collection-view").classList.toggle("hidden", name !== "collection");
    document.getElementById("ledger-view").classList.toggle("hidden", name !== "ledger");
    document.getElementById("settings-view").classList.toggle("hidden", name !== "settings");
    if (name === "market") {
      this.renderMarketTabs(); this.renderMarketFeed();
      if (this.marketTab === "mine") this.clearMarketBadges();
    }
    if (name === "parts") {
      this.renderParts();
      if (this.boneyardTab === "sell") this.clearPartsBadges();
    }
    if (name === "crate") this.renderCrate();
    if (name === "garage") this.renderGarage();
    if (name === "collection") this.renderCollection();
    if (name === "ledger") this.renderLedger();
    if (name === "settings" && typeof this.renderSettings === "function") this.renderSettings();
    const n = document.getElementById("nav-garage-n");
    if (n) n.textContent = State.garage.length ? `${State.garage.length}` : "";
  },

  boneyardPick: "", // Boneyard's own "shop for this garage model" pick
  cratePick: "",    // Crate Fresh's own pick — the two stores never share
  partsSearch: "",
  garageBikeFilter: null, // header "Search by moped" applied to the garage
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
  crateStock: null, // Crate Fresh NOS stock (persisted in the save); null = not rolled yet
  crateSearch: "",
  partDetailSource: "shop", // "shop" (Boneyard) | "crate" (Crate Fresh) for the part detail page
  crateDetailIdx: -1,
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
  // Crate Fresh runs its OWN refresh economy — independent of the Boneyard's
  crateRefreshesLeft: 3,
  crateCooldownUntil: 0,
  CRATE_COOLDOWN_KEY: "soldasis_crate_cooldown",
  CRATE_REFRESHES_KEY: "soldasis_crate_refreshes",
  _btnTimer: null, // the refresh button's single display driver

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
      this.updateRefreshBtn();
      return;
    }
    this.partsRefreshesLeft--;
    try { localStorage.setItem(this.PARTS_REFRESHES_KEY, String(this.partsRefreshesLeft)); } catch (e) {}
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
      }
    }
    if (this.partsRefreshesLeft <= 0) {
      this.partsCooldownUntil = Date.now() + 30 * 1000;
      try {
        localStorage.setItem(this.PARTS_COOLDOWN_KEY, String(this.partsCooldownUntil));
        localStorage.setItem(this.PARTS_REFRESHES_KEY, "0");
      } catch (e) {}
    }
    this.updateRefreshBtn();
  },

  tickPartsCooldown() {
    // Legacy entry point — the button is now rendered by updateRefreshBtn's
    // single display driver, which only ever shows the current tab's timer
    this.updateRefreshBtn();
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
          // Fresh session: always reset to 3 free refreshes
          this.partsRefreshesLeft = 3;
          localStorage.setItem(this.PARTS_REFRESHES_KEY, "3");
          localStorage.removeItem(this.PARTS_COOLDOWN_KEY);
        }
      } catch (e) {}
    }
    // Restore the Crate Fresh economy once per session (independent of the Boneyard's)
    if (!this._crateRestored) {
      this._crateRestored = true;
      try {
        const savedCooldown = parseInt(localStorage.getItem(this.CRATE_COOLDOWN_KEY) || "0", 10);
        if (savedCooldown > Date.now()) {
          this.crateCooldownUntil = savedCooldown;
          this.crateRefreshesLeft = 0;
        } else {
          this.crateRefreshesLeft = 3;
          localStorage.setItem(this.CRATE_REFRESHES_KEY, "3");
          localStorage.removeItem(this.CRATE_COOLDOWN_KEY);
        }
      } catch (e) {}
    }
    const btn = document.getElementById("refresh-btn");
    if (!btn) return;
    // SINGLE WRITER: one display driver renders ONLY the current tab's refresh
    // economy. Each tab's timer runs independently; nothing else writes this
    // button, so timers can never bleed across tabs or ghost over each other.
    clearInterval(this._btnTimer);
    this._btnTimer = null;
    const render = () => {
      const now = Date.now();
      if (this.current === "market") {
        const remain = Math.ceil((Feed.cooldownUntil - now) / 1000);
        if (remain > 0) {
          btn.disabled = true;
          btn.classList.add("cooling");
          const m = Math.floor(remain / 60), s = remain % 60;
          btn.textContent = `${m}:${String(s).padStart(2, "0")}`;
          btn.title = `Refresh available in ${m}:${String(s).padStart(2, "0")}`;
        } else {
          btn.disabled = false;
          btn.classList.remove("cooling");
          btn.innerHTML = "↻";
          btn.title = "Refresh listings";
          clearInterval(this._btnTimer); this._btnTimer = null;
        }
      } else if (this.current === "parts" || this.current === "crate") {
        const crate = this.current === "crate";
        let until = crate ? this.crateCooldownUntil : this.partsCooldownUntil;
        let remain = Math.ceil((until - now) / 1000);
        if (until && remain <= 0) {
          // This tab's cooldown finished — reset ITS free refreshes only
          if (crate) {
            this.crateCooldownUntil = 0;
            this.crateRefreshesLeft = 3;
            try { localStorage.setItem(this.CRATE_REFRESHES_KEY, "3"); localStorage.removeItem(this.CRATE_COOLDOWN_KEY); } catch (e) {}
          } else {
            this.partsCooldownUntil = 0;
            this.partsRefreshesLeft = 3;
            try { localStorage.setItem(this.PARTS_REFRESHES_KEY, "3"); localStorage.removeItem(this.PARTS_COOLDOWN_KEY); } catch (e) {}
          }
          until = 0; remain = 0;
        }
        if (remain > 0) {
          btn.disabled = true;
          btn.classList.add("cooling");
          btn.textContent = `${remain}s`;
          btn.title = crate ? `Crate Fresh restock in ${remain}s` : `Boneyard refresh in ${remain}s`;
        } else {
          btn.disabled = false;
          btn.classList.remove("cooling");
          btn.innerHTML = "↻";
          btn.title = crate
            ? `Restock Crate Fresh (${this.crateRefreshesLeft} free left)`
            : `Refresh Boneyard (${this.partsRefreshesLeft} free left)`;
          clearInterval(this._btnTimer); this._btnTimer = null;
        }
      } else {
        // Garage/collection: no refresh here
        btn.style.display = "none";
        clearInterval(this._btnTimer); this._btnTimer = null;
        return;
      }
      btn.style.display = "";
    };
    render();
    const cooling = this.current === "market" ? Feed.cooldownUntil > Date.now()
      : this.current === "parts" ? this.partsCooldownUntil > Date.now()
      : this.current === "crate" ? this.crateCooldownUntil > Date.now()
      : false;
    if (cooling && !this._btnTimer) this._btnTimer = setInterval(render, 1000);
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
        <button class="eby-type${this.marketTab === "mine" ? " active" : ""}" data-mtab="mine">My Listings${(() => { const n = this.myBikeListings.filter(l => !l.sold).length; return n ? ` (${n})` : ""; })()}</button>
      </div>
      ${this.marketTab === "browse" ? `<div class="mkt-pane-head"><h2>Fresh listings</h2><div class="sub">Haggle hard. Flip fast.</div></div>` : ""}`;
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
          ${l.offer && !l.offer.seen && !l.sold ? `<span class="listing-dot"></span>` : ""}

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
  buyerNames: ["Mike R.", "Sarah K.", "Dave", "Jen T.", "Tommy", "Alex P.", "Chris", "Sam", "Jordan", "Pat", "Marcus", "Priya S.", "Big Mike", "Lorraine", "Chad", "Deborah W.", "Hank", "Yuki T.", "Omar F.", "Greta", "Pastor John", "Becca", "Rosa M.", "Kenny", "Jeb", "Marisol", "Craig L.", "Nadia", "Old Man Jenkins", "Aunt Sharon"],

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
    // 20%: buyer just pays asking price, no haggling — but only when the
    // ask is sane (<= 1.15x fair value). Absurd asks never get an instant
    // buy; they only draw negotiated offers, which are capped (aud206).
    const fair = listing.fairValue || listing.boughtFor || askPrice;
    const saneAsk = askPrice <= Math.round((fair * 1.15) / 5) * 5;
    if (saneAsk && Math.random() < 0.20) {
      const buyerName = this.buyerNames[(Math.random() * this.buyerNames.length) | 0];
      listing.sold = true; listing.soldFor = askPrice; listing.soldAt = Date.now();
      State.cash += askPrice;
      State.sold.push({ ...listing, soldFor: askPrice, soldAt: Date.now() });
      UI.refreshCash();
      // Stats + XP (same as haggle accept)
      const costBasis = (listing.boughtFor || listing.paidPrice || 0) + (listing.repairSpent || 0);
      if (askPrice > costBasis) State.stats.bikesSoldForProfit = (State.stats.bikesSoldForProfit || 0) + 1;
      if (askPrice > costBasis && isUnique(listing.sprite)) State.stats.uniquesSoldForProfit = (State.stats.uniquesSoldForProfit || 0) + 1;
      if (typeof Milestones !== "undefined") Milestones.check(State.stats);
      const xpResult = Skills.awardForSale(askPrice, costBasis);
      if (xpResult.xp > 0) XPPopup.show(xpResult.xp, xpResult.newPoints);
      Save.save();
      // Log to activity only (no toast — bell dot handles it)
      try {
        const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
        const binProfit = askPrice - costBasis;
        const binPl = binProfit >= 0 ? `+$${Math.round(binProfit).toLocaleString()}` : `-$${Math.round(Math.abs(binProfit)).toLocaleString()}`;
        const binPlWord = binProfit >= 0 ? "profit" : "loss";
        feed.unshift({ msg: `${buyerName} bought your ${listing.brand} ${listing.model} at listing price (${money(askPrice)} · ${binPl} ${binPlWord})`, at: Date.now(), cat: "marketplace", listingId: listing.id, clickable: true, soldView: true });
        if (feed.length > 50) feed.length = 50;
        localStorage.setItem("soldasis_activity", JSON.stringify(feed));
      } catch (e) {}
      UI._unreadActivity = (UI._unreadActivity || 0) + 1;
      UI._unreadMarketplace = (UI._unreadMarketplace || 0) + 1;
      UI.updateBellBadge();
      if (typeof AudioEngine !== "undefined" && AudioEngine.playBell) AudioEngine.playBell();
      if (this.current === "market") { this.renderMarketFeed(); this.renderMarketTabs(); }
      return;
    }
    // Buyer archetype (aud196): nine styles, econ from BUYER_ECON
    const style = rollBuyerStyle();
    const econ = BUYER_ECON[style] || BUYER_ECON.haggler;
    const offerPct = econ.open[0] + Math.random() * (econ.open[1] - econ.open[0]);
    // Offers anchor to true value, never to a fantasy ask (aud208): the
    // opener is a % of whichever is lower — your ask or the fair value —
    // and can never exceed the buyer's own ceiling.
    const fairBase = listing.fairValue || listing.boughtFor || askPrice;
    const offerAmount = Math.round((Math.min(askPrice, fairBase) * offerPct) / 5) * 5;
    const buyerName = this.buyerNames[(Math.random() * this.buyerNames.length) | 0];
    const maxPct = econ.max[0] + Math.random() * (econ.max[1] - econ.max[0]);
    // Smooth Talker: buyers open higher and stretch further
    const stBonus = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    // Good copy earns buyers' trust (sell score 0-3 → up to +9%, capped by fair value)
    const sellScore = this.descSellScore(listing.desc || "");
    const sellBonus = sellScore * 0.03;
    let boostedMax = Math.round((fairBase * maxPct * (1 + stBonus)) / 5) * 5;
    // Hard cap: buyers won't pay more than 1.5x fair value, no matter the asking price
    const fairCap = Math.round((fairBase * 1.5) / 5) * 5;
    boostedMax = Math.min(boostedMax, fairCap);
    const boostedOffer = Math.min(Math.round((offerAmount * (1 + stBonus + sellBonus)) / 5) * 5, boostedMax);
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
    // Log to activity only (bell dot), no toast
    try {
      const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
      feed.unshift({ msg: `${buyerName} offered ${money(boostedOffer)} for your ${listing.brand} ${listing.model}`, at: Date.now(), cat: "marketplace", listingId: listing.id, clickable: true });
      if (feed.length > 50) feed.length = 50;
      localStorage.setItem("soldasis_activity", JSON.stringify(feed));
    } catch (e) {}
    UI._unreadActivity = (UI._unreadActivity || 0) + 1;
    UI._unreadMarketplace = (UI._unreadMarketplace || 0) + 1;
    UI.updateBellBadge();
    // Bell sound only for offer notifications
    if (typeof AudioEngine !== "undefined" && AudioEngine.playBell) AudioEngine.playBell();
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
  openSoldFromActivity(listingId) {
    // Go to market > my listings > sold tab
    this.marketTab = "mine";
    this.show("market");
    // The sold listing is visible in My Listings
  },
  openOfferFromActivity(listingId) {
    // Go to market > my listings, then open the haggle
    this.marketTab = "mine";
    this.show("market");
    setTimeout(() => {
      const idx = this.myBikeListings.findIndex(l => String(l.id) === String(listingId));
      if (idx >= 0 && this.myBikeListings[idx].offer) {
        this.openSellerHaggle(this.myBikeListings, idx);
      }
    }, 150);
  },
  openSellerHaggle(listingsArray, idx) {
    const l = listingsArray[idx];
    if (!l || !l.offer) return;
    // Mark as seen — clears the notification dot
    l.offer.seen = true;
    this.renderMarketTabs();
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
    const prevHaggle = el.querySelector(".haggle-modal");
    const savedHaggleScroll = prevHaggle ? prevHaggle.scrollTop : 0;
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
            <input type="text" inputmode="none" id="haggle-counter" placeholder="Counter offer">
            <button class="haggle-counter" id="haggle-send-counter">Counter</button>
          </div>
          <button class="haggle-decline" id="haggle-decline">Decline</button>
        </div>
      </div>`;

    document.getElementById("haggle-close").addEventListener("click", () => this.closeSellerHaggle());
    document.getElementById("haggle-accept").addEventListener("click", () => this.acceptBuyerOffer());
    document.getElementById("haggle-decline").addEventListener("click", () => this.declineBuyerOffer());
    const haggleInput = document.getElementById("haggle-counter");
    if (haggleInput && typeof GameKB !== "undefined") {
      GameKB.attach(haggleInput, (val) => {
        if (val > 0) this.counterBuyerOffer(val);
      }, (typed) => {
        const hl = this.haggleListing;
        const theirOffer = hl && hl.offer ? hl.offer.amount : 0;
        const listPrice = hl ? (hl.askPrice || 0) : 0;
        let html = `Their offer <span class="kb-ctx-price">$${theirOffer.toLocaleString()}</span> · Your listing <span class="kb-ctx-price">$${listPrice.toLocaleString()}</span>`;
        if (typed > 0) {
          const diff = typed - theirOffer;
          if (diff > 0) html += `<br><span class="kb-ctx-over">$${diff.toLocaleString()} above their offer</span>`;
        }
        return html;
      });
    }
    document.getElementById("haggle-send-counter").addEventListener("click", () => {
      const input = document.getElementById("haggle-counter");
      const val = parseInt((input.dataset.raw || input.value).replace(/[^0-9]/g, ""), 10);
      if (val > 0) this.counterBuyerOffer(val);
    });
    // Scroll thread to bottom
    const thread = document.getElementById("haggle-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
    // Restore modal scroll
    const newHaggle = el.querySelector(".haggle-modal");
    if (newHaggle && savedHaggleScroll > 0) newHaggle.scrollTop = savedHaggleScroll;
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
      if (isUnique(l.sprite)) State.stats.uniquesSoldForProfit = (State.stats.uniquesSoldForProfit || 0) + 1;
    }
    State.stats.successfulHaggles++;
    // A negotiated sale (not buy-it-now, not auction) is a struck deal
    State.stats.dealsStruck = (State.stats.dealsStruck || 0) + 1;
    if (typeof Milestones !== "undefined") Milestones.check(State.stats);
    const xpResult = Skills.awardForSale(amount, costBasis);
    if (xpResult.xp > 0) XPPopup.show(xpResult.xp, xpResult.newPoints);
    // Sale notification (silent — red dot, no sound)
    try {
      const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
      const bikeName = `${l.brand} ${l.model}`;
      const pl = profit >= 0 ? `+$${Math.round(profit).toLocaleString()}` : `-$${Math.round(Math.abs(profit)).toLocaleString()}`;
      const plWord = profit >= 0 ? "profit" : "loss";
      feed.unshift({ msg: `Sold the ${bikeName} for ${money(amount)} (${pl} ${plWord})`, at: Date.now(), cat: "marketplace", listingId: l.id });
      if (feed.length > 50) feed.length = 50;
      localStorage.setItem("soldasis_activity", JSON.stringify(feed));
      if (typeof UI !== "undefined") {
        UI._unreadActivity = (UI._unreadActivity || 0) + 1;
        UI._unreadMarketplace = (UI._unreadMarketplace || 0) + 1;
        if (UI.updateBellBadge) UI.updateBellBadge();
      }
    } catch (e) {}
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
    // Countering HIGHER than your own listing price? Buyer thinks you're crazy.
    if (counterAmount > l.askPrice) {
      offer.thread.push({ from: "buyer", text: `"Are you smoking crack dude... your listing says ${money(l.askPrice)}."` });
      this.renderSellerHaggle();
      return;
    }

    const max = Math.max(offer.maxAmount || 0, offer.amount);
    const style = offer.style || "haggler";
    let response, accepted = false, walkedAway = false;

    // Buyers are cheap too — walk risk grows every round, mirroring seller patience
    const walkTable = [0, 0.10, 0.25, 0.50, 0.75];
    let walkChance = walkTable[Math.min(offer.rounds, 4)];
    walkChance = Math.min(0.9, walkChance * ((BUYER_ECON[style] || {}).walk || 1));
    // Generous buyer: rare early on, Smooth Talker warms people up (+4%/tier)
    const stTier = (typeof Skills !== "undefined") ? Skills.tier("smoothtalker") : 0;
    const generousChance = 0.03 + stTier * 0.04;

    if (counterAmount <= offer.amount) {
      // Met (or beat) their standing offer — done deal
      accepted = true;
      offer.amount = counterAmount;
      response = this.randomCounterAcceptResponse(counterAmount, style);
    } else if (offer.ultimatum) {
      // They already planted their flag at their ceiling and you pushed past it
      walkedAway = true;
      response = this.randomUltimatumWalkResponse(style);
    } else if (Math.random() < generousChance) {
      // Every so often a buyer just wants it and stops fighting
      accepted = true;
      offer.amount = counterAmount;
      response = this.randomGenerousAcceptResponse(counterAmount, style);
    } else if (counterAmount <= max) {
      // Inside their budget — but nobody pays the first counter if they can help it
      if (Math.random() < walkChance * 0.35) {
        walkedAway = true;
        response = this.randomWalkAwayResponse(style);
      } else {
        const gap = max - offer.amount;
        const prog = gap > 0 ? (counterAmount - offer.amount) / gap : 1;
        let acceptChance = 0.85 - prog * 0.55;
        acceptChance = Math.min(0.95, acceptChance * ((BUYER_ECON[style] || {}).accept || 1));
        if (Math.random() < acceptChance) {
          accepted = true;
          offer.amount = counterAmount;
          response = this.randomCounterAcceptResponse(counterAmount, style);
        } else {
          // Counter back: climb part of the gap, never past their ceiling
          const climb = 0.35 + Math.random() * 0.25;
          let newOffer = Math.round((offer.amount + (counterAmount - offer.amount) * climb) / 5) * 5;
          newOffer = Math.min(newOffer, max);
          if (newOffer <= offer.amount) newOffer = Math.min(offer.amount + 5, max);
          offer.amount = newOffer;
          if (newOffer >= max) offer.ultimatum = true;
          response = this.randomCounterBackResponse(offer.amount, style);
        }
      }
    } else if (counterAmount <= max * 1.15) {
      // Over their ceiling, but close enough to argue about
      if (Math.random() < walkChance) {
        walkedAway = true;
        response = this.randomWalkAwayResponse(style);
      } else if (Math.random() < 0.55) {
        offer.amount = max;
        offer.ultimatum = true;
        response = this.randomUltimatumResponse(max, style);
      } else {
        let plant = Math.round((max * 0.97) / 5) * 5;
        if (plant <= offer.amount) plant = Math.min(max, offer.amount + 5);
        offer.amount = plant;
        if (plant >= max) offer.ultimatum = true;
        response = this.randomCounterBackResponse(offer.amount, style);
      }
    } else {
      // Way over — most walk, the rest plant their flag
      if (Math.random() < Math.min(0.9, walkChance + 0.25)) {
        walkedAway = true;
        response = this.randomWalkAwayResponse(style);
      } else {
        offer.amount = max;
        offer.ultimatum = true;
        response = this.randomUltimatumResponse(max, style);
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
        // The listing stays up — only this buyer is gone
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
    const bl = buyerLine(style, "opener", amount); if (bl) return this.pickBuyerReply(bl);
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
    const bl = buyerLine(style, "counterAccept", amount); if (bl) return this.pickBuyerReply(bl);
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
      `${money(amount)}. Fine. FINE. You're good at this.`,
      `Deal — ${money(amount)}. Tell nobody I paid this much.`,
    ]);
  },

  randomCounterBackResponse(amount, style) {
    const bl = buyerLine(style, "counterBack", amount); if (bl) return this.pickBuyerReply(bl);
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
      `What about ${money(amount)} and I bring the truck TODAY? Like, right now today.`,
      `${money(amount)}! I sold my guitar for this. Do not let the guitar die in vain.`,
      `Okay deep breath — ${money(amount)}. That's me being brave.`,
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
      `${money(amount)}? my cousin said thats fair so`,
      `i could do ${money(amount)} if u dont make it weird`,
      `${money(amount)}. dont ask me to go higher i'll simply perish`,
    ]);
    return this.pickBuyerReply([
      `best i can do is ${money(amount)}`,
      `${money(amount)}. thats me meeting you more than halfway`,
      `i can come up to ${money(amount)}. thats it tho`,
      `${money(amount)} cash today, i pick up, no drama`,
      `look, ${money(amount)}. i want it but i aint overpaying`,
      `${money(amount)} is real money. the other guys are offering trades and stories`,
      `meet me at ${money(amount)} and we both stop typing`,
      `${money(amount)}. final-ish. dont make me say final`,
      `i got ${money(amount)} in hand right now. not hypothetical money, actual money`,
      `${money(amount)}. check what the others are listed at if u want. mines fair`,
      `ok ${money(amount)}. thats me climbing. your turn to come down`,
      `${money(amount)} and i wont ask about the title, the carb, or your life choices`,
    ]);
  },

  randomWalkAwayResponse(style) {
    const bl = buyerLine(style, "walk", null); if (bl) return this.pickBuyerReply(bl);
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

  randomUltimatumResponse(amount, style) {
    const bl = buyerLine(style, "ultimatum", amount); if (bl) return this.pickBuyerReply(bl);
    if (style === "eager") return this.pickBuyerReply([
      `Okay — ${money(amount)}. That's truly everything I can scrape together. Please?`,
      `${money(amount)} is me emptying the couch cushions AND the car console. That's my wall.`,
      `I can do ${money(amount)} and not a penny more. I'm begging you, that's the ceiling.`,
      `${money(amount)} — final. If I go higher I can't afford gas to come get it.`,
      `That's ${money(amount)} and it's every dollar with my name on it. Take it or leave it?`,
      `My absolute max is ${money(amount)}. I measured. Twice. Please say yes.`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `${money(amount)}. thats my final. probably. yeah final`,
      `ok ${money(amount)} is IT. no more games lol`,
      `${money(amount)} take it or leave it. i'll survive either way lol`,
      `last number: ${money(amount)}. lmk or dont`,
      `${money(amount)}. ceiling. floor. whatever. its the number`,
      `i can do ${money(amount)} and thats like, it it`,
    ]);
    return this.pickBuyerReply([
      `${money(amount)}. thats the ceiling. like, the actual ceiling`,
      `final answer: ${money(amount)}. i dont say that lightly`,
      `${money(amount)} is where my budget ends. plant the flag, whatever. its the number`,
      `one number left in me: ${money(amount)}. after that, we are just pen pals`,
      `${money(amount)}. take it and i come today. leave it and i buy the other one tmrw`,
      `my wall is ${money(amount)}. ran into it twice already today`,
    ]);
  },

  randomUltimatumWalkResponse(style) {
    const bl = buyerLine(style, "ultimatumWalk", null); if (bl) return this.pickBuyerReply(bl);
    if (style === "eager") return this.pickBuyerReply([
      `I told you that was my ceiling... I really wanted this one. Good luck.`,
      `Man. I said take it or leave it and you left it. I'm crushed. Bye.`,
      `That was genuinely all I had. Okay... good luck with the sale.`,
      `I emptied my whole budget and it wasn't enough. I'm out. So bummed.`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `lol i said final. bye`,
      `told u. ${"i'm"} out lol`,
      `u pushed it. nvm bye`,
      `yeah nah i said ceiling. later`,
    ]);
    return this.pickBuyerReply([
      `I said take it or leave it. You picked leave it. Good luck.`,
      `My ceiling was real. We're done here.`,
      `I planted my flag and you walked over it. I'm out.`,
      `That was my final number for a reason. Take care.`,
      `You had my best price and wanted more. We're done. Good luck.`,
    ]);
  },

  randomGenerousAcceptResponse(amount, style) {
    const bl = buyerLine(style, "generous", amount); if (bl) return this.pickBuyerReply(bl);
    if (style === "eager") return this.pickBuyerReply([
      `You know what? I just want it. ${money(amount)}. Done. No more games!`,
      `Life's short. ${money(amount)} — I'll take it!`,
      `Okay I can't pretend anymore, I NEED this bike. ${money(amount)}, deal!`,
      `${money(amount)}? Yes. I was never going to walk away from this one.`,
      `Sold! ${money(amount)}! My heart said yes three messages ago.`,
    ]);
    if (style === "flaky") return this.pickBuyerReply([
      `eh you know what. fine. ${money(amount)}. lets just do it lol`,
      `okay okay ${money(amount)}. i want it. there, i said it`,
      `${money(amount)}. yeah. surprising myself here too`,
      `whatever, ${money(amount)}. future me can deal with it`,
    ]);
    return this.pickBuyerReply([
      `Alright — ${money(amount)}. Don't tell the other sellers I went soft.`,
      `You know what, ${money(amount)}. I like your style. Deal.`,
      `${money(amount)}. I've been lowballing people all week; consider this karma in reverse.`,
      `Fine, ${money(amount)}. Sometimes you just pay the number and go ride.`,
      `I'll do ${money(amount)}. My therapist says I need to commit to things.`,
    ]);
  },



  tickBikeSales() {
    // Single buyer system: one buyer at a time per listing.
    // They either buy it now (asking price) or make an offer to negotiate.
    this.maybeMakeOffer();
  },

  tickSales() {
    this.maybeMakeOffer();
    if (!this.myPartListings.length) return;
    // Each listing has a chance to sell every tick
    // Better prices (closer to market value) sell faster
    for (let i = this.myPartListings.length - 1; i >= 0; i--) {
      const l = this.myPartListings[i];
      if (l.sold) continue;
      // Don't auto-sell a listing the player is actively viewing
      if (typeof PartDetail !== "undefined" && PartDetail.current && PartDetail.current.id === l.id) continue;
      l.ticksListed = (l.ticksListed || 0) + 1;
      // Base 8% chance per 5s tick, adjusted by price fairness
      const marketPrice = Math.round(PART_BASE_PRICE[l.partKey] * PART_COND_MULT[l.state] || 20);
      const fairness = marketPrice / Math.max(1, l.askPrice); // >1 = good deal, <1 = overpriced
      const chance = Math.min(0.30, 0.08 * fairness);
      if (Math.random() < chance) {
        l.sold = true; l.soldFor = l.askPrice; l.soldAt = Date.now();
        l.winner = this.buyerNames[(Math.random() * this.buyerNames.length) | 0];
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
        // Notify: part sold at asking price (boneyard tab shows winner + price)
        // Log to activity only (bell dot), no toast
        try {
          const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
          feed.unshift({ msg: `${l.winner || "Buyer"} won your ${l.partLabel} for ${money(l.askPrice)}`, at: Date.now(), cat: "boneyard" });
          if (feed.length > 50) feed.length = 50;
          localStorage.setItem("soldasis_activity", JSON.stringify(feed));
        } catch (e) {}
        UI._unreadActivity = (UI._unreadActivity || 0) + 1;
        UI.updateBellBadge();
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
          <input type="text" inputmode="none" id="sell-price-${idx}" value="${marketPrice}" min="1">
          <button class="eby-confirm" data-confirm-sell="${idx}" data-ltype="${listType}">${btnText}</button>
          <button class="eby-cancel" data-cancel-sell>${Icon.get('close')}</button>
        </div>
      </div>`;
      const input = el.querySelector(`#sell-price-${idx}`);
      const paidPrice = part && part.paidPrice ? part.paidPrice : 0;
      if (input && typeof GameKB !== "undefined") GameKB.attach(input, null, (typed) => {
        let html = `Fair market <span class="kb-ctx-price">~$${marketPrice.toLocaleString()}</span>`;
        html += paidPrice
          ? ` · You paid <span class="kb-ctx-price">$${paidPrice.toLocaleString()}</span>`
          : ` · You paid <span class="kb-ctx-price">—</span>`;
        if (typed > 0 && paidPrice) {
          const diff = typed - paidPrice;
          if (diff > 0) html += `<br><span class="kb-ctx-under">+$${diff.toLocaleString()} profit if it sells</span>`;
          else if (diff < 0) html += `<br><span class="kb-ctx-over">-$${(-diff).toLocaleString()} loss if it sells</span>`;
        }
        return html;
      });
      const confirmBtn = el.querySelector(`[data-confirm-sell="${idx}"]`);
      const cancelBtn = el.querySelector(`[data-cancel-sell]`);
      if (confirmBtn) confirmBtn.addEventListener("click", () => {
        const ltype = confirmBtn.dataset.ltype;
        const priceVal = input.dataset.raw || input.value;
        if (ltype === "auction") {
          this.listPartAuction(idx, priceVal);
        } else {
          this.listPartForSale(idx, priceVal);
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
    const state = p.state === "nos" ? "nos" : pctToState(pct); // NOS is a state, never derived from %
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
          // Notify: someone won our auction
          try {
            const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
            feed.unshift({ msg: `${l.highBidder} won your ${l.partLabel} auction for ${money(l.currentBid)}`, at: Date.now(), cat: "boneyard" });
            if (feed.length > 50) feed.length = 50;
            localStorage.setItem("soldasis_activity", JSON.stringify(feed));
          } catch (e) {}
          UI._unreadActivity = (UI._unreadActivity || 0) + 1;
          UI._unreadBoneyard = (UI._unreadBoneyard || 0) + 1;
          UI.updateBellBadge();
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
        const state = l.state === "nos" ? "nos" : pctToState(pct);
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
          <div class="eby-cond${state === "nos" ? " nos" : ""}">${PART_STATE_LABEL[state]} · ${pct}%</div>
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
          <div class="eby-cond${state === "nos" ? " nos" : ""}">${PART_STATE_LABEL[state]} · ${pct}%</div>
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
        // Auction win notification (bell + activity)
        try {
          const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
          feed.unshift({ msg: `You won the auction for ${p.partLabel} at ${money(p.currentBid)}`, at: Date.now(), cat: "boneyard" });
          if (feed.length > 50) feed.length = 50;
          localStorage.setItem("soldasis_activity", JSON.stringify(feed));
        } catch (e) {}
        UI._unreadActivity = (UI._unreadActivity || 0) + 1;
        UI._unreadBoneyard = (UI._unreadBoneyard || 0) + 1;
        UI.updateBellBadge();
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

  // ----- "Shop for a garage model" picker (aud205) -----
  // One header row, per-store picks: each parts store remembers its own
  // chosen model, and the list only ever shows models in the garage.
  initModelPicker() {
    const row = document.getElementById("model-pick-row");
    if (!row || row._wired) return;
    row._wired = true;
    row.addEventListener("click", () => this.toggleModelPicker());
    document.addEventListener("click", (e) => {
      const panel = document.getElementById("model-pick-panel");
      if (panel && !panel.classList.contains("hidden")
        && !e.target.closest("#model-pick-panel") && !e.target.closest("#model-pick-row")) {
        this.closeModelPicker();
      }
    });
  },
  activePick() { return this.current === "crate" ? this.cratePick : this.boneyardPick; },
  setPick(sprite) {
    if (this.current === "crate") this.cratePick = sprite;
    else this.boneyardPick = sprite;
  },
  validPick(sprite) {
    return !!sprite && State.garage.some(g => g.sprite === sprite);
  },
  renderModelPickRow() {
    const row = document.getElementById("model-pick-row");
    if (!row) return;
    const pick = this.activePick();
    const bike = pick ? BIKES.find(b => b.sprite === pick) : null;
    const empty = !State.garage.length;
    row.innerHTML = `${Icon.get('scooter')}<span>${bike ? bike.brand + " " + bike.name : (empty ? "No bikes yet" : "Add model")}</span><span class="mp-chev">›</span>`;
    row.classList.toggle("disabled", empty);
  },
  pickHint(sprite, needMap) {
    const nd = needMap[sprite];
    if (!nd || !nd.worstType) return "Complete";
    const def = availableParts(sprite).find(a => a.key === nd.worstType);
    const states = (State.garage.find(g => g.sprite === sprite) || {}).partStates || {};
    const missing = !states[nd.worstType] || states[nd.worstType] === "missing";
    if (missing) return "Missing " + (def ? def.label.toLowerCase() : "parts");
    let worn = 0;
    for (const g of State.garage) {
      if (g.sprite !== sprite) continue;
      for (const d of availableParts(sprite)) {
        const r = PART_STATE_RANK[(g.partStates || {})[d.key]] || 0;
        if (r > 0) worn++;
      }
      break;
    }
    return worn ? `${worn} worn part${worn > 1 ? "s" : ""}` : "Complete";
  },
  toggleModelPicker() {
    const panel = document.getElementById("model-pick-panel");
    if (!panel) return;
    if (!panel.classList.contains("hidden")) { this.closeModelPicker(); return; }
    if (!State.garage.length) return;
    const needMap = garageNeedMap();
    const models = [...new Set(State.garage.map(g => g.sprite))]
      .map(sp => BIKES.find(b => b.sprite === sp)).filter(Boolean)
      .sort((a, b) => ((needMap[b.sprite]?.score || 0) - (needMap[a.sprite]?.score || 0)) || a.name.localeCompare(b.name));
    const pick = this.activePick();
    panel.innerHTML =
      `<button class="mp-row${!pick ? " active" : ""}" data-pick=""><span class="mp-name">All models</span><span class="mp-hint">Browse everything</span></button>` +
      models.map(b => `<button class="mp-row${pick === b.sprite ? " active" : ""}" data-pick="${b.sprite}"><span class="mp-name">${b.brand} ${b.name}</span><span class="mp-hint">${this.pickHint(b.sprite, needMap)}</span></button>`).join("");
    const row = document.getElementById("model-pick-row");
    const r = row.getBoundingClientRect();
    panel.style.top = (r.bottom + 6) + "px";
    panel.style.left = r.left + "px";
    panel.style.width = Math.max(r.width, 240) + "px";
    panel.classList.remove("hidden");
    panel.querySelectorAll("[data-pick]").forEach(btn => btn.addEventListener("click", () => {
      this.setPick(btn.dataset.pick);
      this.closeModelPicker();
      this.renderModelPickRow();
      if (this.current === "crate") this.renderCrate();
      else this.renderParts();
    }));
  },
  closeModelPicker() {
    const panel = document.getElementById("model-pick-panel");
    if (panel) panel.classList.add("hidden");
  },

  renderParts(preserve) {
    if (this.boneyardPick && !this.validPick(this.boneyardPick)) this.boneyardPick = "";
    if (!this.partsShop.length) {
      this.partsShop = genPartsShop(16);
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
        if (this.boneyardPick && p.bikeSprite !== this.boneyardPick) return false;
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

      <div class="eby-list">` +
      (shown.length ? shown.map(p => {
        if (p.listingType === "auction") {
          const isWinning = p.highBidder === "you";
          const mins = Math.floor(p.timeLeft / 60), secs = p.timeLeft % 60;
          return `
      <div class="eby-item eby-auction" data-part-detail="${p.idx}">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy">
          ${p.state === "nos" ? `<div class="nos-badge">${Icon.get('star')} NOS</div>` : ""}
          <div class="eby-auc-badge" data-auc-timer="${p.idx}">⏱ ${mins}:${String(secs).padStart(2, "0")}</div>
        </div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond${p.state === "nos" ? " nos" : ""}">${p.stateLabel} · Auction</div>
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
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy">${p.state === "nos" ? `<div class="nos-badge">${Icon.get('star')} NOS</div>` : ""}</div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond${p.state === "nos" ? " nos" : ""}">${p.stateLabel}</div>
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
    this.partDetailSource = "shop";
    this.partDetailIdx = idx;
    this.partDetailOffer = null;
    this.renderPartDetail();
    document.getElementById("part-detail").classList.remove("hidden");
  },

  closePartDetail() {
    document.getElementById("part-detail").classList.add("hidden");
    this.closePartHaggle();
    this.partDetailIdx = -1;
    this.partDetailOffer = null;
    this.partDetailSource = "shop";
    this.crateDetailIdx = -1;
  },

  // --- Boneyard haggle modal (aud221): fixed bottom-sheet like #seller-haggle.
  // Economy logic lives in sendPartOffer (untouched); this is presentation only.
  openPartHaggle() {
    document.getElementById("part-haggle").classList.remove("hidden");
    this.renderPartHaggle();
  },
  closePartHaggle() {
    document.getElementById("part-haggle").classList.add("hidden");
  },
  renderPartHaggle() {
    const p = this.partsShop[this.partDetailIdx];
    const el = document.getElementById("part-haggle");
    if (!p || !el) { this.closePartHaggle(); return; }
    const offer = this.partDetailOffer;
    const thread = (offer && offer.thread) || [];
    // 67 easter egg has a response but no thread — show it as the seller's line
    const eggMsg = offer && !offer.thread && offer.response
      ? `<div class="msg seller">${offer.response}</div>` : "";
    let actions = "";
    if (!offer) {
      actions = `
        <div class="haggle-counter-row">
          <input type="text" inputmode="none" id="ph-offer-amount" class="ph-input" placeholder="Your offer ($)">
          <button class="eby-offer" id="ph-send-offer">Send Offer</button>
        </div>`;
    } else if (offer.accepted) {
      actions = `<button class="haggle-accept" id="ph-accept-offer">Buy for ${money(offer.price)}</button>`;
    } else if (offer.price && !offer.blocked && !offer.walkedAway) {
      actions = `
        <button class="haggle-accept" id="ph-accept-offer" style="margin-bottom:8px">Accept ${money(offer.price)}</button>
        <div class="haggle-counter-row">
          <input type="text" inputmode="none" id="ph-offer-amount" class="ph-input" placeholder="Counter offer ($)">
          <button class="eby-offer" id="ph-send-offer">Counter</button>
        </div>`;
    } else if (offer.blocked || offer.walkedAway) {
      actions = `<div class="ph-dead">This seller is done talking.</div>`;
    } else {
      actions = `
        <div class="haggle-counter-row">
          <input type="text" inputmode="none" id="ph-offer-amount" class="ph-input" placeholder="Counter offer ($)">
          <button class="eby-offer" id="ph-send-offer">Counter</button>
        </div>`;
    }
    el.innerHTML = `
      <div class="haggle-modal">
        <div class="haggle-head">
          <button class="haggle-close" id="ph-close">${Icon.get('close')}</button>
          <div class="haggle-title">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="haggle-sub">Asking ${money(p.price)} · ${p.stateLabel}</div>
        </div>
        <div class="haggle-photo"><img src="${p.img}" alt="${p.partLabel}"></div>
        <div class="msg-thread" id="ph-thread">
          ${eggMsg}
          ${thread.map(m => `<div class="msg ${m.from}">${m.text}</div>`).join("")}
        </div>
        <div class="haggle-actions">${actions}</div>
      </div>`;
    document.getElementById("ph-close").addEventListener("click", () => this.closePartHaggle());
    const input = document.getElementById("ph-offer-amount");
    if (input && typeof GameKB !== "undefined") {
      GameKB.attach(input, (kbVal) => {
        if (kbVal > 0) this.sendPartOffer(kbVal);
      }, (typed) => {
        const partAsk = p.price;
        const counter = offer && !offer.accepted ? offer.price : null;
        const target = counter && counter < partAsk ? counter : partAsk;
        let html = counter && counter < partAsk
          ? `Seller's at <span class="kb-ctx-price">$${counter.toLocaleString()}</span> · Asking $${partAsk.toLocaleString()}`
          : `Asking <span class="kb-ctx-price">$${partAsk.toLocaleString()}</span>`;
        if (typed > 0) {
          const diff = target - typed;
          if (diff > 0) html += ` · <span class="kb-ctx-under">$${diff.toLocaleString()} under</span>`;
          else if (diff < 0) html += ` · <span class="kb-ctx-over">$${(-diff).toLocaleString()} over</span>`;
          else html += ` · meets their price`;
        }
        return html;
      });
    }
    const sendBtn = document.getElementById("ph-send-offer");
    if (sendBtn) sendBtn.addEventListener("click", () => {
      const inp = document.getElementById("ph-offer-amount");
      const val = parseInt((inp.dataset.raw || inp.value).replace(/[^0-9]/g, ""), 10);
      if (val > 0) this.sendPartOffer(val);
    });
    const acceptBtn = document.getElementById("ph-accept-offer");
    if (acceptBtn) acceptBtn.addEventListener("click", () => {
      const price = this.partDetailOffer.price;
      const idx = this.partDetailIdx; // read BEFORE closing (close resets to -1)
      const part = this.partsShop[idx];
      this.closePartHaggle();
      this.closePartDetail();
      // Buy at the agreed price (same economy as the inline flow)
      if (part && State.canAfford(price)) {
        State.cash -= price;
        part.paidPrice = price;
        State.parts = State.parts || [];
        State.parts.push(part);
        this.partsShop.splice(idx, 1);
        UI.refreshCash();
        Save.save();
        this.renderParts();
      }
    });
    // Scroll thread to bottom; the modal itself never moves (fixed overlay)
    const threadEl = document.getElementById("ph-thread");
    if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
  },

  renderPartDetail() {
    const p = this.partsShop[this.partDetailIdx];
    if (!p) return;
    const el = document.getElementById("part-detail");
    // Preserve scroll position (don't jump to top on seller responses)
    const prevModal = el.querySelector(".pd-modal");
    const savedScroll = prevModal ? prevModal.scrollTop : 0;
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
          <input type="text" inputmode="none" id="pd-bid-amount" value="${minBid}" min="${minBid}">
        </div>
        <button class="pd-btn-primary" id="pd-place-bid">Place bid</button>
        <div class="pd-hint">Enter ${money(minBid)} or more</div>`;
    } else {
      actionHtml = `
        <button class="pd-btn-primary" id="pd-buy-now">Buy It Now</button>
        <button class="pd-btn-outline" id="pd-add-cart">Add to cart</button>
        <button class="pd-btn-outline" id="pd-make-offer-btn">Make offer</button>`;
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
      const bidInput = document.getElementById("pd-bid-amount");
      if (bidInput && typeof GameKB !== "undefined") {
        GameKB.attach(bidInput, (kbVal) => {
          const minBid = p.currentBid + (p.bidIncrement || 1);
          if (kbVal >= minBid) {
            this.placePartBid(this.partDetailIdx, kbVal);
            this.renderPartDetail();
          }
        }, (typed) => {
          const live = this.partsShop[this.partDetailIdx] || p;
          const curBid = live.currentBid;
          const minBidNow = live.currentBid + (live.bidIncrement || 1);
          let html = `Current bid <span class="kb-ctx-price">$${curBid.toLocaleString()}</span> · Min bid <span class="kb-ctx-price">$${minBidNow.toLocaleString()}</span>`;
          if (typed > 0 && typed < minBidNow) html += `<br><span class="kb-ctx-over">$${(minBidNow - typed).toLocaleString()} short of minimum</span>`;
          return html;
        });
      }
      document.getElementById("pd-place-bid").addEventListener("click", () => {
        const input = document.getElementById("pd-bid-amount");
        const val = parseInt((input.dataset.raw || input.value).replace(/[^0-9]/g, ""), 10);
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
        this.openPartHaggle();
      });
      const cartBtn = document.getElementById("pd-add-cart");
      if (cartBtn) cartBtn.addEventListener("click", () => {
        this.addToCart(this.partDetailIdx);
      });
    }
    // Restore scroll position
    const newModal = el.querySelector(".pd-modal");
    if (newModal && savedScroll > 0) newModal.scrollTop = savedScroll;
  },

  // Pick a random response, never repeating the last one
  _lastPartReply: null,
  pickPartReply(options) {
    this._recentPartReplies = this._recentPartReplies || [];
    let pool = options.filter(o => !this._recentPartReplies.includes(o));
    if (!pool.length) pool = options;
    const pick = pool[(Math.random() * pool.length) | 0];
    this._recentPartReplies.push(pick);
    if (this._recentPartReplies.length > 3) this._recentPartReplies.shift();
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
      this.renderPartHaggle();
      return;
    }
    // Seller personality — assigned once per listing
    if (!p.sellerStyle) {
      const r = Math.random();
      p.sellerStyle = r < 0.35 ? "motivated" : r < 0.70 ? "firm" : "flaky";
    }
    const style = p.sellerStyle;
    const persona = p.persona || personaOf(p.seller);
    // Track rounds
    p.offerRounds = (p.offerRounds || 0) + 1;
    const rounds = p.offerRounds;
    // Smooth Talker: discount boosts effective offer ratio
    const stDisc = (typeof Skills !== "undefined") ? Skills.haggleDiscount() : 0;
    const ratio = (offerAmount * (1 + stDisc)) / p.price;
    let response, accepted = false, price = null, blocked = false, walkedAway = false;

    // Block risk ramps up with lowballs and rounds (like marketplace sellers)
    const blockRisk = rounds === 1 ? 0 : rounds === 2 ? 0.10 : rounds === 3 ? 0.25 : rounds === 4 ? 0.50 : 0.75;
    if (p.lastCounter && offerAmount >= p.lastCounter) {
      // He met the seller's last counter — that's a deal, not another round
      accepted = true; price = offerAmount;
      response = HAGGLE.say(persona, "met", offerAmount);
    } else if (ratio < 0.50 && Math.random() < blockRisk) {
      blocked = true;
      State.stats.timesBlocked = (State.stats.timesBlocked || 0) + 1;
      response = HAGGLE.say(persona, "block", offerAmount);
    } else if (ratio >= 0.95) {
      // Near asking — motivated accepts fast, firm might squeeze, flaky might ghost
      if (style === "firm" && rounds < 2 && Math.random() < 0.3) {
        const squeeze = haggleCounter(offerAmount, p.price, (offerAmount + p.price) / 2, 5);
        if (squeeze) {
          p.lastCounter = squeeze;
          price = squeeze;
          response = HAGGLE.say(persona, "counter", offerAmount, squeeze);
        } else {
          accepted = true; price = offerAmount;
          response = HAGGLE.say(persona, "accept", offerAmount);
        }
      } else if (style === "flaky" && Math.random() < 0.15) {
        walkedAway = true;
        response = `"Sorry man, someone just messaged me about this. Gotta go."`;
      } else {
        accepted = true; price = offerAmount;
        response = HAGGLE.say(persona, "accept", offerAmount);
      }
    } else if (ratio >= 0.70) {
      // Reasonable — accept on 2nd+ round, or counter once based on personality
      if (rounds >= 2) {
        accepted = true; price = offerAmount;
        response = HAGGLE.say(persona, "grudging", offerAmount);
      } else {
        const patience = style === "motivated" ? 0.6 : style === "firm" ? 0.3 : 0.5;
        if (Math.random() < patience) {
          const anchor = p.lastCounter && p.lastCounter < p.price ? p.lastCounter : p.price;
          const counter = haggleCounter(offerAmount, anchor, (offerAmount + anchor) / 2, 5);
          if (!counter) { accepted = true; price = offerAmount; response = HAGGLE.say(persona, "met", offerAmount); }
          else { p.lastCounter = counter; price = counter; response = HAGGLE.say(persona, "counter", offerAmount, counter); }
        } else {
          accepted = true; price = offerAmount;
          response = HAGGLE.say(persona, "grudging", offerAmount);
        }
      }
    } else if (ratio >= 0.50) {
      // Low — firm sellers hold the line, others might deal
      const holdFirm = style === "firm" ? 0.8 : style === "motivated" ? 0.3 : 0.5;
      if (Math.random() < holdFirm) {
        const anchor = p.lastCounter && p.lastCounter < p.price ? p.lastCounter : p.price;
        const counter = haggleCounter(offerAmount, anchor, anchor * 0.9, 5);
        if (!counter) { accepted = true; price = offerAmount; response = HAGGLE.say(persona, "met", offerAmount); }
        else { p.lastCounter = counter; price = counter; response = HAGGLE.say(persona, "firm", offerAmount, counter); }
      } else {
        const anchor = p.lastCounter && p.lastCounter < p.price ? p.lastCounter : p.price;
        const counter = haggleCounter(offerAmount, anchor, (offerAmount + anchor) / 2, 5);
        if (!counter) { accepted = true; price = offerAmount; response = HAGGLE.say(persona, "met", offerAmount); }
        else { p.lastCounter = counter; price = counter; response = HAGGLE.say(persona, "counter", offerAmount, counter); }
      }
    } else {
      // Insulting — walk away chance
      const walkChance = style === "flaky" ? 0.50 : style === "motivated" ? 0.15 : 0.30;
      if (Math.random() < walkChance) {
        walkedAway = true;
        response = this.pickPartReply([
          `"${money(offerAmount)}?? Get outta here with that lowball."`,
          `"${money(offerAmount)} for this? Blocked. (Not really. But wow.)"`,
          `"Is this a joke? ${money(offerAmount)}?"`,
        ]);
      } else {
        response = HAGGLE.say(persona, "reject", offerAmount);
      }
    }

    // Append to existing thread if countering, else start new
    const msg = { from: "seller", text: response };
    if (this.partDetailOffer && this.partDetailOffer.thread) {
      this.partDetailOffer.thread.push(
        { from: "you", text: money(offerAmount) },
        msg,
      );
      this.partDetailOffer.accepted = accepted;
      this.partDetailOffer.price = price;
      this.partDetailOffer.blocked = blocked;
      this.partDetailOffer.walkedAway = walkedAway;
    } else {
      this.partDetailOffer = {
        thread: [
          { from: "you", text: money(offerAmount) },
          msg,
        ],
        accepted, price, blocked, walkedAway,
      };
    }
    // Notification handled in replaceBoneyardPart
    // Seller declined/moved on — pull the listing and replace with a fresh part
    if ((blocked || walkedAway) && typeof this.replaceBoneyardPart === "function") {
      const idx = this.partDetailIdx;
      setTimeout(() => this.replaceBoneyardPart(idx), 1500);
    }
    this.renderPartHaggle();
  },

  // Replace a dead Boneyard listing with a fresh random part
  replaceBoneyardPart(idx) {
    if (!this.partsShop || idx < 0 || idx >= this.partsShop.length) return;
    // Clear the old negotiation chat
    this.partDetailOffer = null;
    // Block notification (always fires on replacement)
    try {
      const oldPart = this.partsShop[idx];
      const feed = JSON.parse(localStorage.getItem("soldasis_activity") || "[]");
      const byBlockMsgs = [
        `Blocked in the Boneyard. That ${oldPart.partLabel} for the ${oldPart.bikeBrand} ${oldPart.bikeModel} is dead to you now.`,
        `The ${oldPart.partLabel} seller blocked you. Bold strategy, lowballing in the Boneyard.`,
        `You got blocked over a ${oldPart.partLabel}. The ${oldPart.bikeBrand} ${oldPart.bikeModel} community will remember this.`,
      ];
      feed.unshift({ msg: byBlockMsgs[(Math.random() * byBlockMsgs.length) | 0], at: Date.now(), cat: "boneyard" });
      if (feed.length > 50) feed.length = 50;
      localStorage.setItem("soldasis_activity", JSON.stringify(feed));
      if (typeof UI !== "undefined") {
        UI._unreadActivity = (UI._unreadActivity || 0) + 1;
        UI._unreadBoneyard = (UI._unreadBoneyard || 0) + 1;
        if (UI.updateBellBadge) UI.updateBellBadge();
      }
    } catch (e) {}
    const bike = gatedPick(BIKES, UNIQUE_KEEP.parts);
    const avail = availableParts(bike.sprite);
    const part = avail[(Math.random() * avail.length) | 0];
    const roll = Math.random();
    const state = roll < 0.08 ? "pristine"
      : roll < 0.40 ? "used_good"
      : roll < 0.75 ? "used_bad"
      : "totaled";
    const price = Math.max(5, Math.round(PART_BASE_PRICE[part.key] * PART_COND_MULT[state] * (0.85 + Math.random() * 0.3)));
    this.partsShop[idx] = {
      id: Date.now(), bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
      partKey: part.key, partLabel: part.label, state,
      stateLabel: PART_STATE_LABEL[state],
      price, wasPrice: null, watchers: 1 + ((Math.random() * 14) | 0),
      img: partImg(bike.sprite, part.key, state),
      listingType: "bin",
    };
    this.partDetailOffer = null;
    this.closePartDetail();
    if (this.current === "parts") this.renderParts();
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
    this.partsShop.splice(i, 1);
    UI.refreshCash();
    Save.save();
    this.renderParts();
  },

  // ---------- Crate Fresh (NOS dealer) ----------
  // Finite factory-sealed stock, fixed prices. Restock shares the Boneyard
  // refresh economy (3 free, then a 30s cooldown) so neither store can be farmed.
  refreshCrate() {
    const now = Date.now();
    if (now < this.crateCooldownUntil) return;
    if (this.crateRefreshesLeft <= 0) {
      this.crateCooldownUntil = now + 30 * 1000;
      try {
        localStorage.setItem(this.CRATE_COOLDOWN_KEY, String(this.crateCooldownUntil));
        localStorage.setItem(this.CRATE_REFRESHES_KEY, "0");
      } catch (e) {}
      this.updateRefreshBtn();
      return;
    }
    this.crateRefreshesLeft--;
    try { localStorage.setItem(this.CRATE_REFRESHES_KEY, String(this.crateRefreshesLeft)); } catch (e) {}
    this.crateStock = genCrateStock(12);
    // Guarantee: the picked model — or, unpicked, the neediest project
    // in the garage — has its most-needed part on the shelf. Uniques
    // are exempt: their parts never get conjured.
    const needMap = garageNeedMap();
    let target = null;
    if (this.validPick(this.cratePick) && !isUnique(this.cratePick)) target = this.cratePick;
    else {
      let best = 0;
      for (const sp of Object.keys(needMap)) {
        if (needMap[sp].score > best) { best = needMap[sp].score; target = sp; }
      }
    }
    if (target) this.ensureCrateGuarantee(target, needMap);
    Save.save();
    this.renderCrate();
    if (this.crateRefreshesLeft <= 0) {
      this.crateCooldownUntil = Date.now() + 30 * 1000;
      try {
        localStorage.setItem(this.CRATE_COOLDOWN_KEY, String(this.crateCooldownUntil));
        localStorage.setItem(this.CRATE_REFRESHES_KEY, "0");
      } catch (e) {}
    }
    this.updateRefreshBtn();
  },

  ensureCrateGuarantee(sprite, needMap) {
    const bike = BIKES.find(b => b.sprite === sprite);
    if (!bike || !this.crateStock) return;
    const wantKey = (needMap[sprite] && needMap[sprite].worstType) || null;
    const idx = this.crateStock.findIndex(p => p.bikeSprite === sprite);
    if (idx >= 0) {
      // Already shelved: bend its part type to the slot that's needed
      if (wantKey && this.crateStock[idx].partKey !== wantKey) {
        const def = availableParts(sprite).find(a => a.key === wantKey);
        if (def) this.crateStock[idx] = {
          ...this.crateStock[idx], partKey: def.key, partLabel: def.label,
          price: cratePriceFor(def.key), img: partImg(sprite, def.key, "pristine"),
        };
      }
      return;
    }
    const avail = availableParts(sprite);
    const def = (wantKey && avail.find(a => a.key === wantKey)) || avail[(Math.random() * avail.length) | 0];
    this.crateStock[0] = {
      id: 999, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
      partKey: def.key, partLabel: def.label, state: "nos", stateLabel: PART_STATE_LABEL.nos,
      price: cratePriceFor(def.key), wasPrice: null, watchers: 0,
      img: partImg(sprite, def.key, "pristine"), listingType: "bin", seller: "Crate Fresh",
    };
  },

  crateRowHTML(p, idx) {
    return `
      <div class="eby-item" data-crate-detail="${idx}">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy"><div class="nos-badge">${Icon.get('star')} NOS</div></div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond nos">NOS · Factory-sealed · 100%</div>
          <div class="eby-price-row"><span class="eby-price">${money(p.price)}</span></div>
          <div class="eby-meta">Fixed dealer price · Free delivery</div>
          <div class="eby-meta">Only 1 in stock</div>
          <button class="eby-buy crate-buy" data-buy-crate="${idx}">Buy It Now</button>
        </div>
      </div>`;
  },

  renderCrate() {
    if (this.cratePick && !this.validPick(this.cratePick)) this.cratePick = "";
    if (!this.crateStock) {
      this.crateStock = genCrateStock(12);
      Save.save();
    }
    const el = document.getElementById("crate-view");
    const bike = this.cratePick ? BIKES.find(b => b.sprite === this.cratePick) : null;
    const q = this.crateSearch.trim().toLowerCase();
    const matchesQ = (label, brand, model) => !q || `${label} ${brand} ${model}`.toLowerCase().includes(q);
    let rows = "";
    if (bike) {
      // Catalog mode (the shared "find parts that fit" filter): every part type for
      // the chosen bike — in stock and buyable, or honestly out of stock
      rows = availableParts(bike.sprite).map(def => {
        const idx = this.crateStock.findIndex(p => p.bikeSprite === bike.sprite && p.partKey === def.key);
        if (idx >= 0) {
          const p = this.crateStock[idx];
          return matchesQ(p.partLabel, p.bikeBrand, p.bikeModel) ? this.crateRowHTML(p, idx) : "";
        }
        if (!matchesQ(def.label, bike.brand, bike.name)) return "";
        return `
      <div class="eby-item oos">
        <div class="eby-thumb"><img src="${partImg(bike.sprite, def.key, "pristine")}" alt="${def.label}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${def.label} for ${bike.brand} ${bike.name}</div>
          <div class="eby-cond nos">NOS · Factory-sealed · 100%</div>
          <div class="eby-price-row"><span class="eby-price">${money(cratePriceFor(def.key))}</span></div>
          <div class="eby-meta">Fixed dealer price</div>
          <div class="eby-oos-btn">Out of stock — restocks on refresh</div>
        </div>
      </div>`;
      }).join("");
    } else {
      const shown = this.crateStock
        .map((p, i) => ({ ...p, idx: i }))
        .filter(p => matchesQ(p.partLabel, p.bikeBrand, p.bikeModel));
      rows = shown.length
        ? shown.map(p => this.crateRowHTML(p, p.idx)).join("")
        : `<div class="empty"><strong>Sold out</strong>Every crate's empty. Refresh to restock.</div>`;
    }
    el.innerHTML = `
      <div class="eby-head">
        <div class="eby-title">${Icon.get('crate')} NOS Parts Co.</div>
      </div>
      <div class="crate-promise"><strong>Still in the factory plastic.</strong> This is new old stock — parts that sat on a dealer's shelf since the eighties and never got sold. Never mounted, never run. The tag price is the price: no offers, no auctions, no games. When a shelf empties, it stays empty.</div>
      <div class="eby-list">${rows || `<div class="empty"><strong>Nothing on the shelf</strong>Try a different bike, or refresh for a restock.</div>`}</div>`;
    // Buy buttons + row tap → detail (same tap-guard pattern as the Boneyard)
    el.querySelectorAll("[data-buy-crate]").forEach(btn => {
      const buy = (e) => { e.preventDefault(); e.stopPropagation(); this.buyCratePart(+btn.dataset.buyCrate); };
      btn.addEventListener("click", buy);
      let ty = 0, tx = 0;
      btn.addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
      btn.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) buy(e);
      }, { passive: false });
    });
    el.querySelectorAll("[data-crate-detail]").forEach(item => {
      const open = (e) => {
        if (e.target.closest("button")) return;
        e.preventDefault();
        this.openCrateDetail(+item.dataset.crateDetail);
      };
      item.addEventListener("click", open);
      let ty = 0, tx = 0;
      item.addEventListener("touchstart", (e) => { ty = e.touches[0].clientY; tx = e.touches[0].clientX; }, { passive: true });
      item.addEventListener("touchend", (e) => {
        const dy = Math.abs(e.changedTouches[0].clientY - ty);
        const dx = Math.abs(e.changedTouches[0].clientX - tx);
        if (dy < 10 && dx < 10) open(e);
      }, { passive: false });
    });
  },

  openCrateDetail(idx) {
    const p = (this.crateStock || [])[idx];
    if (!p) return;
    this.partDetailSource = "crate";
    this.crateDetailIdx = idx;
    this.renderCrateDetail();
    document.getElementById("part-detail").classList.remove("hidden");
  },

  renderCrateDetail() {
    const p = (this.crateStock || [])[this.crateDetailIdx];
    if (!p) return;
    const el = document.getElementById("part-detail");
    el.innerHTML = `
      <div class="pd-modal">
        <div class="pd-head">
          <button class="haggle-close" id="pd-close">${Icon.get('close')}</button>
        </div>
        <div class="pd-photo"><img src="${p.img}" alt="${p.partLabel}"><div class="nos-badge">${Icon.get('star')} NOS</div></div>
        <div class="pd-body">
          <div class="pd-title">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="pd-price-row">
            <span class="pd-price">${money(p.price)}</span>
            <span class="pd-bo">fixed dealer price</span>
          </div>
          <div class="pd-ship">Free shipping</div>
          <div class="pd-ship">Free delivery</div>
          <div class="pd-cond-row">Condition <strong>NOS — factory-sealed</strong></div>
          <div class="pd-actions">
            <button class="pd-btn-primary" id="pd-crate-buy">Buy It Now</button>
            <div class="pd-hint">No offers. No auctions. The price is the price.</div>
          </div>
          <div class="pd-about">
            <div class="pd-about-head">About this item</div>
            <div class="pd-spec"><span>Condition</span><span>NOS (100%)</span></div>
            <div class="pd-spec"><span>Fits</span><span>${p.bikeBrand} ${p.bikeModel}</span></div>
            <div class="pd-spec"><span>Part</span><span>${p.partLabel}</span></div>
          </div>
        </div>
      </div>`;
    document.getElementById("pd-close").addEventListener("click", () => this.closePartDetail());
    document.getElementById("pd-crate-buy").addEventListener("click", () => {
      const idx = this.crateDetailIdx; // read BEFORE closing (close resets it)
      this.closePartDetail();
      this.buyCratePart(idx);
    });
  },

  buyCratePart(i) {
    const p = (this.crateStock || [])[i];
    if (!p) return;
    // Browser Extension discount applies at checkout, same as Boneyard purchases
    const discount = (typeof Skills !== "undefined") ? Skills.partsDiscount() : 0;
    const price = Math.round(p.price * (1 - discount));
    if (State.cash < price) return;
    State.cash -= price;
    State.parts = State.parts || [];
    p.paidPrice = price; // track what we paid (after discount)
    p.conditionPct = 100;
    State.parts.push(p);
    this.crateStock.splice(i, 1);
    UI.refreshCash();
    Save.save();
    this.renderCrate();
  },

  // NOS challenge tracking: installed NOS parts and complete NOS builds
  refreshNosStats() {
    let parts = 0, builds = 0, keptBuilds = 0;
    const owned = [...(State.garage || []), ...(State.rollers || [])];
    for (const b of owned) {
      const avail = availableParts(b.sprite);
      if (!avail.length) continue;
      let n = 0, all = true;
      for (const def of avail) {
        if ((b.partStates || {})[def.key] === "nos") n++;
        else all = false;
      }
      parts += n;
      if (all) { builds++; if (b.kept) keptBuilds++; }
    }
    State.stats.nosParts = parts;
    State.stats.nosBuilds = builds;
    State.stats.nosKeptBuilds = keptBuilds;
    // Brand sets: a set is complete when every model of the brand is kept.
    // (Same brand+model matching the Collection wall renders.)
    let sets = 0;
    const keptBikes = (State.garage || []).filter(b => b.kept);
    for (const [brand, brandDef] of Object.entries(BRANDS)) {
      const models = brandDef.models.filter(m => !isUnique(m.sprite));
      if (!models.length) continue;
      const have = new Set(keptBikes.filter(b => b.brand === brand).map(b => b.model));
      if (models.every(m => have.has(m.name))) sets++;
    }
    State.stats.brandSetsCompleted = sets;
    // Uniques kept (framework: stays 0 until the Unique models drop in)
    State.stats.uniquesCollected = keptBikes.filter(b => isUnique(b.sprite)).length;
  },

  // ============ GARAGE ============
  garageTab: "bikes", // "bikes" | "collection" | "parts" | "skills"
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
      nos: [
        "Factory-sealed NOS. Bought to flip, priced like it.",
        "Still in the wrap. Unicorn stuff — don't think, just buy.",
        "New old stock. Someone's rainy-day part, cashed in.",
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

  // Collection-worthy? Mint condition, or wearing only pristine/NOS parts.
  // Returns { ok, reason }. "Fitted" = partStates entries that aren't missing.
  collectionWorthy(bike) {
    const nope = "Needs Mint condition or pristine/NOS parts";
    if (!bike) return { ok: false, reason: nope };
    if (bike.condition === "Mint") return { ok: true, reason: "" };
    const states = bike.partStates || {};
    const missing = new Set(bike.missingParts || []);
    const fitted = Object.entries(states).filter(([k, s]) => s && s !== "missing" && !missing.has(k));
    if (!fitted.length) return { ok: false, reason: nope };
    const bad = fitted.find(([k, s]) => s !== "pristine" && s !== "nos");
    if (bad) return { ok: false, reason: nope };
    return { ok: true, reason: "" };
  },

  renderGarage() {
    // Strip mode belongs to one bike's page only — never carries over
    if (this.stripMode && this._stripFor !== this.garageDetailIdx) {
      this.stripMode = false;
      this._stripFor = null;
    }
    const el = document.getElementById("garage-view");
    const bikesCount = (State.garage || []).filter(b => !b.kept).length;
    const keptCount = (State.garage || []).filter(b => b.kept).length;
    const tabs = `
      <div class="g-tabs">
        <button class="g-tab${this.garageTab === "bikes" ? " active" : ""}" data-gtab="bikes">${Icon.get('moped')} Bikes${bikesCount ? ` (${bikesCount})` : ""}</button>
        <button class="g-tab${this.garageTab === "collection" ? " active" : ""}" data-gtab="collection">${Icon.get('star')} Collection${keptCount ? ` (${keptCount})` : ""}</button>
        <button class="g-tab${this.garageTab === "parts" ? " active" : ""}" data-gtab="parts">${Icon.get('gear')} Parts${State.parts && State.parts.length ? ` (${State.parts.length})` : ""}</button>

        <button class="g-tab${this.garageTab === "skills" ? " active" : ""}" data-gtab="skills">${Icon.get('trophy')} Skills${Skills.unspentPoints() ? ` (${Skills.unspentPoints()})` : ""}</button>
      </div>`;
    if (this.garageTab === "parts") {
      el.innerHTML = tabs + this.partsInventoryHTML();

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
    const isCollection = this.garageTab === "collection";
    const tabBikes = [...State.garage.map((b, i) => ({ b, i }))]
      .filter(({ b }) => isCollection ? b.kept : !b.kept);
    if (!tabBikes.length) {
      if (isCollection) {
        return `<div class="pane-head"><h2>Your Collection</h2>
          <div class="sub">Kept bikes live here — safe from the market.</div></div>
          <div class="empty"><strong>No keepers yet</strong>Restore a bike to Mint (or fit pristine/NOS parts), then hit "Add to Collection".</div>`;
      }
      return `<div class="pane-head"><h2>Pending Listings</h2>
        <div class="sub">Bikes you own, waiting to be listed.</div></div>
        <div class="empty"><strong>Empty garage</strong>Hit the market and buy your first flip.</div>`;
    }
    const sortMode = this.garageSort || "recent";
    const sorted = tabBikes
      .filter(({ b }) => !this.garageBikeFilter || b.sprite === this.garageBikeFilter)
      .sort((x, y) => {
      if (sortMode === "value") return (y.b.fairValue || 0) - (x.b.fairValue || 0);
      if (sortMode === "profit") return ((y.b.fairValue || 0) - (y.b.boughtFor || 0)) - ((x.b.fairValue || 0) - (x.b.boughtFor || 0));
      if (sortMode === "brand") return (x.b.brand || "").localeCompare(y.b.brand || "");
      return y.i - x.i; // recent (default)
    });
    return `<div class="pane-head"><h2>${isCollection ? "Your Collection" : "Pending Listings"}</h2>
      <div class="sub">${isCollection ? `${sorted.length} bike(s) · safe from the market` : `${sorted.length} bike(s) · tap to manage`}</div>
      <select id="garage-sort" class="garage-sort">
        <option value="recent"${sortMode === "recent" ? " selected" : ""}>Recently added</option>
        <option value="value"${sortMode === "value" ? " selected" : ""}>Highest value</option>
        <option value="profit"${sortMode === "profit" ? " selected" : ""}>Best profit</option>
        <option value="brand"${sortMode === "brand" ? " selected" : ""}>Brand A-Z</option>
      </select></div>
      <div class="feed-grid">` +
      sorted.map(({ b, i }) => {
        const profit = (b.fairValue || b.boughtFor || 0) - (b.boughtFor || 0);
        const profitCls = profit > 0 ? "profit-up" : profit < 0 ? "profit-down" : "profit-flat";
        const profitTxt = profit > 0 ? `+${money(profit)}` : profit < 0 ? `-${money(-profit)}` : "—";
        return `
      <article class="card" data-gbike="${i}">
        <div class="photo">
          ${b.listed ? '<div class="just-listed">Listed</div>' : ""}
          <img src="assets/bikes/${b.sprite}.png" alt="${b.brand} ${b.model}" loading="lazy" draggable="false"${Feed.spriteNudge.has(b.sprite) ? ' class="nudged"' : ""}>
          <div class="card-cond">${b.condition}</div>
        </div>
        <div class="card-info">
          <div class="card-price-name"><strong>${money(b.boughtFor)}</strong> &middot; ${b.brand} ${b.model}</div>
          <div class="card-loc">${b.kept ? Icon.get('star') + " In collection" : "Pending"} <span class="${profitCls}">${profitTxt}</span></div>
        </div>
      </article>`; }).join("") + `</div>`;
  },

  garageDetailHTML() {
    const b = State.garage[this.garageDetailIdx];
    if (!b) return `<div class="empty">Bike not found.</div>`;
    // Part picker HTML (appended at end if active)
    let pickerOverlay = "";
    if (this._installPicker && this._installPicker.bikeIdx === this.garageDetailIdx) {
      const { partKey } = this._installPicker;
      const matches = (State.parts || [])
        .map((sp, i) => ({ ...sp, invIdx: i }))
        .filter(sp => sp.bikeSprite === b.sprite && sp.partKey === partKey)
        .sort((a, b2) => (b2.conditionPct || 0) - (a.conditionPct || 0));
      const pDef = availableParts(b.sprite).find(p => p.key === partKey);
      pickerOverlay = `<div class="picker-overlay"><div class="roller-picker">
        <div class="roller-picker-head">
          <strong>Pick a ${pDef ? pDef.label : partKey}</strong>
          <button class="back-btn" id="install-picker-close">✕</button>
        </div>`;
      if (!matches.length) {
        pickerOverlay += `<div class="empty" style="padding:16px">None in inventory</div>`;
      } else {
        pickerOverlay += `<div class="roller-picker-list">` + matches.map(m => `
          <div class="roller-pick-row" data-install-pick="${m.invIdx}">
            <img src="${m.img}" alt="${m.partLabel}" loading="lazy">
            <div class="roller-pick-info">
              <div class="roller-pick-name">${m.partLabel}</div>
              <div class="roller-pick-cond state-${m.state}">${m.state === "nos" ? `<span class="nos-tag">${Icon.get('star')} NOS · 100%</span>` : `${m.stateLabel} · ${m.conditionPct || "?"}%`}</div>
            </div>
            <button class="eby-buy roller-pick-btn">Install</button>
          </div>`).join("") + `</div>`;
      }
      pickerOverlay += `</div></div>`;
    }
    const presets = this.descPresets(b.condition);
    const tier = (typeof Skills !== "undefined") ? Skills.unlocked["smoothtalker"] || 0 : 0;
    if (!b.desc) b.desc = presets[0].t;
    // Kept bikes (Collection tab): exactly one action. Otherwise: list/strip + gated keep.
    const gate = b.kept ? null : this.collectionWorthy(b);
    const keepBtn = b.kept ? "" : (gate.ok
      ? `<button class="btn-keep" data-gact="keep-add">${Icon.get('trophy')} Add to Collection</button>`
      : `<button class="btn-keep" data-gact="keep-add" disabled title="${gate.reason}">${Icon.get('trophy')} Add to Collection</button>
        <div class="sub keep-gate-note">${gate.reason}</div>`);
    return `
      <button class="back-btn" id="g-back">← Back</button>
      <div class="g-detail">
        <div class="bike-hero">
          <div class="g-detail-photo">
            <img src="assets/bikes/${b.sprite}.png" alt="${b.brand} ${b.model}">
          </div>
          <div class="bike-hero-body">
            <div>
              <div class="bike-hero-name">${b.brand} ${b.model}</div>
              <div class="bike-hero-sub">Bought for ${money(b.boughtFor)} · fair value ~${money(b.fairValue)}</div>
            </div>
            <span class="cond-tag">${b.condition}</span>
          </div>
        </div>
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
          <div class="sub" style="margin-bottom:8px">${this.stripMode ? "Strip mode — tap a part to pull it off this bike. Missing parts can't be stripped." : "Tap a part to reveal its condition."}</div>
          <div class="parts-grid" id="inspect-grid">
            ${availableParts(b.sprite).map(p => {
              const st = (b.partStates && b.partStates[p.key]) || "pristine";
              const isMissing = st === "missing" || (b.missingParts || []).includes(p.key);
              if (isMissing) {
                const owned = (State.parts || []).filter(sp => sp.bikeSprite === b.sprite && sp.partKey === p.key).length;
                return `<div class="part-cell" data-inspect-part="${p.key}">
                  <div class="part-missing-x">${Icon.get('missing')}</div>
                  <div class="part-label">${p.label}</div>
                  <div class="part-state" style="color:#999">Missing</div>
                  ${owned && !b.kept ? `<button class="eby-buy" data-install-garage-part="${p.key}" style="margin-top:6px">Install (${owned})</button>` : ""}
                </div>`;
              }
              const revealed = (b.revealedParts || []).includes(p.key);
              const label = revealed
                ? (st === "nos" ? `<span class="nos-tag">${Icon.get('star')} NOS</span>` : PART_STATE_LABEL[st])
                : `<span class="cond-hidden">???</span>`;
              return `<div class="part-cell state-${revealed ? st : "hidden"}${this.stripMode ? " strip-mode" : ""}" data-inspect-part="${p.key}">
                <img src="${partImg(b.sprite, p.key, revealed ? st : "pristine")}" alt="${p.label}" loading="lazy">
                <div class="part-label">${p.label}</div>
                <div class="part-state">${label}</div>
              </div>`;
            }).join("")}
          </div>
        </div>
        <div class="g-detail-actions">
          ${b.kept
            ? `<button class="btn-keep" data-gact="keep-remove">${Icon.get('star')} Remove from Collection</button>`
            : `<button class="btn-list" data-gact="list">${Icon.get('clipboard')} List on Marketplace</button>
          <button class="btn-strip" id="strip-toggle-btn" style="margin-top:8px">${Icon.get('wrench')} ${this.stripMode ? "Done Stripping" : "Strip Parts"}</button>
          ${keepBtn}`}
        </div>

        ${b.listed ? `<div class="notice">Live on the marketplace — buyers can see it.</div>` : ""}
      </div>${pickerOverlay}`;
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
        this.showSkillConfirm(def, tier, cost, skillId);
      });
    });
  },

  showSkillConfirm(def, tier, cost, skillId) {
    // Custom in-game confirmation modal (no system dialog)
    const existing = document.getElementById("skill-confirm");
    if (existing) existing.remove();
    const html = `
    <div class="modal-overlay" id="skill-confirm">
      <div class="modal-box">
        <div class="modal-title">Unlock ${def.name}?</div>
        <div class="modal-body">
          <div class="modal-tier">Tier ${tier} — ${cost} skill point${cost > 1 ? "s" : ""}</div>
          <div class="modal-desc">${def.tiers[tier - 1]}</div>
        </div>
        <div class="modal-actions">
          <button class="modal-btn cancel" id="skill-cancel">Not Yet</button>
          <button class="modal-btn go" id="skill-go">Unlock</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("skill-cancel").addEventListener("click", () => {
      document.getElementById("skill-confirm").remove();
    });
    document.getElementById("skill-confirm").addEventListener("click", (e) => {
      if (e.target.id === "skill-confirm") document.getElementById("skill-confirm").remove();
    });
    document.getElementById("skill-go").addEventListener("click", () => {
      document.getElementById("skill-confirm").remove();
      if (Skills.unlockTier(skillId)) this.renderGarage();
    });
  },

  partsInventoryHTML() {
    const parts = State.parts || [];    if (!parts.length) {
      return `<div class="pane-head"><h2>Parts Inventory</h2>
        <div class="sub">Stripped parts and Boneyard purchases live here.</div></div>
        <div class="empty"><strong>No parts yet</strong>Part out a bike or buy from the Boneyard.</div>`;
    }
    return `<div class="pane-head"><h2>Parts Inventory</h2>
      <div class="sub">${parts.length} part(s) in storage · tap ${Icon.get('wrench')} to repair</div>
</div>
      <div class="eby-list" id="parts-list">` +
      parts.map((p, i) => ({ p, i }))
      .filter(({ p }) => !this.garageBikeFilter || p.bikeSprite === this.garageBikeFilter)
      .map(({ p, i }) => {
        const pct = ensurePct(p);
        const state = p.state === "nos" ? "nos" : pctToState(pct);
        const img = partImg(p.bikeSprite, p.partKey, state);
        const canRepair = state !== "nos" && pct >= 25 && pct < 70;
        const tooFarGone = pct < 25;
        const cost = repairCost(p);
        // Color the bar by condition
        const barColor = pct >= 70 ? "#4caf50" : pct >= 40 ? "#ff9800" : "#f44336";
        return `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${img}" alt="${p.partLabel}" loading="lazy" data-part-img="${i}">${state === "nos" ? `<div class="nos-badge">${Icon.get('star')} NOS</div>` : ""}</div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} — ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond${state === "nos" ? " nos" : ""}">${PART_STATE_LABEL[state]} · ${pct}%</div>
          <div class="cond-bar"><div class="cond-fill" style="width:${pct}%;background:${barColor}"></div></div>
          ${(() => {
            const attempts = p.repairAttempts || 0;
            const left = 3 - attempts;
            if (tooFarGone) return `<div class="eby-meta" style="color:#f44336">Too far gone to repair</div>`;
            if (left <= 0) return `<div class="eby-meta" style="color:#999">No repairs left</div>`;
            if (!canRepair) return `<div class="eby-meta" style="color:#4caf50">Max condition reached</div>`;
            const risk = [10, 18, 30][Math.min(attempts, 2)];
            return `<button class="eby-repair" data-repair="${i}">${Icon.get('wrench')} Repair — ${money(cost)} (${left} left, ${risk}% risk)</button>`;
          })()}
          <button class="eby-sell" data-sell-part="${i}">${Icon.get('cash')} Sell This Part</button>
        </div>
      </div>`;
      }).join("") + `</div>`;
  },

  showRepairConfirm(i) {
    const parts = State.parts || [];
    const p = parts[i];
    if (!p) return;
    const cost = repairCost(p);
    // Remove existing
    document.getElementById("repair-confirm")?.remove();
    const div = document.createElement("div");
    div.id = "repair-confirm";
    div.className = "repair-confirm-overlay";
    div.innerHTML = `
      <div class="repair-confirm-box">
        <div class="repair-confirm-title">Risky Repair</div>
        <div class="repair-confirm-text">This is your last attempt at <strong>${p.partLabel || p.partKey}</strong>.<br><br>There's a <strong style="color:#f44336">30% chance</strong> this goes wrong and the part gets worse.<br><br>Cost: ${money(cost)}</div>
        <div class="repair-confirm-btns">
          <button class="repair-confirm-cancel" id="repair-cancel">Never Mind</button>
          <button class="repair-confirm-go" id="repair-go">Risk It</button>
        </div>
      </div>`;
    document.body.appendChild(div);
    document.getElementById("repair-cancel").addEventListener("click", () => div.remove());
    document.getElementById("repair-go").addEventListener("click", () => {
      div.remove();
      this.repairPart(i);
    });
    div.addEventListener("click", (e) => { if (e.target === div) div.remove(); });
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

    // Escalating risk: 10% → 18% → 30% fail chance per attempt
    const failChance = [0.10, 0.18, 0.30][Math.min(attempts, 2)];
    let newPct, improved, worsened = false;
    if (Math.random() < failChance) {
      const damage = 10 + ((Math.random() * 15) | 0); // -10 to -25
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
              <div class="roller-pick-cond state-${m.state}">${m.state === "nos" ? `<span class="nos-tag">${Icon.get('star')} NOS · 100%</span>` : `${m.stateLabel} · ${m.conditionPct || "?"}%`}</div>
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
            <div class="part-state">${st === "nos" ? `<span class="nos-tag">${Icon.get('star')} NOS</span>` : (PART_STATE_LABEL[st] || st)}</div>
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

  installPartOnGarageBike(bikeIdx, partKey, invIdx) {
    const b = (State.garage || [])[bikeIdx];
    if (!b) return;
    const parts = State.parts || [];
    // If invIdx provided, use that specific part; otherwise show picker
    if (invIdx === undefined || invIdx === null) {
      this._installPicker = { bikeIdx, partKey };
      this.renderGarage();
      return;
    }
    const part = parts[invIdx];
    if (!part || part.partKey !== partKey || part.bikeSprite !== b.sprite) return;
    parts.splice(invIdx, 1);
    b.partStates = b.partStates || {};
    b.partStates[partKey] = part.state || "used_good";
    b.missingParts = (b.missingParts || []).filter(k => k !== partKey);
    b.revealedParts = b.revealedParts || [];
    if (!b.revealedParts.includes(partKey)) b.revealedParts.push(partKey);
    if (typeof calcBikeCondition !== "undefined") b.condition = calcBikeCondition(b.partStates, b.sprite);
    if (typeof recalcFairValue !== "undefined") recalcFairValue(b);
    this.refreshNosStats();
    if (typeof Milestones !== "undefined") Milestones.check(State.stats);
    Save.save();
    this.renderGarage();
  },
  installPartOnRoller(rollerIdx, invIdx) {
    const r = (State.rollers || [])[rollerIdx];
    const parts = State.parts || [];
    let part = parts[invIdx];
    let actualIdx = invIdx;
    // Fallback: if index is stale, find by matching partKey + sprite
    if (!part && this._lastPickPart) {
      actualIdx = parts.findIndex(p => p.partKey === this._lastPickPart.partKey && p.bikeSprite === this._lastPickPart.bikeSprite);
      part = parts[actualIdx];
    }
    if (!r || !part || actualIdx < 0) return;
    // Recalculate condition after install (at end of function)
    const _recalc = () => {
      if (typeof calcBikeCondition !== "undefined") {
        r.condition = calcBikeCondition(r.partStates, r.sprite);
      }
      if (typeof recalcFairValue !== "undefined") recalcFairValue(r);
    };
    // Picker already filtered to matching parts — just verify the slot is missing
    if (!(r.missingParts || []).includes(part.partKey)) {
      return;
    }
    parts.splice(actualIdx, 1);
    // Install: set condition, remove from missing
    const partKey = part.partKey;
    r.partStates = r.partStates || {};
    r.partStates[partKey] = part.state || "used_good";
    r.missingParts = r.missingParts.filter(k => k !== partKey);
    // You installed it yourself — no need to reveal, you know the condition
    r.revealedParts = r.revealedParts || [];
    if (!r.revealedParts.includes(partKey)) r.revealedParts.push(partKey);
    this.rollerPickSlot = null;
    // Track install cost for XP basis
    r.installedCost = (r.installedCost || 0) + (part.paidPrice || 0);
    Save.save();
    this.refreshNosStats();
    if (typeof Milestones !== "undefined") Milestones.check(State.stats);
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
    // Recalculate true condition from parts (not just Rough/Good)
    if (typeof calcBikeCondition !== "undefined") {
      r.condition = calcBikeCondition(r.partStates, r.sprite);
    } else {
      r.condition = missing > 0 ? "Rough" : "Good";
    }
    if (typeof recalcFairValue !== "undefined") recalcFairValue(r);
    // (don't use rollerValue here — that's for Assemble display only)
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
    // Garage sort
    const sortSel = el.querySelector("#garage-sort");
    if (sortSel) {
      if (typeof GameDropdown !== "undefined") GameDropdown.enhance(sortSel, null);
      sortSel.addEventListener("change", (e) => {
        this.garageSort = e.target.value;
        this.renderGarage();
      });
    }
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
    // Garage: install part on bike (opens picker)
    el.querySelectorAll("[data-install-garage-part]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bikeIdx = this.garageDetailIdx;
        if (bikeIdx >= 0) this.installPartOnGarageBike(bikeIdx, btn.dataset.installGaragePart);
      });
    });
    // Install picker: close
    const instPickerClose = el.querySelector("#install-picker-close");
    if (instPickerClose) instPickerClose.addEventListener("click", () => {
      this._installPicker = null;
      this.renderGarage();
    });
    // Install picker: pick a part
    el.querySelectorAll("[data-install-pick]").forEach(row => {
      const btn = row.querySelector(".roller-pick-btn");
      const doPick = (e) => {
        e.stopPropagation();
        const { bikeIdx, partKey } = this._installPicker || {};
        this._installPicker = null;
        if (bikeIdx !== undefined) this.installPartOnGarageBike(bikeIdx, partKey, +row.dataset.installPick);
      };
      if (btn) btn.addEventListener("click", doPick);
      row.addEventListener("click", doPick);
    });
    // Roller detail: pick a specific part to install
    el.querySelectorAll("[data-pick-part]").forEach(row => {
      const btn = row.querySelector(".roller-pick-btn");
      const doInstall = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const pIdx = +row.dataset.pickPart;
        const p = (State.parts || [])[pIdx];
        if (p) this._lastPickPart = { partKey: p.partKey, bikeSprite: p.bikeSprite };
        this.installPartOnRoller(+row.dataset.roller, pIdx);
      };
      if (btn) btn.addEventListener("click", doInstall);
      row.addEventListener("click", doInstall);
    });
    // Roller detail: move to garage
    const toGarage = el.querySelector("#roller-to-garage");
    if (toGarage && !toGarage.disabled) toGarage.addEventListener("click", () => {
      this.rollerToGarage(this.rollerDetailIdx);
    });
    // Strip mode toggle (button)
    const stripToggleBtn = el.querySelector("#strip-toggle-btn");
    if (stripToggleBtn) stripToggleBtn.addEventListener("click", () => {
      this.stripMode = !this.stripMode;
      this._stripFor = this.stripMode ? this.garageDetailIdx : null;
      stripToggleBtn.innerHTML = this.stripMode ? `${Icon.get('wrench')} Done Stripping` : `${Icon.get('wrench')} Strip Parts`;
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
      const rep = (e) => {
        e.preventDefault(); e.stopPropagation();
        const idx = +b.dataset.repair;
        const parts = State.parts || [];
        const part = parts[idx];
        const attempts = (part && part.repairAttempts) || 0;
        // 3rd attempt (30% risk): custom confirm
        if (attempts >= 2) {
          this.showRepairConfirm(idx);
        } else {
          this.repairPart(idx);
        }
      };
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
        const state = p.state === "nos" ? "nos" : pctToState(pct);
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
          <input type="text" inputmode="none" id="bike-list-price" value="${suggest}" min="1">
          <button class="eby-confirm" id="bike-list-confirm">List</button>
          <button class="eby-cancel" id="bike-list-cancel">${Icon.get('close')}</button>
        </div>`;
        const input = document.getElementById("bike-list-price");
        const bikeFair = bike.fairValue || 0;
        const bikePaid = (bike.boughtFor || 0) + (bike.repairSpent || 0);
        if (input && typeof GameKB !== "undefined") GameKB.attach(input, null, (typed) => {
          let html = '';
          if (bikeFair) html += `Fair value <span class="kb-ctx-price">~$${bikeFair.toLocaleString()}</span>`;
          if (bikePaid) html += `${html ? ' · ' : ''}You paid <span class="kb-ctx-price">$${bikePaid.toLocaleString()}</span>`;
          if (typed > 0 && bikePaid) {
            const diff = typed - bikePaid;
            if (diff > 0) html += `<br><span class="kb-ctx-under">+$${diff.toLocaleString()} profit if it sells</span>`;
            else if (diff < 0) html += `<br><span class="kb-ctx-over">-$${(-diff).toLocaleString()} loss if it sells</span>`;
          }
          return html;
        });
        const confirm = document.getElementById("bike-list-confirm");
        const cancel = document.getElementById("bike-list-cancel");
        if (confirm) confirm.addEventListener("click", () => {
          this.listBikeForSale(this.garageDetailIdx, input.dataset.raw || input.value);
        });
        if (cancel) cancel.addEventListener("click", () => this.renderGarage());
        if (input) input.focus();
      }
    } else if (act === "keep-add") {
      // Gated in the UI; belt-and-braces re-check here.
      if (bike.kept || !this.collectionWorthy(bike).ok) return;
      bike.kept = true;
      this.refreshNosStats();
      State.stats.collected++;
      if (typeof Milestones !== "undefined") Milestones.check(State.stats);
      Save.save();
      // The bike moves to the Collection tab.
      this.garageTab = "collection";
      this.garageDetailIdx = -1;
      this.renderGarage();
    } else if (act === "keep-remove") {
      if (!bike.kept) return;
      bike.kept = false;
      this.refreshNosStats();
      State.stats.collected = Math.max(0, State.stats.collected - 1);
      Save.save();
      // Back to Bikes, sellable again.
      this.garageTab = "bikes";
      this.garageDetailIdx = -1;
      this.renderGarage();
    } else if (act === "toassemble") {
      this.moveBikeToAssemble(this.garageDetailIdx);
    }
  },

  stripMode: false,

  stripPartFromBike(bike, partKey) {
    bike.missingParts = bike.missingParts || [];
    bike.partStates = bike.partStates || {};
    // A missing part is missing in either ledger — nothing exists to strip
    if (bike.missingParts.includes(partKey) || bike.partStates[partKey] === "missing") {
      // Heal the ledgers so they agree from here on
      if (!bike.missingParts.includes(partKey)) bike.missingParts.push(partKey);
      return;
    }
    // Capture the part's actual condition BEFORE marking as missing
    bike.partStates = bike.partStates || {};
    const state = (bike.partStates && bike.partStates[partKey] !== "missing" && bike.partStates[partKey]) || "pristine";
    // Mark as missing in partStates too
    bike.partStates[partKey] = "missing";
    const avail = availableParts(bike.sprite);
    const pDef = avail.find(p => p.key === partKey);
    if (!pDef) return;
    // Move to inventory
    State.parts = State.parts || [];
    State.parts.push({
      partKey, partLabel: pDef.label,
      bikeBrand: bike.brand, bikeModel: bike.model, bikeSprite: bike.sprite,
      state, stateLabel: PART_STATE_LABEL[state],
      conditionPct: { pristine: 95, used_good: 80, used_bad: 55, totaled: 20, nos: 100 }[state] || 50,
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
    if (typeof recalcFairValue !== "undefined") recalcFairValue(bike);
    this.refreshNosStats();
    Save.save();
    this.renderGarage();
  },

  moveBikeToAssemble(idx) {
    const bike = State.garage[idx];
    if (!bike) return;
    const stripped = (bike.missingParts || []).length;
    // Move as-is — already-stripped parts stay stripped, rest stay installed
    // (parts were stripped piece-by-piece in the bikes tab)
    State.rollers = State.rollers || [];
    bike.isRoller = true;
    State.rollers.push(bike);
    State.garage.splice(idx, 1);
    this.garageDetailIdx = -1;
    this.stripMode = false;
    Save.save();
    this.renderGarage();

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
      condition: "Good", bornCond: "Good", price: bikeData.base, boughtFor: 0,
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
      const own = models.filter(m => !isUnique(m.sprite));
      const owned = own.filter(m =>
        kept.some(k => k.brand === brand && k.model === m.name));
      return { brand, total: own.length, owned: owned.length };
    }).filter(s => s.total > 0);
    // Unique models share one label on the wall (framework: this row only
    // renders once Unique models exist in the roster)
    const uniqueModels = BIKES.filter(b => isUnique(b.sprite));
    if (uniqueModels.length) {
      const uOwned = uniqueModels.filter(m => kept.some(k => k.sprite === m.sprite));
      sets.push({ brand: "Unique", total: uniqueModels.length, owned: uOwned.length, cls: " unique-set", icon: Icon.get('trophy') + " " });
    }
    const collPct = Math.round((kept.length / BIKES.length) * 100);
    el.innerHTML = `<h2>Collection Wall</h2>
      <div class="coll-summary">
        <div class="coll-summary-top">
          <span class="coll-summary-count">${kept.length} / ${BIKES.length} collected</span>
          <span class="coll-summary-pct">${collPct}%</span>
        </div>
        <div class="coll-bar"><i style="width:${collPct}%"></i></div>
        <div class="coll-summary-sub">Complete brand sets for bounties</div>
      </div>` +
      (kept.length === 0
        ? `<div class="empty"><strong>No keepers yet</strong>Hit "Keep" on a bike in your garage to add it to the wall.</div>`
        : "") +
      sets.map(s => `
      <div class="set-row${s.cls || ""}">
        <div class="set-name">${s.icon || ""}${s.brand} — ${s.owned}/${s.total}</div>
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
        <div><strong>${d.name}</strong><div class="milestone-desc">${d.desc}${d.bounty ? ` · <strong>Bounty $${d.bounty.toLocaleString()}</strong>` : ""}</div></div>
      </div>`;
    }).join("");
    return `<h2 style="margin-top:24px">Milestones</h2>
      <div class="sub">${done.size} of ${Milestones.defs.length} completed</div>
      <div class="milestones">${items}</div>`;
  },

  // The Ledger — career stats: the grind, the glory, the shame
  renderLedger() {
    const el = document.getElementById("ledger-view");
    const st = State.stats;
    const num = n => (n || 0).toLocaleString();
    const cash = n => "$" + Math.round(n || 0).toLocaleString();
    // Best flip / biggest loss, computed live from flip history
    let bestFlip = null, worstFlip = null;
    (State.sold || []).forEach(s => {
      const basis = (s.boughtFor || s.paidPrice || 0) + (s.repairSpent || 0);
      const profit = (s.soldFor || 0) - basis;
      const name = `${s.brand || ""} ${s.model || ""}`.trim();
      if (!bestFlip || profit > bestFlip.profit) bestFlip = { profit, name };
      if (!worstFlip || profit < worstFlip.profit) worstFlip = { profit, name };
    });
    // Favorite seller: most bikes bought from one handle
    const sb = st.sellerBikes || {};
    let favSeller = null, favCount = 0;
    Object.entries(sb).forEach(([name, c]) => {
      if (c > favCount) { favCount = c; favSeller = name; }
    });
    const kept = State.garage.filter(b => b.kept);
    const row = (label, value, sub) => `
      <div class="ledger-row">
        <div class="ledger-label">${label}${sub ? `<div class="ledger-sub">${sub}</div>` : ""}</div>
        <div class="ledger-value">${value}</div>
      </div>`;
    const section = (title, rows) => `
      <div class="ledger-section">
        <div class="ledger-sec-title">${title}</div>
        ${rows}
      </div>`;
    el.innerHTML = `<h2>The Ledger</h2>
      <div class="sub">Every deal, every dollar, every door slammed in your face.</div>` +
      section("The Grind",
        row("Deals struck", num(st.dealsStruck), "haggles that ended in a sale") +
        row("Bikes bought", num(st.bikesBought)) +
        row("Bikes sold", num((State.sold || []).length)) +
        row("Lifetime profit", cash(st.totalProfit)) +
        row("Best flip", bestFlip && bestFlip.profit > 0 ? cash(bestFlip.profit) : "—",
            bestFlip && bestFlip.profit > 0 ? bestFlip.name : "") +
        row("Favorite seller", favSeller ? favSeller : "—",
            favSeller ? `${favCount} bike${favCount === 1 ? "" : "s"} bought` : "")) +
      section("The Glory",
        row("Collection", `${kept.length} / ${BIKES.length}`,
            `${Math.round(kept.length / BIKES.length * 100)}% complete`) +
        row("Brand sets completed", num(st.brandSetsCompleted)) +
        row("Uniques found", num(st.uniquesCollected)) +
        row("NOS factory builds", num(st.nosBuilds))) +
      section("The Shame",
        row("Times blocked", num(st.timesBlocked), "wear it with pride") +
        row("Biggest loss", worstFlip && worstFlip.profit < 0 ? cash(worstFlip.profit) : "—",
            worstFlip && worstFlip.profit < 0 ? worstFlip.name : "")) +
      `<div class="ledger-foot">Deal and block counters start with this update —<br>history before today isn't counted.</div>`;
  },
};
