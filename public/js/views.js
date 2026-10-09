// Sold As-Is — garage & collection views
const SITES = {
  market:     { tab: "Sold As-Is — Mopeds for sale", url: "soldasis.place/mopeds",     icon: "🏍" },
  parts:      { tab: "Boneyard — Moped parts",       url: "boneyard.place",              icon: "⚙️" },
  garage:     { tab: "Sold As-Is — My Garage",       url: "soldasis.place/garage",     icon: "🔧" },
  collection: { tab: "Sold As-Is — My Collection",   url: "soldasis.place/collection", icon: "🏆" },
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
    document.getElementById("cats").style.display = name === "market" ? "" : "none";
    document.getElementById("parts-view").classList.toggle("hidden", name !== "parts");
    document.getElementById("garage-view").classList.toggle("hidden", name !== "garage");
    document.getElementById("collection-view").classList.toggle("hidden", name !== "collection");
    if (name === "parts") this.renderParts();
    if (name === "garage") this.renderGarage();
    if (name === "collection") this.renderCollection();
    const n = document.getElementById("nav-garage-n");
    if (n) n.textContent = State.garage.length ? `${State.garage.length}` : "";
  },

  partsFilter: "all",
  partsSearch: "",
  typeFilter: "all", // "all" | "bin" | "auction"
  auctionTimer: null,
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
    el.innerHTML = `
      <div class="eby-head">
        <div class="eby-title">🛵 Find parts that fit</div>
      </div>
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
      <div class="eby-item eby-auction">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy">
          <div class="eby-auc-badge" data-auc-timer="${p.idx}">⏱ ${mins}:${String(secs).padStart(2, "0")}</div>
        </div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${p.stateLabel} · Auction</div>
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
      <div class="eby-item">
        <div class="eby-thumb"><img src="${p.img}" alt="${p.partLabel}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${p.partLabel} for ${p.bikeBrand} ${p.bikeModel}</div>
          <div class="eby-cond">${p.stateLabel}</div>
          <div class="eby-price-row">
            <span class="eby-price">${money(p.price)}</span>
            ${p.wasPrice ? `<span class="eby-was">${money(p.wasPrice)}</span>` : ""}
          </div>
          <div class="eby-meta">Buy It Now</div>
          <div class="eby-meta">Free delivery</div>
          <div class="eby-meta">${p.watchers} watchers</div>
          <button class="eby-buy" data-buy-part="${p.idx}">Buy It Now</button>
        </div>
      </div>`;
      }).join("")
      : `<div class="empty"><strong>No parts match</strong>Try different filters.</div>`) +
      `</div>`;
    if (preserve) el.scrollTop = scrollY;
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

  buyPart(i) {
    const p = this.partsShop[i];
    if (!p) return;
    if (State.cash < p.price) {
      UI.toast("Not enough cash for that part");
      return;
    }
    State.cash -= p.price;
    State.parts = State.parts || [];
    State.parts.push(p);
    this.partsShop.splice(i, 1);
    UI.refreshCash();
    UI.toast(`${p.partLabel} (${p.bikeBrand} ${p.bikeModel}) bought`);
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
        <button class="g-tab${this.garageTab === "bikes" ? " active" : ""}" data-gtab="bikes">🏍 Bikes${State.garage.length ? ` (${State.garage.length})` : ""}</button>
        <button class="g-tab${this.garageTab === "parts" ? " active" : ""}" data-gtab="parts">⚙️ Parts${State.parts && State.parts.length ? ` (${State.parts.length})` : ""}</button>
        <button class="g-tab${this.garageTab === "assemble" ? " active" : ""}" data-gtab="assemble">🔧 Assemble</button>
      </div>`;
    if (this.garageTab === "parts") {
      el.innerHTML = tabs + this.partsInventoryHTML();
    } else if (this.garageTab === "assemble") {
      el.innerHTML = tabs + this.assembleHTML();
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
          <div class="card-loc">${b.kept ? "★ In collection" : "Pending"}</div>
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
          <button class="btn-list" data-gact="list">${b.listed ? "✓ Listed" : "📋 List on Marketplace"}</button>
          <button class="btn-keep" data-gact="keep">${b.kept ? "★ In Collection" : "🏆 Add to Collection"}</button>
          <button class="btn-strip" data-gact="partout">🔧 Part Out</button>
        </div>
        ${b.listed ? `<div class="notice">Live on the marketplace — buyers can see it.</div>` : ""}
      </div>`;
  },

  partsInventoryHTML() {
    const parts = State.parts || [];
    if (!parts.length) {
      return `<div class="pane-head"><h2>Parts Inventory</h2>
        <div class="sub">Stripped parts and Boneyard purchases live here.</div></div>
        <div class="empty"><strong>No parts yet</strong>Part out a bike or buy from the Boneyard.</div>`;
    }
    // Group by part key
    const groups = {};
    parts.forEach(p => {
      const k = `${p.partKey}|${p.bikeBrand}|${p.bikeModel}`;
      if (!groups[k]) groups[k] = { ...p, count: 0 };
      groups[k].count++;
    });
    return `<div class="pane-head"><h2>Parts Inventory</h2>
      <div class="sub">${parts.length} part(s) in storage</div></div>
      <div class="eby-list">` +
      Object.values(groups).map(g => `
      <div class="eby-item">
        <div class="eby-thumb"><img src="${g.img}" alt="${g.partLabel}" loading="lazy"></div>
        <div class="eby-info">
          <div class="eby-name">${g.partLabel} — ${g.bikeBrand} ${g.bikeModel}</div>
          <div class="eby-cond">${g.stateLabel || "Pristine"}${g.count > 1 ? ` × ${g.count}` : ""}</div>
        </div>
      </div>`).join("") + `</div>`;
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
  },

  garageDetailAction(act) {
    const bike = State.garage[this.garageDetailIdx];
    if (!bike) return;
    if (act === "list") {
      bike.listed = !bike.listed;
      UI.toast(bike.listed
        ? `${bike.brand} ${bike.model} listed on the marketplace`
        : `${bike.brand} ${bike.model} unlisted`);
      this.renderGarage();
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
    for (const p of avail) {
      const state = (bike.partStates && bike.partStates[p.key]) || "pristine";
      State.parts.push({
        partKey: p.key, partLabel: p.label,
        bikeBrand: bike.brand, bikeModel: bike.model, bikeSprite: bike.sprite,
        state, stateLabel: PART_STATE_LABEL[state],
        img: partImg(bike.sprite, p.key, "pristine"), // V4: pristine art for now
      });
    }
    State.garage.splice(idx, 1);
    this.garageDetailIdx = -1;
    this.garageTab = "parts";
    UI.toast(`${bike.brand} ${bike.model} stripped — ${avail.length} parts in inventory`);
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
          `<div class="slot ${i < s.owned ? "filled" : ""}">${i < s.owned ? "✓" : "?"}</div>`).join("")}
        </div>
      </div>`).join("");
  },
};
