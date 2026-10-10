// Sold As-Is — progressive tutorial & milestones
const Tutorial = {
  // Tutorial steps shown in order on first play
  steps: [
    {
      title: "Welcome to Sold As-Is",
      text: "Buy low, flip high. No warranties, no take-backs. Let's show you the ropes.",
      highlight: null,
    },
    {
      title: "The Marketplace",
      text: "This is where it all happens. Bikes for sale from sellers around Port Angeles. Tap any listing to see details.",
      highlight: '[data-view="market"]',
    },
    {
      title: "Haggle",
      text: "Don't pay asking price like a sucker. Make an offer — sellers respond. Some accept, some counter, some will block you for lowballing.",
      highlight: null,
    },
    {
      title: "Your Garage",
      text: "Bikes you buy land here. Restore them, strip them for parts, or flip them as-is.",
      highlight: '[data-view="garage"]',
    },
    {
      title: "The Boneyard",
      text: "Need parts? The Boneyard has them — Buy It Now, make offers, or win auctions. Watch for deals.",
      highlight: '[data-view="parts"]',
    },
    {
      title: "The Collection",
      text: "The real game. Restore bikes to pristine condition and add them to your Collection. Complete all 8 brands — 28 bikes total.",
      highlight: '[data-view="collection"]',
    },
    {
      title: "Skills",
      text: "Every dollar of profit earns XP. Spend skill points on Gear Head, Smooth Talker, and Browser Extension to get better deals.",
      highlight: null,
    },
    {
      title: "You're on your own",
      text: "That's the basics. Buy low, flip high, build the ultimate collection. Good luck out there.",
      highlight: null,
    },
  ],

  current: 0,
  active: false,

  // Check if tutorial should run (first time)
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

    // Remove old highlight
    document.querySelectorAll(".tutorial-highlight").forEach(el =>
      el.classList.remove("tutorial-highlight"));

    // Highlight target if specified
    if (step.highlight) {
      const el = document.querySelector(step.highlight);
      if (el) el.classList.add("tutorial-highlight");
    }

    // Show the tutorial card
    let card = document.getElementById("tutorial-card");
    if (!card) {
      card = document.createElement("div");
      card.id = "tutorial-card";
      document.body.appendChild(card);
    }
    const isLast = this.current === this.steps.length - 1;
    const isFirst = this.current === 0;
    card.innerHTML = `
      <div class="tutorial-inner">
        <div class="tutorial-progress">${this.current + 1} / ${this.steps.length}</div>
        <h3>${step.title}</h3>
        <p>${step.text}</p>
        <div class="tutorial-btns">
          ${!isFirst ? `<button class="tutorial-btn secondary" id="tut-back">Back</button>` : ""}
          <button class="tutorial-btn primary" id="tut-next">${isLast ? "Let's go" : "Next"}</button>
          <button class="tutorial-btn text" id="tut-skip">Skip</button>
        </div>
      </div>`;
    card.classList.add("visible");

    document.getElementById("tut-next").onclick = () => this.next();
    const back = document.getElementById("tut-back");
    if (back) back.onclick = () => this.back();
    document.getElementById("tut-skip").onclick = () => this.finish();
  },

  next() {
    this.current++;
    this.showStep();
  },

  back() {
    if (this.current > 0) {
      this.current--;
      this.showStep();
    }
  },

  finish() {
    this.active = false;
    document.querySelectorAll(".tutorial-highlight").forEach(el =>
      el.classList.remove("tutorial-highlight"));
    const card = document.getElementById("tutorial-card");
    if (card) card.classList.remove("visible");
    try {
      localStorage.setItem("soldasis_tutorial_done", "1");
    } catch (e) {}
  },

  // Replay tutorial from settings
  replay() {
    try { localStorage.removeItem("soldasis_tutorial_done"); } catch (e) {}
    this.start();
  },
};

// Milestones / goals system
const Milestones = {
  defs: [
    { id: "first_buy", name: "First Purchase", desc: "Buy your first bike", check: (s) => s.stats.bikesBought >= 1 },
    { id: "first_flip", name: "First Flip", desc: "Sell a bike for profit", check: (s) => s.stats.bikesSoldForProfit >= 1 },
    { id: "profit_1k", name: "Hustler", desc: "Earn $1,000 total profit", check: (s) => s.stats.totalProfit >= 1000 },
    { id: "profit_10k", name: "Big Timer", desc: "Earn $10,000 total profit", check: (s) => s.stats.totalProfit >= 10000 },
    { id: "profit_50k", name: "Moped Mogul", desc: "Earn $50,000 total profit", check: (s) => s.stats.totalProfit >= 50000 },
    { id: "collect_1", name: "Collector", desc: "Add your first bike to the Collection", check: (s) => s.stats.collected >= 1 },
    { id: "collect_5", name: "Getting Serious", desc: "Collect 5 bikes", check: (s) => s.stats.collected >= 5 },
    { id: "collect_14", name: "Halfway There", desc: "Collect 14 bikes", check: (s) => s.stats.collected >= 14 },
    { id: "brand_set", name: "Brand Loyalist", desc: "Complete a full brand set", check: (s) => s.stats.brandSetsCompleted >= 1 },
    { id: "all_brands", name: "Completionist", desc: "Complete all 8 brand sets", check: (s) => s.stats.brandSetsCompleted >= 8 },
    { id: "full_collection", name: "Ultimate Collection", desc: "Collect all 28 bikes", check: (s) => s.stats.collected >= 28 },
    { id: "auction_win", name: "Auction Hunter", desc: "Win a Boneyard auction", check: (s) => s.stats.auctionsWon >= 1 },
    { id: "haggle_10", name: "Negotiator", desc: "Complete 10 successful haggles", check: (s) => s.stats.successfulHaggles >= 10 },
    { id: "restore_1", name: "Wrench Turner", desc: "Restore your first bike", check: (s) => s.stats.bikesRestored >= 1 },
  ],

  // Check and award any newly completed milestones
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

  // Get completed milestone IDs
  completed() {
    try {
      return JSON.parse(localStorage.getItem("soldasis_milestones") || "[]");
    } catch (e) { return []; }
  },
};
