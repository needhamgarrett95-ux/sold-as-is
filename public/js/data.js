// Sold As-Is — bike roster & listing generator

const BRANDS = {
  Ronin:   { models: [
    { name: "Wasp",  base: 1400, rarity: 4, sprite: "yamaha_zuma-prebug", desc: "The bug-eyed legend. Pre-2002." },
    { name: "Hopper", base: 650, rarity: 2, sprite: "yamaha_qt50", desc: "Shaft-drive oddball. Charming." },
    { name: "Roadster", base: 900, rarity: 3, sprite: "yamaha_rd50", desc: "Two-stroke screamer in a tiny package." },
    { name: "Trailblazer", base: 750, rarity: 2, sprite: "yamaha_dt50", desc: "Enduro-styled 50. Trail-ready." },
  ]},
  Kestrel:    { models: [
    { name: "Firebrand", base: 1600, rarity: 4, sprite: "honda_mb5", desc: "The holy grail. Black/red or nothing." },
    { name: "Pixie",     base: 800, rarity: 2, sprite: "honda_dio", desc: "Scooter scene staple. Tunes easy." },
    { name: "Courier",   base: 550, rarity: 2, sprite: "honda_express", desc: "Noped royalty. Everyone's first." },
    { name: "Cubby",     base: 1100, rarity: 3, sprite: "honda_cub_c70", desc: "Step-through icon. Runs forever." },
  ]},
  Vostok:    { models: [
    { name: "Sprinter", base: 450, rarity: 1, sprite: "tomos_sprint", desc: "The workhorse. Parts everywhere." },
    { name: "Targa",    base: 550, rarity: 2, sprite: "tomos_targa_lx", desc: "Top-tank classic. Clean lines." },
    { name: "Standard", base: 400, rarity: 1, sprite: "tomos_st", desc: "Basic, honest, cheap." },
    { name: "Pony",     base: 500, rarity: 2, sprite: "tomos_colt", desc: "Underrated. Snappy motor." },
  ]},
  Alpen:     { models: [
    { name: "Max",     base: 500, rarity: 1, sprite: "puch_maxi", desc: "The people's moped. Millions made." },
    { name: "Bigbore", base: 1300, rarity: 4, sprite: "puch_magnum", desc: "Top-tank king. Bring money." },
    { name: "Harbor",  base: 450, rarity: 1, sprite: "puch_newport", desc: "Max's sibling. Same guts." },
    { name: "Viper",   base: 700, rarity: 3, sprite: "puch_cobra", desc: "Rare bird. Weird and wonderful." },
  ]},
  Dolce:    { models: [
    { name: "Bello",  base: 600, rarity: 2, sprite: "vespa_ciao", desc: "Italian charm, bicycle pedals." },
    { name: "Grosso", base: 750, rarity: 3, sprite: "vespa_grande", desc: "Big Bello energy. Variated." },
    { name: "Sport",  base: 550, rarity: 2, sprite: "vespa_bravo", desc: "The sporty one. Kinda." },
    { name: "Mono",   base: 650, rarity: 2, sprite: "vespa_si", desc: "Monoshock style. Cool factor high." },
  ]},
  Hayate:   { models: [
    { name: "Shuttle", base: 450, rarity: 1, sprite: "suzuki_fa50", desc: "Shaft drive. Weird in a good way." },
    { name: "Junior",  base: 350, rarity: 1, sprite: "suzuki_jr50", desc: "Kids' dirt bike. Tiny ripper." },
    { name: "Outback", base: 500, rarity: 2, sprite: "suzuki_or50", desc: "Moped oddity. Collectors notice." },
  ]},
  Citadelle: { models: [
    { name: "Moby", base: 550, rarity: 2, sprite: "motobecane_50v", desc: "French classic. Variator magic." },
    { name: "88",   base: 650, rarity: 3, sprite: "motobecane_av88", desc: "Vintage French. Beautiful rust." },
    { name: "X",    base: 400, rarity: 1, sprite: "motobecane_moby_x", desc: "Later Moby. Still French." },
  ]},
  Toro:    { models: [
    { name: "Variante", base: 600, rarity: 2, sprite: "derbi_variant", desc: "Spanish flair. Reed-valve pep." },
    { name: "Diablo",   base: 500, rarity: 2, sprite: "derbi_ds50", desc: "Sporty 50. Handles great." },
    { name: "Lagoon",   base: 700, rarity: 3, sprite: "derbi_laguna", desc: "Sleek and rare. Head-turner." },
  ]},
};

