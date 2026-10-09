// Sold As-Is — bike roster & listing generator

const BRANDS = {
  Yamaha:   { models: [
    { name: "Zuma Prebug",  base: 1400, rarity: 4, sprite: "yamaha_zuma-prebug", desc: "The bug-eyed legend. Pre-2002." },
    { name: "QT50 Yamahopper", base: 650, rarity: 2, sprite: "yamaha_qt50", desc: "Shaft-drive oddball. Charming." },
    { name: "RD50", base: 900, rarity: 3, sprite: "yamaha_rd50", desc: "Two-stroke screamer in a tiny package." },
    { name: "DT50", base: 750, rarity: 2, sprite: "yamaha_dt50", desc: "Enduro-styled 50. Trail-ready." },
  ]},
  Honda:    { models: [
    { name: "MB5",     base: 1600, rarity: 4, sprite: "honda_mb5", desc: "The holy grail. Black/red or nothing." },
    { name: "Dio",     base: 800, rarity: 2, sprite: "honda_dio", desc: "Scooter scene staple. Tunes easy." },
    { name: "Express", base: 550, rarity: 2, sprite: "honda_express", desc: "Noped royalty. Everyone's first." },
    { name: "Cub C70", base: 1100, rarity: 3, sprite: "honda_cub_c70", desc: "Step-through icon. Runs forever." },
  ]},
  Tomos:    { models: [
    { name: "Sprint",   base: 450, rarity: 1, sprite: "tomos_sprint", desc: "The workhorse. Parts everywhere." },
    { name: "Targa LX", base: 550, rarity: 2, sprite: "tomos_targa_lx", desc: "Top-tank Tomos. Clean lines." },
    { name: "ST",       base: 400, rarity: 1, sprite: "tomos_st", desc: "Basic, honest, cheap." },
    { name: "Colt",     base: 500, rarity: 2, sprite: "tomos_colt", desc: "Underrated. Snappy A55 motor." },
  ]},
  Puch:     { models: [
    { name: "Maxi",    base: 500, rarity: 1, sprite: "puch_maxi", desc: "The people's moped. Millions made." },
    { name: "Magnum",  base: 1300, rarity: 4, sprite: "puch_magnum", desc: "Top-tank king. Bring money." },
    { name: "Newport", base: 450, rarity: 1, sprite: "puch_newport", desc: "Maxi's sibling. Same guts." },
    { name: "Cobra",   base: 700, rarity: 3, sprite: "puch_cobra", desc: "Rare bird. Weird and wonderful." },
  ]},
  Vespa:    { models: [
    { name: "Ciao",   base: 600, rarity: 2, sprite: "vespa_ciao", desc: "Italian charm, bicycle pedals." },
    { name: "Grande", base: 750, rarity: 3, sprite: "vespa_grande", desc: "Big Ciao energy. Variated." },
    { name: "Bravo",  base: 550, rarity: 2, sprite: "vespa_bravo", desc: "The sporty one. Kinda." },
    { name: "Si",     base: 650, rarity: 2, sprite: "vespa_si", desc: "Monoshock style. Cool factor high." },
  ]},
  Suzuki:   { models: [
    { name: "FA50 Shuttle", base: 450, rarity: 1, sprite: "suzuki_fa50", desc: "Shaft drive. Weird in a good way." },
    { name: "JR50",         base: 350, rarity: 1, sprite: "suzuki_jr50", desc: "Kids' dirt bike. Tiny ripper." },
    { name: "OR50",         base: 500, rarity: 2, sprite: "suzuki_or50", desc: "Moped oddity. Collectors notice." },
  ]},
  Motobecane: { models: [
    { name: "50V Mobylette", base: 550, rarity: 2, sprite: "motobecane_50v", desc: "French classic. Variator magic." },
    { name: "AV88",          base: 650, rarity: 3, sprite: "motobecane_av88", desc: "Vintage French. Beautiful rust." },
    { name: "Moby X",        base: 400, rarity: 1, sprite: "motobecane_moby_x", desc: "Later Moby. Still French." },
  ]},
  Derbi:    { models: [
    { name: "Variant", base: 600, rarity: 2, sprite: "derbi_variant", desc: "Spanish flair. Reed-valve pep." },
    { name: "DS50",    base: 500, rarity: 2, sprite: "derbi_ds50", desc: "Sporty 50. Handles great." },
    { name: "Laguna",  base: 700, rarity: 3, sprite: "derbi_laguna", desc: "Sleek and rare. Head-turner." },
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
  "garage_greg", "puch_pete", "vespa_vic", "tomos_tom", "honda_hank", "rusty_rides",
  "clean_clara", "deal_dave", "moto_maria", "spareparts_sam", "og_rider_88"];

const LOCATIONS = ["Portland, OR", "Austin, TX", "Chicago, IL", "Denver, CO", "Seattle, WA",
  "Nashville, TN", "Phoenix, AZ", "Columbus, OH", "Minneapolis, MN", "Sacramento, CA"];

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
  "Mint":       [0.90, 0.10, 0.00, 0.00],
  "Clean":      [0.70, 0.25, 0.05, 0.00],
  "Good":       [0.45, 0.40, 0.15, 0.00],
  "Fair":       [0.20, 0.45, 0.30, 0.05],
  "Rough":      [0.05, 0.25, 0.50, 0.20],
  "Non-runner": [0.00, 0.15, 0.55, 0.30],
  "Parts bike": [0.00, 0.05, 0.35, 0.60],
};
const PART_STATES = ["pristine", "used_good", "used_bad", "totaled"];
const PART_STATE_LABEL = { pristine: "Pristine", used_good: "Good", used_bad: "Worn", totaled: "Shot" };

function rollPartStates(condition) {
  const dist = PART_DIST[condition] || PART_DIST["Good"];
  const states = {};
  for (const p of PARTS) {
    const r = Math.random();
    let acc = 0, state = "pristine";
    for (let i = 0; i < 4; i++) { acc += dist[i]; if (r <= acc) { state = PART_STATES[i]; break; } }
    states[p.key] = state;
  }
  return states;
}

function partImg(sprite, partKey, state) {
  const suffix = state === "pristine" ? "" : "_" + state;
  return `assets/parts/${sprite}/${partKey}${suffix}.png`;
}

// ---------- parts shop ----------
const PART_BASE_PRICE = {
  engine: 220, exhaust: 90, wheel_front: 70, wheel_rear: 70,
  fuel_tank: 80, headlight: 45, handlebars: 35, turn_signals: 25,
};
const PART_COND_MULT = { pristine: 1.0, used_good: 0.55, used_bad: 0.28, totaled: 0.1 };

function genPartsShop(n = 12) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const bike = BIKES[(Math.random() * BIKES.length) | 0];
    const part = PARTS[(Math.random() * PARTS.length) | 0];
    // Weighted toward used conditions for a parts store vibe
    const roll = Math.random();
    const state = roll < 0.15 ? "pristine" : roll < 0.5 ? "used_good" : roll < 0.85 ? "used_bad" : "totaled";
    const price = Math.max(5, Math.round(PART_BASE_PRICE[part.key] * PART_COND_MULT[state] * (0.85 + Math.random() * 0.3)));
    out.push({
      id: i, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
      partKey: part.key, partLabel: part.label, state,
      stateLabel: PART_STATE_LABEL[state],
      price, img: partImg(bike.sprite, part.key, state),
    });
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
    partStates: rollPartStates(cond.name),
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
    location: pick(LOCATIONS),
    miles: Math.floor(Math.random() * 40) + " mi",
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
