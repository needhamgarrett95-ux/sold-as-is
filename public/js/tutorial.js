// Sold As-Is — mandatory interactive tutorial & milestones
const Tutorial = {
  // Each step: info steps need a "Got it" tap, action steps need the highlighted element tapped
  steps: [
    {
      title: "Welcome to Sold As-Is",
      text: "Buy low, flip high. No warranties, no take-backs. This is the marketplace — let's take a quick tour.",
      action: null,
    },
    {
      title: "Inspect a Bike",
      text: "Every listing has a price, condition, and seller. Tap any bike to see its full details.",
      action: "#feed .card",
    },
    {
      title: "Haggling",
      text: "See the message box? Type an offer and hit Send. Sellers accept, counter, or block lowballers. Tap back to return to the listings.",
      action: "#d-back",
    },
    {
      title: "Make It Count",
      text: "Every deal is permanent — no take-backs, no refunds. Make too many bad deals and you'll have to reset your save and start over. Think before you buy.",
      action: null,
    },
    {
      title: "Your Garage",
      text: "Bikes you buy live here. Restore them, strip them for parts, or flip them. Take a look.",
      action: '[data-view="garage"]',
    },
    {
      title: "The Boneyard",
      text: "This is the parts shop. Buy It Now, make offers, or bid in auctions. Take a look.",
      action: '[data-view="parts"]',
    },
    {
      title: "Your Collection",
      text: "The endgame. Restore bikes to pristine condition and fill all 8 brand sets — 29 bikes total. Your milestones live here too. Take a look.",
      action: '[data-view="collection"]',
    },
    {
      title: "Repair Risk",
      text: "You can repair worn parts — but each attempt is a gamble. The risk climbs every time: 10%, then 18%, then 30%. A failed repair makes the part WORSE. Know when to stop.",
      action: null,
    },
    {
      title: "You're Ready",
      text: "That's the tour. Buy low, flip high, build the ultimate collection. Good luck out there.",
      action: null,
    },
  ],

  current: 0,
  active: false,
  boundEl: null,

  shouldRun() {
    try {
      return !localStorage.getItem("soldasis_tutorial_done");
    } catch (e) { return false; }
  },

  start() {
    if (!this.shouldRun()) return;
    this.active = true;
    this.current = 0;
    this.showStep();
  },

  showStep() {
    const step = this.steps[this.current];
    if (!step) { this.finish(); return; }

    // Smart skip: if already in detail view on the "inspect" step, move on
    if (step.action === "#feed .card" && document.getElementById("detail") &&
        !document.getElementById("detail").classList.contains("hidden") &&
        document.querySelector("#detail .d-photo")) {
      this.current++;
      setTimeout(() => this.showStep(), 100);
      return;
    }

    // Clear old highlight and listener
    this.unbind();
    document.querySelectorAll(".tutorial-highlight").forEach(el =>
      el.classList.remove("tutorial-highlight"));

    // Show the tutorial card
    let card = document.getElementById("tutorial-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "tutorial-card";
      document.body.appendChild(card);
    }
    const isLast = this.current === this.steps.length - 1;
    card.innerHTML = `
      <div class="tutorial-inner">
        <div class="tutorial-progress">Step ${this.current + 1} of ${this.steps.length}</div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        ${!step.action ? `<button class="tutorial-btn primary" id="tut-gotit">${isLast ? "Let's go!" : "Got it"}</button>` : `<div class="tutorial-hint">${(typeof Icon !== "undefined" ? Icon.get('tap') : "")} Tap the highlighted area to continue</div>`}
      </div>`;
    card.classList.add("visible");

    if (!step.action) {
      document.getElementById("tut-gotit").onclick = () => this.next();
    } else {
      // On the haggle step, scroll the detail view to the message box
      if (step.action === "#d-back") {
        setTimeout(() => {
          const msgBox = document.querySelector(".msg-seller-card");
          if (msgBox) msgBox.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 400);
      }
      // Wait for the user to tap the highlighted element
      // Poll briefly in case the element isn't rendered yet
      let tries = 0;
      const tryBind = () => {
        const el = document.querySelector(step.action);
        if (el) {
          el.classList.add("tutorial-highlight");
          this.boundEl = el;
          this._handler = () => this.next();
          el.addEventListener("click", this._handler, { once: true, capture: true });
          // iOS fires touchend instead of click for cards
          el.addEventListener("touchend", this._handler, { once: true, capture: true });
        } else if (tries++ < 20) {
          setTimeout(tryBind, 250);
        }
      };
      tryBind();
    }
  },

  unbind() {
    if (this.boundEl && this._handler) {
      this.boundEl.removeEventListener("click", this._handler, { capture: true });
      this.boundEl.removeEventListener("touchend", this._handler, { capture: true });
    }
    this.boundEl = null;
    this._handler = null;
  },

  next() {
    this.unbind();
    // Clear highlight
    document.querySelectorAll(".tutorial-highlight").forEach(el =>
      el.classList.remove("tutorial-highlight"));
    this.current++;
    // Small delay so the tapped view can render before we look for the next target
    setTimeout(() => this.showStep(), 300);
  },

  finish() {
    this.unbind();
    this.active = false;
    document.querySelectorAll(".tutorial-highlight").forEach(el =>
      el.classList.remove("tutorial-highlight"));
    const card = document.getElementById("tutorial-card");
    if (card) card.classList.remove("visible");
    try {
      localStorage.setItem("soldasis_tutorial_done", "1");
    } catch (e) {}
  },
};

// Milestones / goals system
const Milestones = {
  defs: [
    { id: "first_buy", name: "First Purchase", desc: "Buy your first bike", check: (s) => s.bikesBought >= 1 },
    { id: "first_flip", name: "First Flip", desc: "Sell a bike for profit", check: (s) => s.bikesSoldForProfit >= 1 },
    { id: "profit_1k", name: "Hustler", desc: "Earn $1,000 total profit", check: (s) => s.totalProfit >= 1000 },
    { id: "profit_10k", name: "Big Timer", desc: "Earn $10,000 total profit", check: (s) => s.totalProfit >= 10000 },
    { id: "profit_50k", name: "Moped Mogul", desc: "Earn $50,000 total profit", check: (s) => s.totalProfit >= 50000 },
    { id: "collect_1", name: "Collector", desc: "Add your first bike to the Collection", check: (s) => s.collected >= 1 },
    { id: "collect_5", name: "Getting Serious", desc: "Collect 5 bikes", check: (s) => s.collected >= 5 },
    { id: "collect_14", name: "Halfway There", desc: "Collect 14 bikes", check: (s) => s.collected >= 14 },
    { id: "brand_set", name: "Brand Loyalist", desc: "Complete a full brand set", check: (s) => s.brandSetsCompleted >= 1 },
    { id: "all_brands", name: "Completionist", desc: "Complete all 8 brand sets", check: (s) => s.brandSetsCompleted >= 8 },
    { id: "full_collection", name: "Ultimate Collection", desc: "Collect all 29 bikes", check: (s) => s.collected >= 29 },
    { id: "auction_win", name: "Auction Hunter", desc: "Win a Boneyard auction", check: (s) => s.auctionsWon >= 1 },
    { id: "haggle_10", name: "Negotiator", desc: "Complete 10 successful haggles", check: (s) => s.successfulHaggles >= 10 },
    { id: "restore_1", name: "Wrench Turner", desc: "Restore your first bike", check: (s) => s.bikesRestored >= 1 },
  ],

  check(stats) {
    let completed = [];
    try {
      completed = JSON.parse(localStorage.getItem("soldasis_milestones") || "[]");
    } catch (e) {}
    for (const def of this.defs) {
      if (!completed.includes(def.id) && def.check(stats)) {
        completed.push(def.id);
        this.celebrate(def);
      }
    }
    try {
      localStorage.setItem("soldasis_milestones", JSON.stringify(completed));
    } catch (e) {}
  },

  celebrate(def) {
    if (typeof UI !== "undefined" && UI.toast) {
      UI.toast(`🏆 Milestone: ${def.name} — ${def.desc}`);
    }
  },

  completed() {
    try {
      return JSON.parse(localStorage.getItem("soldasis_milestones") || "[]");
    } catch (e) { return []; }
  },
};