// Flatten to bike list with ids
const BIKES = [];
Object.entries(BRANDS).forEach(([brand, { models }]) => {
  models.forEach((m, i) => BIKES.push({ id: `${brand}-${i}`.replace(/\s/g, ""), brand, ...m }));
});

const CONDITIONS = [
  { name: "Mint",       mult: 1.35, weight: 5 },
  { name: "Clean",      mult: 1.15, weight: 15 },
  { name: "Good",       mult: 1.0,  weight: 25 },
  { name: "Fair",       mult: 0.8,  weight: 20 },
  { name: "Rough",      mult: 0.55, weight: 15 },
  { name: "Non-runner", mult: 0.35, weight: 12 },
  { name: "Parts bike", mult: 0.2,  weight: 8 },
];

const TITLES = [
  "{bike} — {cond}", "{bike} {cond}", "{bike}, {tag}", "{tag} {bike}",
  "{bike} - {tag}", "{bike} ({cond})",
];
const TAGS = ["runs great", "RUNS GR8", "needs carb work", "barn find", "one owner",
  "AS-IS", "no lowballs", "fresh top end", "project bike", "all original",
  "just serviced", "new tires", "clean title", "bill of sale only", "first $X takes it",
  "wife says it goes", "too many projects", "ran when parked", "make offer"];

const SELLERS = ["mike_rides", "2stroke_dan", "barnfind_betty", "moped_mike", "scoot_king",
  "garage_greg", "alpen_amy", "dolce_dan", "vostok_vic", "kestrel_kyle", "rusty_rides",
  "clean_clara", "deal_dave", "moto_maria", "spareparts_sam", "og_rider_88"];

const LOCATIONS = ["Portland, OR", "Austin, TX", "Chicago, IL", "Denver, CO", "Seattle, WA",
  "Nashville, TN", "Phoenix, AZ", "Columbus, OH", "Minneapolis, MN", "Sacramento, CA"];

// Player location (opt-in, never stored or sent anywhere — memory only)
const PlayerLoc = {
  lat: null, lng: null, enabled: false,
  init() {
    try {
      const p = JSON.parse(localStorage.getItem("soldasis_loc_pref") || "{}");
      this.enabled = !!p.enabled;
    } catch (e) {}
  },
  savePref() {
    localStorage.setItem("soldasis_loc_pref", JSON.stringify({ enabled: this.enabled }));
  },
  request(cb) {
    if (!navigator.geolocation) { cb(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.lat = pos.coords.latitude;
        this.lng = pos.coords.longitude;
        this.enabled = true;
        this.savePref();
        cb(true);
      },
      () => { this.enabled = false; this.savePref(); cb(false); },
      { timeout: 10000 }
    );
  },
  disable() {
    this.lat = null; this.lng = null; this.enabled = false;
    this.savePref();
  },
  // Random distance 2-50 mi from player (feels local without reverse geocoding)
  localMiles() {
    if (this.lat == null) return null;
    return Math.floor(Math.random() * 48) + 2;
  },
};

const PARTS = [
  { key: "engine",      label: "Engine" },
  { key: "exhaust",     label: "Exhaust" },
  { key: "wheel_front", label: "Front Wheel" },
  { key: "wheel_rear",  label: "Rear Wheel" },
  { key: "fuel_tank",   label: "Fuel Tank" },
  { key: "headlight",   label: "Headlight" },
  { key: "handlebars",  label: "Handlebars" },
  { key: "turn_signals",label: "Turn Signals" },
];

// Probability of each part state given the bike's overall condition
const PART_DIST = {
  // [pristine, used_good, used_bad, totaled] — pristine is rare
  "Mint":       [0.15, 0.50, 0.30, 0.05],
  "Clean":      [0.10, 0.45, 0.35, 0.10],
  "Good":       [0.05, 0.40, 0.40, 0.15],
  "Fair":       [0.03, 0.30, 0.47, 0.20],
  "Rough":      [0.01, 0.15, 0.54, 0.30],
  "Non-runner": [0.00, 0.10, 0.50, 0.40],
  "Parts bike": [0.00, 0.05, 0.35, 0.60],
};
const PART_STATES = ["pristine", "used_good", "used_bad", "totaled"];
const PART_STATE_LABEL = { pristine: "Pristine", used_good: "Good", used_bad: "Worn", totaled: "Shot" };

