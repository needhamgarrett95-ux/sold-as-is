// Sold As-Is — player state
const SAVE_KEY = "soldasis_save_v1";

const State = {
  cash: 1500,
  garage: [],       // owned bikes
  parts: [],        // parts inventory
  rollers: [],      // stripped bike rollers in Assemble
  sold: [],         // flip history
  rep: 3.0,         // seller reputation 1-5
  stats: {          // milestone tracking
    bikesBought: 0, bikesSoldForProfit: 0, totalProfit: 0,
    collected: 0, brandSetsCompleted: 0, auctionsWon: 0,
    successfulHaggles: 0, bikesRestored: 0,
    nosParts: 0, nosBuilds: 0, nosKeptBuilds: 0,
    uniquesCollected: 0, uniquesSoldForProfit: 0,
  },

  canAfford(price) { return this.cash >= price; },

  buy(listing) {
    if (!this.canAfford(listing.price)) return false;
    this.cash -= listing.price;
    const boughtBike = { ...listing, boughtFor: listing.price, boughtAt: Date.now() };
    // Snapshot the as-bought condition: the repainted cap compares against it
    boughtBike.bornCond = listing.condition || null;
    // Keep the two missing-part ledgers in agreement from the start
    boughtBike.missingParts = Object.keys(boughtBike.partStates || {})
      .filter(k => boughtBike.partStates[k] === "missing");
    this.garage.push(boughtBike);
    this.stats.bikesBought++;
    if (typeof Milestones !== "undefined") Milestones.check(this.stats);
    Save.save();
    return true;
  },

  fmtCash() { return "$" + this.cash.toLocaleString(); },
};

// Save/load system
const Save = {
  save() {
    // Restore/wipe in progress: the page is about to reload into a different
    // save — never let a last-moment autosave overwrite it with the old game
    if (window.__soldasisNoSave) return;
    try {
      const data = {
        v: 1,
        savedAt: Date.now(),
        cash: State.cash,
        garage: State.garage,
        parts: State.parts,
        rollers: State.rollers,
        sold: State.sold,
        rep: State.rep,
        stats: State.stats,
        myBikeListings: Views.myBikeListings || [],
        myPartListings: Views.myPartListings || [],
        cart: Views.cart || [],
        crateStock: Views.crateStock || null,
        skills: (typeof Skills !== "undefined") ? Skills.toJSON() : undefined,
      };
      // Mirror backup: stash the previous save before overwriting, so a corrupt
      // write can never take the game with it — load() falls back to the mirror
      try {
        const prev = localStorage.getItem(SAVE_KEY);
        if (prev && JSON.parse(prev)) localStorage.setItem(SAVE_KEY + "_bak", prev);
      } catch (e) {}
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      let data = null;
      try { data = raw ? JSON.parse(raw) : null; } catch (e) { data = null; }
      if (!data || data.v !== 1) {
        // Main save missing or corrupt — fall back to the mirror of the last good save
        try {
          const bak = localStorage.getItem(SAVE_KEY + "_bak");
          data = bak ? JSON.parse(bak) : null;
        } catch (e) { data = null; }
      }
      if (!data || data.v !== 1) return false;

      State.cash = data.cash ?? 1500;
      State.garage = data.garage || [];
      State.parts = data.parts || [];
      State.rollers = data.rollers || [];
      State.sold = data.sold || [];
      State.rep = data.rep ?? 3.0;
      if (data.stats) Object.assign(State.stats, data.stats);

      // Restore listings, resolving time-based state
      const now = Date.now();
      Views.myBikeListings = (data.myBikeListings || []).filter(l => {
        // Keep all bike listings (active or sold)
        return true;
      });
      Views.cart = (data.cart || []).filter(idx => typeof idx === "number");
      Views.crateStock = Array.isArray(data.crateStock) ? data.crateStock : null;
      if (typeof Skills !== "undefined") Skills.init(data.skills);
      Views.myPartListings = (data.myPartListings || []).map(l => {
        // Resolve auctions that ended while away
        if (l.listingType === "auction" && !l.sold && l.listedAt) {
          const elapsed = Math.floor((now - l.listedAt) / 1000);
          const remaining = 60 - elapsed;
          if (remaining <= 0) {
            // Auction ended while away — resolve with best outcome
            if (l.highBidder) {
              l.sold = true;
              l.soldFor = l.currentBid;
              l.soldAt = now;
              State.cash += l.currentBid;
            } else {
              // No bids — return to inventory
              const { listingType, startPrice, currentBid, highBidder, timeLeft, bidders, listedAt, ...part } = l;
              State.parts.push(part);
              return null;
            }
          } else {
            l.timeLeft = remaining;
          }
        }
        // Clear stale offers (buyers move on)
        if (l.offer) l.offer = null;
        return l;
      }).filter(Boolean);

      if (typeof Views !== "undefined" && Views.refreshNosStats) Views.refreshNosStats();
      return true;
    } catch (e) {
      console.warn("Load failed:", e);
      return false;
    }
  },

  clear() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  },
};
