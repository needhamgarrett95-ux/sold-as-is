// Sold As-Is — player state
const SAVE_KEY = "soldasis_save_v1";

const State = {
  cash: 1500,
  garage: [],       // owned bikes
  parts: [],        // parts inventory
  rollers: [],      // stripped bike rollers in Assemble
  sold: [],         // flip history
  rep: 3.0,         // seller reputation 1-5

  canAfford(price) { return this.cash >= price; },

  buy(listing) {
    if (!this.canAfford(listing.price)) return false;
    this.cash -= listing.price;
    this.garage.push({ ...listing, boughtFor: listing.price, boughtAt: Date.now() });
    Save.save();
    return true;
  },

  fmtCash() { return "$" + this.cash.toLocaleString(); },
};

// Save/load system
const Save = {
  save() {
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
        myBikeListings: Views.myBikeListings || [],
        myPartListings: Views.myPartListings || [],
        cart: Views.cart || [],
        skills: (typeof Skills !== "undefined") ? Skills.toJSON() : undefined,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Save failed:", e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || data.v !== 1) return false;

      State.cash = data.cash ?? 1500;
      State.garage = data.garage || [];
      State.parts = data.parts || [];
      State.rollers = data.rollers || [];
      State.sold = data.sold || [];
      State.rep = data.rep ?? 3.0;

      // Restore listings, resolving time-based state
      const now = Date.now();
      Views.myBikeListings = (data.myBikeListings || []).filter(l => {
        // Keep all bike listings (active or sold)
        return true;
      });
      Views.cart = (data.cart || []).filter(idx => typeof idx === "number");
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
