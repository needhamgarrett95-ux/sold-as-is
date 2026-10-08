// Sold As-Is — player state
const State = {
  cash: 1500,
  garage: [],       // owned bikes
  sold: [],         // flip history
  rep: 3.0,         // seller reputation 1-5

  canAfford(price) { return this.cash >= price; },

  buy(listing) {
    if (!this.canAfford(listing.price)) return false;
    this.cash -= listing.price;
    this.garage.push({ ...listing, boughtFor: listing.price, boughtAt: Date.now() });
    return true;
  },

  fmtCash() { return "$" + this.cash.toLocaleString(); },
};