// Condition % → state mapping (0-100)
function pctToState(pct) {
  if (pct >= 90) return "pristine";
  if (pct >= 70) return "used_good";
  if (pct >= 40) return "used_bad";
  return "totaled";
}
// Default % for a given state (midpoint of its band)
function stateToPct(state) {
  return { pristine: 95, used_good: 80, used_bad: 55, totaled: 20 }[state] ?? 50;
}
// Ensure a part has a conditionPct (backfill for older parts)
function ensurePct(p) {
  if (typeof p.conditionPct !== "number") {
    p.conditionPct = stateToPct(p.state);
  }
  return p.conditionPct;
}

// Repair pricing: base by part, scaled by how bad the condition is
const REPAIR_BASE = {
  engine: 80, exhaust: 35, wheel_front: 25, wheel_rear: 25,
  fuel_tank: 30, headlight: 18, handlebars: 14, turn_signals: 10,
};
function repairCost(part) {
  const pct = ensurePct(part);
  const base = REPAIR_BASE[part.partKey] || 20;
  // Worse condition = more expensive: 1.6x at 25% → 0.9x at 69%
  const mult = 1.6 - (pct / 100);
  return Math.max(5, Math.round(base * mult));
}
// Attempt a repair: returns { newPct, improved }
// Cannot repair below 25%. Max result 70%. Chance-based.
function attemptRepair(part) {
  const pct = ensurePct(part);
  if (pct < 25) return { newPct: pct, improved: false, reason: "too_far_gone" };
  // 75% chance of improvement, else it holds
  if (Math.random() > 0.75) {
    return { newPct: pct, improved: false, reason: "no_change" };
  }
  const gain = 10 + ((Math.random() * 20) | 0); // +10-30
  const newPct = Math.min(70, pct + gain);
  return { newPct, improved: newPct > pct, reason: "ok" };
}

// V4: only show parts that actually exist for each bike
function availableParts(sprite) {
  const avail = (typeof PARTS_MANIFEST !== "undefined" && PARTS_MANIFEST[sprite]) || null;
  if (!avail) return PARTS; // fallback if manifest not loaded
  return PARTS.filter(p => avail.includes(p.key));
}

function rollPartStates(condition, sprite) {
  const dist = PART_DIST[condition] || PART_DIST["Good"];
  const states = {};
  const parts = sprite ? availableParts(sprite) : PARTS;
  for (const p of parts) {
    const r = Math.random();
    let acc = 0, state = "pristine";
    for (let i = 0; i < 4; i++) { acc += dist[i]; if (r <= acc) { state = PART_STATES[i]; break; } }
    states[p.key] = state;
  }
  return states;
}

function partImg(sprite, partKey, state) {
  // Map game sprite names to parts folder names (zuma uses underscore)
  const folder = sprite.replace(/-/g, "_");
  const suffix = state === "pristine" ? "" : "_" + state;
  return `assets/bikes/parts/${folder}/${partKey}${suffix}.png`;
}

// ---------- parts shop ----------
const PART_BASE_PRICE = {
  engine: 220, exhaust: 90, wheel_front: 70, wheel_rear: 70,
  fuel_tank: 80, headlight: 45, handlebars: 35, turn_signals: 25,
};
const PART_COND_MULT = { pristine: 1.0, used_good: 0.55, used_bad: 0.28, totaled: 0.1 };

const BIDDER_NAMES = ["moped_mike", "rusty_rider", "carb_king", "two_stroke_tom",
  "barnfind_betty", "alpen_amy", "dolce_vince", "throttle_jockey", "grease_monkey",
  "scoot_scoot", "wrench_wendy", "piston_paul"];

