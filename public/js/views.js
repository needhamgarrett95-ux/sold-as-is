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

  renderGarage() {
    const el = document.getElementById("garage-view");
    if (!State.garage.length) {
      el.innerHTML = `<h2>Your Garage</h2><div class="sub">Bikes you own live here.</div>
        <div class="empty"><strong>Empty garage</strong>Hit the market and buy your first flip.</div>`;
      return;
    }
    el.innerHTML = `<h2>Your Garage</h2>
      <div class="sub">${State.garage.length} bike(s) · decide their fate</div>` +
      State.garage.map((b, i) => `
      <div class="g-item">
        <div class="g-top">
          <span class="g-name">${b.brand} ${b.model}</span>
          <span class="g-price">${money(b.boughtFor)}</span>
        </div>
        <div class="g-meta">${b.condition} · bought ${b.postedAgo} · fair value ~${money(b.fairValue)}</div>
        <div class="g-actions">
          <button class="btn-restore" data-act="restore" data-i="${i}">Restore</button>
          <button class="btn-strip" data-act="strip" data-i="${i}">Strip</button>
          <button class="btn-sell" data-act="sell" data-i="${i}">Sell</button>
          <button class="btn-keep" data-act="keep" data-i="${i}">Keep</button>
        </div>
      </div>`).join("");
    el.querySelectorAll("[data-act]").forEach(btn =>
      btn.addEventListener("click", () => this.garageAction(btn.dataset.act, +btn.dataset.i)));
  },

  garageAction(act, i) {
    const bike = State.garage[i];
    if (act === "keep") {
      bike.kept = true;
      UI.toast(`${bike.brand} ${bike.model} added to your collection`);
      this.renderGarage();
      const n = document.getElementById("nav-garage-n");
      if (n) n.textContent = State.garage.length ? `(${State.garage.length})` : "";
      return;
    }
    const labels = { restore: "Restoration shop", strip: "Part-out", sell: "Re-listing" };
    UI.toast(`${labels[act]} for the ${bike.brand} ${bike.model} — coming soon`);
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