function genPartsShop(n = 16) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const bike = BIKES[(Math.random() * BIKES.length) | 0];
    const avail = availableParts(bike.sprite);
    const part = avail[(Math.random() * avail.length) | 0];
    // Randomize condition — pristine is rare on the Boneyard
    const roll = Math.random();
    const state = roll < 0.08 ? "pristine"
      : roll < 0.40 ? "used_good"
      : roll < 0.75 ? "used_bad"
      : "totaled";
    const price = Math.max(5, Math.round(PART_BASE_PRICE[part.key] * PART_COND_MULT[state] * (0.85 + Math.random() * 0.3)));
    // eBay flavor: watchers + strikethrough "was" price
    const watchers = 1 + ((Math.random() * 14) | 0);
    const wasPrice = Math.random() < 0.4 ? Math.round(price * (1.1 + Math.random() * 0.25)) : null;
    const item = {
      id: i, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
      partKey: part.key, partLabel: part.label, state,
      stateLabel: PART_STATE_LABEL[state],
      price, wasPrice, watchers, img: partImg(bike.sprite, part.key, state),
      listingType: "bin", // "bin" or "auction"
    };
    // ~35% are auctions
    if (Math.random() < 0.35) {
      const startBid = Math.max(1, Math.round(price * (0.55 + Math.random() * 0.15)));
      const numBidders = 2 + ((Math.random() * 3) | 0); // 2-4 bidders
      const bidders = [];
      const usedNames = new Set();
      for (let b = 0; b < numBidders; b++) {
        let nm;
        do { nm = BIDDER_NAMES[(Math.random() * BIDDER_NAMES.length) | 0]; }
        while (usedNames.has(nm));
        usedNames.add(nm);
        // Each bidder has a secret max (80-115% of BIN price) — realistic budgets
        bidders.push({ name: nm, max: Math.round(price * (0.8 + Math.random() * 0.35)) });
      }
      item.listingType = "auction";
      item.startBid = startBid;
      item.currentBid = startBid;
      item.highBidder = null; // null = no bids yet
      item.bidders = bidders;
      item.timeLeft = 30; // seconds
      item.ended = false;
      item.bidIncrement = price < 30 ? 1 : price < 75 ? 2 : 5;
    }
    out.push(item);
  }
  return out;
}

function pickWeighted(items, wkey) {
  const total = items.reduce((s, i) => s + i[wkey], 0);
  let r = Math.random() * total;
  for (const i of items) { r -= i[wkey]; if (r <= 0) return i; }
  return items[items.length - 1];
}
const pick = a => a[Math.floor(Math.random() * a.length)];
const money = n => "$" + Math.round(n).toLocaleString();

function makeListing(id) {
  const bike = pick(BIKES);
  const cond = pickWeighted(CONDITIONS, "weight");
  // Price: base * condition * (0.85–1.25 noise) — sometimes a deal, sometimes overpriced
  const dealFactor = 0.85 + Math.random() * 0.4;
  const price = Math.round(bike.base * cond.mult * dealFactor / 10) * 10;
  const tag = pick(TAGS);
  const title = pick(TITLES).replace("{bike}", `${bike.brand} ${bike.name}`)
    .replace("{cond}", cond.name.toLowerCase()).replace("{tag}", tag);
  const minsAgo = Math.floor(Math.random() * 600) + 2;
  return {
    id, bikeId: bike.id, brand: bike.brand, model: bike.name,
    sprite: bike.sprite,
    baseValue: bike.base, rarity: bike.rarity,
    condition: cond.name, price,
    partStates: rollPartStates(cond.name, bike.sprite),
    // fair value estimate (what inspection would reveal)
    fairValue: Math.round(bike.base * cond.mult / 10) * 10,
    title,
    description: `${bike.desc} ${pick([
      "Starts right up, idles smooth.", "Could use a tune but solid bones.",
      "Been sitting, will need the usual.", "I don't know much about these, selling for a friend.",
      "Turn key and go. Seriously.", "Needs love. Priced accordingly.",
    ])} ${pick(["Clean title in hand.", "Bill of sale only.", "Title in hand.", "Lost title, BOS only."])}`,
    seller: pick(SELLERS),
    sellerRating: (3.5 + Math.random() * 1.5).toFixed(1),
    location: PlayerLoc.lat != null ? "Near you" : pick(LOCATIONS),
    miles: (PlayerLoc.lat != null ? PlayerLoc.localMiles() : Math.floor(Math.random() * 40)) + " mi away",
    postedAgo: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`,
    fresh: minsAgo < 30,
    photos: 1 + Math.floor(Math.random() * 4),
  };
}

function genListings(n, startId = 0, prevBikeId = null) {
  const out = [];
  for (let i = 0; i < n; i++) {
    let l = makeListing(startId + i);
    // Never put the same bike twice in a row (re-roll up to 5x)
    let tries = 0;
    while (l.bikeId === prevBikeId && tries < 5) {
      l = makeListing(startId + i);
      tries++;
    }
    prevBikeId = l.bikeId;
    out.push(l);
  }
  return out;
}
