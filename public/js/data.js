// Sold As-Is — bike roster & listing generator

const BRANDS = {
  Ronin:   { models: [
    { name: "Wasp",  base: 1400, rarity: 4, sprite: "yamaha_zuma-prebug", desc: "The bug-eyed legend. Pre-2002." },
    { name: "Hopper", base: 650, rarity: 2, sprite: "yamaha_qt50", desc: "Shaft-drive oddball. Charming." },
    { name: "Roadster", base: 900, rarity: 3, sprite: "yamaha_rd50", desc: "Two-stroke screamer in a tiny package." },
    { name: "Trailblazer", base: 750, rarity: 2, sprite: "yamaha_dt50", desc: "Enduro-styled 50. Trail-ready." },
    { name: "Dart", base: 700, rarity: 2, sprite: "yamaha_jog", desc: "The '89 original. Boxy, white, everywhere in Japan." },
    { name: "Zinger", base: 550, rarity: 2, sprite: "yamaha_razz", desc: "Tiny Yamaha two-stroke. Zippier than it has any right to be." },
  ]},
  Kestrel:    { models: [
    { name: "Firebrand", base: 1600, rarity: 4, sprite: "honda_mb5", desc: "The holy grail. Black/red or nothing." },
    { name: "Pixie",     base: 800, rarity: 2, sprite: "honda_dio", desc: "Scooter scene staple. Tunes easy." },
    { name: "Courier",   base: 550, rarity: 2, sprite: "honda_express", desc: "Noped royalty. Everyone's first." },
    { name: "Cubby",     base: 1100, rarity: 3, sprite: "honda_cub_c70", desc: "Step-through icon. Runs forever." },
    { name: "Trunk",     base: 1500, rarity: 4, sprite: "honda_motocompo", desc: "Folding trunk bike. The collector's fever dream." },
    { name: "Crown",     base: 800, rarity: 3, sprite: "honda_elite50", desc: "Honda's little royalty. Smooth, quiet, was everywhere once." },
  ]},
  Vostok:    { models: [
    { name: "Sprinter", base: 450, rarity: 1, sprite: "tomos_sprint", desc: "The workhorse. Parts everywhere." },
    { name: "Targa",    base: 550, rarity: 2, sprite: "tomos_targa_lx", desc: "Top-tank classic. Clean lines." },
    { name: "Standard", base: 400, rarity: 1, sprite: "tomos_st", desc: "Basic, honest, cheap." },
    { name: "Pony",     base: 500, rarity: 2, sprite: "tomos_colt", desc: "Underrated. Snappy motor." },
    { name: "Comet",    base: 850, rarity: 3, sprite: "tomos_golden_bullet", desc: "Black and gold. The Bullet with the good wheels." },
    { name: "Drifter",  base: 950, rarity: 3, sprite: "tomos_streetmate", desc: "The cruiser Tomos. Low, long, and laid back." },
  ]},
  Alpen:     { models: [
    { name: "Max",     base: 500, rarity: 1, sprite: "puch_maxi", desc: "The people's moped. Millions made." },
    { name: "Bigbore", base: 1300, rarity: 4, sprite: "puch_magnum", desc: "Top-tank king. Bring money." },
    { name: "Harbor",  base: 450, rarity: 1, sprite: "puch_newport", desc: "Max's sibling. Same guts." },
    { name: "Viper",   base: 700, rarity: 3, sprite: "puch_cobra", desc: "Rare bird. Weird and wonderful." },
    { name: "Summit",  base: 900, rarity: 3, sprite: "puch_korado", desc: "Piaggio-era Puch. Streamlined and scarce." },
    { name: "Ridge",   base: 1200, rarity: 4, sprite: "puch_magnum_x", desc: "Magnum in dirt clothes. Knobbies and a number plate." },
  ]},
  Dolce:    { models: [
    { name: "Bello",  base: 600, rarity: 2, sprite: "vespa_ciao", desc: "Italian charm, bicycle pedals." },
    { name: "Grosso", base: 750, rarity: 3, sprite: "vespa_grande", desc: "Big Bello energy. Variated." },
    { name: "Sport",  base: 550, rarity: 2, sprite: "vespa_bravo", desc: "The sporty one. Kinda." },
    { name: "Mono",   base: 650, rarity: 2, sprite: "vespa_si", desc: "Monoshock style. Cool factor high." },
    { name: "Volta",  base: 1000, rarity: 3, sprite: "piaggio_nrg", desc: "Liquid-cooled 50 sport scoot. Tuners love it." },
    { name: "Tempesta", base: 900, rarity: 3, sprite: "piaggio_typhoon", desc: "Chunky-tired storm scoot. Built for bad roads." },
  ]},
  Hayate:   { models: [
    { name: "Shuttle", base: 450, rarity: 1, sprite: "suzuki_fa50", desc: "Shaft drive. Weird in a good way." },
    { name: "Junior",  base: 350, rarity: 1, sprite: "suzuki_jr50", desc: "Kids' dirt bike. Tiny ripper." },
    { name: "Outback", base: 500, rarity: 2, sprite: "suzuki_or50", desc: "Moped oddity. Collectors notice." },
    { name: "Metro",   base: 600, rarity: 2, sprite: "suzuki_address50", desc: "Sharp little commuter. All angles, all business." },
    { name: "Tanto",   base: 850, rarity: 3, sprite: "suzuki_katana", desc: "Named for the short blade. Sharp nose, sharper handling." },
  ]},
  Citadelle: { models: [
    { name: "Moby", base: 550, rarity: 2, sprite: "motobecane_50v", desc: "French classic. Variator magic." },
    { name: "88",   base: 650, rarity: 3, sprite: "motobecane_av88", desc: "Vintage French. Beautiful rust." },
    { name: "X",    base: 400, rarity: 1, sprite: "motobecane_moby_x", desc: "Later Moby. Still French." },
    { name: "Circuit", base: 1100, rarity: 4, sprite: "motobecane_sebring", desc: "Top-tank French-American rarity. Stripes for days." },
    { name: "Relic",   base: 1800, rarity: 5, sprite: "motobecane_poney", desc: "1947. A bicycle with a motor and eighty years of patina." },
  ]},
  Toro:    { models: [
    { name: "Variante", base: 600, rarity: 2, sprite: "derbi_variant", desc: "Spanish flair. Reed-valve pep." },
    { name: "Diablo",   base: 500, rarity: 2, sprite: "derbi_ds50", desc: "Sporty 50. Handles great." },
    { name: "Lagoon",   base: 700, rarity: 3, sprite: "derbi_laguna", desc: "Sleek and rare. Head-turner." },
    { name: "Corsa",    base: 1600, rarity: 4, sprite: "derbi_gpr50", desc: "Full-fairing GP replica. A 50 that thinks it's a 125." },
    { name: "Apex",     base: 1500, rarity: 4, sprite: "derbi_gp1", desc: "Open-face GP replica. Predator eyes, race heart." },
  ]},
  Falke:   { models: [
    { name: "Rapier", base: 3000, rarity: 5, sprite: "kreidler_florett_rs", desc: "German precision, chrome tank. The connoisseur's moped." },
  ]},
  Ironwood: { models: [
    { name: "Ember", base: 2800, rarity: 5, sprite: "harley_m50", desc: "Milwaukee's only moped. Italian-built, American-badged." },
  ]},
};

// Flatten to bike list with ids
const BIKES = [];
Object.entries(BRANDS).forEach(([brand, { models }]) => {
  models.forEach((m, i) => BIKES.push({ id: `${brand}-${i}`.replace(/\s/g, ""), brand, ...m }));
});

// ===== Unique models (framework, populated aud204) =====
// One-of-one marques that stand outside the 8 brand sets. In the Collection
// they sit together under a single "Unique" label, and their own milestones
// revolve around them. Every system reading this list (wall group, set
// math, spawn gates, catalog guarantee) keys off these sprite ids.
const UNIQUE_SPRITES = ["kreidler_florett_rs", "harley_m50"];
function isUnique(sprite) { return UNIQUE_SPRITES.includes(sprite); }

// Spawn gates: when a generator roll lands on a Unique, it survives only
// with these probabilities — otherwise the roll re-picks a regular model.
// Uniques are collection trophies, not stock. (Inert while the registry
// is empty: isUnique is false for every sprite in the game.)
const UNIQUE_KEEP = { market: 0.10, parts: 0.05, crate: 0.04 };
function gatedPick(pool, keep) {
  let b = pool[(Math.random() * pool.length) | 0];
  if (b && isUnique(b.sprite) && Math.random() > keep) {
    const reg = pool.filter(x => !isUnique(x.sprite));
    if (reg.length) b = reg[(Math.random() * reg.length) | 0];
  }
  return b;
}

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
  "clean_clara", "deal_dave", "moto_maria", "spareparts_sam", "og_rider_88", "prepper_paul", "bunker_bob", "grandma_dee", "nana_rides", "vintage_vin", "racer_ray74", "forty_bikes_fred", "stackem_sam", "not_his_anymore", "garage_reclaim", "peninsula_motors", "shopkeep_joe", "braaap_brian", "chad_throttle", "torque_tom", "spec_sheet_steve", "cosmic_carl", "mural_marty", "mom_of_three", "linda_sells", "crabpot_carl", "salty_dog_dan", "tinfoil_tim", "offgrid_otto"];

// --- Seller personas -------------------------------------------------------
// Every username is a person, and they haggle like it. The persona drives
// the voice in every negotiation on every platform (bikes and parts alike).
const SELLER_PERSONAS = {
  og_rider_88: "oldtimer", "2stroke_dan": "oldtimer",
  deal_dave: "flipper", scoot_king: "flipper",
  mike_rides: "hobbyist", garage_greg: "hobbyist", moped_mike: "hobbyist",
  barnfind_betty: "purist", clean_clara: "purist", alpen_amy: "purist",
  kestrel_kyle: "kid", rusty_rides: "kid", Eliseo_M: "kid",
  spareparts_sam: "mechanic", moto_maria: "mechanic", dolce_dan: "mechanic", vostok_vic: "mechanic",
  prepper_paul: "doomsday",
  bunker_bob: "doomsday",
  grandma_dee: "grandma",
  nana_rides: "grandma",
  vintage_vin: "racer",
  racer_ray74: "racer",
  forty_bikes_fred: "hoarder",
  stackem_sam: "hoarder",
  not_his_anymore: "divorcee",
  garage_reclaim: "divorcee",
  peninsula_motors: "dealer",
  shopkeep_joe: "dealer",
  braaap_brian: "bro",
  chad_throttle: "bro",
  torque_tom: "engineer",
  spec_sheet_steve: "engineer",
  cosmic_carl: "artist",
  mural_marty: "artist",
  mom_of_three: "mom",
  linda_sells: "mom",
  crabpot_carl: "fisherman",
  salty_dog_dan: "fisherman",
  tinfoil_tim: "conspiracy",
  offgrid_otto: "conspiracy",
};
const PERSONA_IDS = ["oldtimer", "flipper", "hobbyist", "purist", "kid", "mechanic", "doomsday", "grandma", "racer", "hoarder", "divorcee", "dealer", "bro", "engineer", "artist", "mom", "fisherman", "conspiracy"];
function randomPersona() { return PERSONA_IDS[(Math.random() * PERSONA_IDS.length) | 0]; }
function personaOf(seller) { return SELLER_PERSONAS[seller] || "hobbyist"; }

// A counteroffer lives strictly between the standing offer and the seller's
// anchor, on the given step. Returns 0 when the gap is too small to counter
// — the standing offer should simply be accepted instead.
function haggleCounter(offer, anchor, raw, step) {
  let c = Math.round(Math.min(raw, anchor) / step) * step;
  // Rounding can land on or past the anchor (e.g. raw 12.6, anchor 14, step 5
  // rounds to 15) — a counter must stay strictly below it.
  if (c >= anchor) c = Math.floor((anchor - 1) / step) * step;
  if (c <= offer) {
    c = offer + step;
    if (c >= anchor) return 0;
  }
  return c;
}

// --- Haggle dialogue --------------------------------------------------------
// Bands: accept / grudging / counter / firm / reject / block / generous / met
// {O} = the player's offer, {C} = the counter. Lines are written the way
// people actually type at each other on marketplace apps — not ad copy.
const HAGGLE = {
  _recent: [],
  say(persona, band, offer, counter) {
    const mine = (this.PERSONA[persona] || {})[band];
    const shared = this.SHARED[band] || [];
    let pool = shared;
    if (mine && mine.length && (shared.length === 0 || Math.random() < 0.75)) pool = mine;
    let fresh = pool.filter(l => !this._recent.includes(l));
    if (!fresh.length) {
      // Chosen pool is exhausted — borrow the other pool before repeating
      const alt = pool === mine ? shared : (mine || []);
      const altFresh = alt.filter(l => !this._recent.includes(l));
      if (altFresh.length) { pool = alt; fresh = altFresh; }
    }
    if (!fresh.length) fresh = pool;
    if (!fresh.length) return "";
    const line = fresh[(Math.random() * fresh.length) | 0];
    this._recent.push(line);
    if (this._recent.length > 5) this._recent.shift();
    return '"' + line
      .replaceAll("{O}", money(offer))
      .replaceAll("{C}", money(counter == null ? offer : counter)) + '"';
  },
  PERSONA: {
    oldtimer: {
      accept: ["yeah, {O} works. come get it", "{O}. fine. cash", "ok. {O}. you pick it up though, i ain't delivering", "that'll do. {O}", "sold. bring cash and a way to haul it"],
      grudging: ["{O}... alright. don't make a habit of it", "you're wearing me down, son. {O}", "fine. {O}. my loss", "take it for {O} before i think it over", "{O}. ok. but you're loading it yourself"],
      counter: ["{C} is where i'm at", "meet me at {C}. that's fair", "i can do {C}. nothing under", "{C}. had the listing up a day and got six messages already", "come up to {C} and it's yours"],
      firm: ["{C}. price is the price", "i know what i got. {C}", "nope. {C} or i keep it", "{C}. i don't need to sell it", "that's the number. {C}"],
      reject: ["{O}? no.", "son, that's not an offer", "{O} doesn't buy the tires", "come back when you're serious", "i get {O} offers in my sleep. no"],
      block: ["that's enough. goodbye", "we're done here", "don't message me again"],
      generous: ["ah hell. {O}. take it", "you seem like a straight shooter. {O}", "wife wants the space back. {O}, come get it"],
      met: ["there you go. {O}, done", "knew you'd come around. {O}", "{O}. see, that wasn't so hard"],
    },
    flipper: {
      accept: ["{O} works. cash today?", "done. {O}. i can meet after 5", "{O} — deal. no holds though, first cash gets it", "sold at {O}. when you grabbing it", "{O}. good. i got another one coming in anyway"],
      grudging: ["{O}. fine. you're cutting my margin but ok", "ok {O}. i don't sit on inventory", "{O} works. barely. deal", "take it. {O}. priced to move and you moved it", "{O}... my spreadsheet hates this. deal"],
      counter: ["{C}. that's split right down the middle", "i can move at {C}. not below", "{C} cash today and i stop talking to the other guy", "your {O}, my ask — {C} lands it", "{C}. i priced in some room, but not that much room"],
      firm: ["{C}. i know the market on these", "can't. {C} is under what i'd get parting it out", "{C} firm. i've got watchers on this", "no. {C}. these sell", "{C}. final. i don't chase"],
      reject: ["{O} lol no", "i buy at {O}, i don't sell at {O}", "that's a wholesale number. this ain't wholesale", "{O} is a flipper's offer. from one to another: no", "pass. come back with a real number"],
      block: ["blocked. waste someone else's afternoon", "yeah no. we're done", "{O}. conversation's over"],
      generous: ["you know what, {O}. i like movers", "{O}. rather move it than store it", "fine, {O}. quick sale, no drama. respect"],
      met: ["there it is. {O}. deal", "{O}. knew we'd land there", "done at {O}. see how easy that was"],
    },
    hobbyist: {
      accept: ["{O} works! i'll pull it out of the garage", "deal! {O}. you're gonna love it", "{O} — great. i'll throw in the spare plug too", "sounds good, {O}! come by this weekend?", "{O} it is. i'll have the title on the seat"],
      grudging: ["ahh alright, {O}. my wife will be thrilled it's gone either way", "{O}... fine. garage space wins", "ok {O}. too many projects, ask my wife lol", "{O} it is. don't tell her what i paid for it originally", "fine, {O}. you haggled, i folded, let's eat"],
      counter: ["how about {C}? i think that's fair for both of us", "meet me at {C} and i'll help you load it", "{C} and i'll throw in a can of premix", "let's do {C}. just want it going to someone who'll ride it", "i could do {C}. i've seen worse deals at the swap meet"],
      firm: ["{C} is really my bottom — i've got more than that in parts", "can't go below {C}, sorry. the carb alone was $80", "{C}. promised my wife i wouldn't give it away lol", "firm at {C}. ride it and you'll see why", "{C}. i priced it honest, i swear"],
      reject: ["{O}? oof. can't do that, sorry", "ha, no. {O} doesn't cover the tires", "{O} is a no from me. cool that you're looking though", "i appreciate it but {O} is way off"],
      block: ["ok we're done here. good luck out there", "{O}... yeah, i'm gonna end this chat", "i don't block people, but... yeah. we're done"],
      generous: ["you know what — {O}. you seem like you'll actually ride it", "{O}! deal. i like your energy", "my wife literally just texted 'get it gone' so... {O}, it's yours"],
      met: ["perfect, {O}! knew we'd get there", "deal! {O}. see you at pickup", "{O}! and that's how you haggle, folks"],
    },
    purist: {
      accept: ["{O}. fine. take care of her", "ok. {O}. she's a good one — don't hack her up", "{O} works. original paint, keep it that way", "deal at {O}", "{O}. she's yours. treat her right"],
      grudging: ["{O}... alright. promise me you'll actually ride her", "i can't believe i'm saying yes to {O}", "{O}. fine. but no parting her out, seriously", "ok {O}. my heart hurts a little", "{O}. you drive a hard bargain and she deserves better, but ok"],
      counter: ["{C}. she's worth it and we both know it", "i'll meet you at {C}. that's me being reasonable", "{C}. try finding another one this clean", "{C} — the condition speaks for itself", "come up to {C}. you won't regret it"],
      firm: ["{C}. i know exactly what i have", "no. {C}. i'd rather keep her", "{C} firm. they don't make them like this anymore", "i'm not desperate. {C}", "{C}. final. she's not a project, she's a survivor"],
      reject: ["{O}? absolutely not", "you're not the right buyer for her. no", "{O} is an insult to the bike, honestly", "no. she deserves better than {O}"],
      block: ["we're done. she stays with me", "blocked. unbelievable", "{O}. yeah no. goodbye"],
      generous: ["...fine. {O}. i can tell you'll take care of her", "{O}. against my instincts, but ok", "you get it. {O}. she's yours"],
      met: ["{O}. alright. take good care of her", "there. {O}. don't make me regret it", "{O}. done. she picked you, apparently"],
    },
    kid: {
      accept: ["yeah ok {O} lol", "{O} works. can u pick up tmrw", "deal {O}. need it gone before my landlord notices lol", "{O} bet. cash?", "{O} ok done. bring a truck i don't have one"],
      grudging: ["ugh fine {O}", "{O}... ok i need the money anyway lol", "fineee {O}. u win", "{O} i guess. rent is rent", "ok {O} but u pick up today"],
      counter: ["{C} tho?", "meet at {C}?", "i can do {C}. that's like my actual bottom", "{C} and u pick up today?", "bro {C}. please. my car needs an alternator"],
      firm: ["{C} firm sorry", "can't go lower than {C} fr", "{C}. i already dropped it once", "nah {C}. i know what it's worth"],
      reject: ["{O} lol no", "bro {O}??", "that's not even close lol", "{O} buys u the seat maybe", "nahhh {O} is crazy"],
      block: ["blocked lol bye", "yeah we're done", "{O}. ok bye forever"],
      generous: ["u know what {O}. i like u lol", "{O} fine. just want it gone", "deal {O}. don't tell my roommate i went this low lol"],
      met: ["ok {O}. deal lol", "see that wasn't hard. {O}", "{O} done. pickup tmrw?"],
    },
    mechanic: {
      accept: ["{O} works. fresh rings, cleaned carb — you're getting a runner", "deal. {O}. i'll have it idling when you get here", "{O}. fine. paperwork's in the folder", "ok {O}. solid deal for a sorted bike", "{O}. done. she needs nothing"],
      grudging: ["{O}... alright. you're paying for the bike, the labor was free apparently", "{O}. fine. i've got three more on stands anyway", "ok {O}. don't come back asking me to jet it for free though", "{O}. i'll regret this at the parts counter. deal"],
      counter: ["{C}. i've got receipts for the top end alone", "meet at {C}. the work's already done — that's the value", "{C}. carb's rebuilt, new petcock, fresh plug. it's sorted", "i can do {C}. not lower, the parts bill says no", "{C}. you won't find a wrench mark out of place on it"],
      firm: ["{C}. i know what the labor's worth", "no. {C}. i don't sell my work cheap", "{C} firm. find another one with a fresh top end at that price", "{C}. the number's the number", "i'm at {C}. it's worth every dime and i can prove it with receipts"],
      reject: ["{O} doesn't cover the gasket set", "{O}? no. i've got more than that in it", "that's a parts-bike offer on a running bike. no", "{O} lol. no"],
      block: ["we're done here", "{O}. blocked. i don't work for free", "yeah no. goodbye"],
      generous: ["{O}. fine. rather it goes to someone local", "you know your stuff, i can tell. {O}", "{O}. deal. bring cash, i'll throw in the jet kit"],
      met: ["{O}. there we go. sorted", "{O}. good. that's a fair price for good work", "deal at {O}. she'll run for years"],
    },
    doomsday: {
      accept: ["{O}. cash only. you know why", "deal. {O}. meet at the feed store on 101, noon", "{O} works. gold, silver, or cash — kidding. cash", "sold. {O}. i'll wipe my prints off it (joking. mostly)"],
      grudging: ["{O}... fine. when the grid goes down you'll thank me", "ok {O}. you drive a hard bargain for these end times", "{O}. alright. take it before the satellites notice", "fine, {O}. barter economy's coming anyway"],
      counter: ["{C}. and that's in real money, not credits", "meet at {C}. public place. daylight. you understand", "{C}. i've got beans and bandages worth more than your {O}", "i can do {C}. cash. no apps. the apps are a list"],
      firm: ["{C}. when fuel's $9 you'll wish you'd paid it", "{C} firm. i don't haggle with the unprepared", "no. {C}. i can wait out anything. can you?", "{C}. final. the bunker stays stocked either way"],
      reject: ["{O}? that's pre-collapse thinking", "{O} wouldn't buy a bucket of wheat", "no. {O} is an insult and possibly a sting operation", "{O}. are you with the government? because no"],
      block: ["this channel is compromised. goodbye", "blocked. and i'm changing the meeting spot i never told you", "{O}. yeah. we're done here"],
      generous: ["you've got honest eyes. {O}. don't make me regret it", "{O}. fine. tell nobody where you got it", "my wife says i have 'too many supplies'. {O}, take it"],
      met: ["{O}. deal. see you at the place. you know the one (you don't)", "{O}. alright. handshake. no photos", "done at {O}. opsec maintained"]
    },
    grandma: {
      accept: ["{O}? well alright, honey. it's yours", "oh, {O}! wonderful. i'll set out lemonade", "sold, sweetie. {O}. you be careful on it now", "{O}. my Harold would be glad it's going to a nice home"],
      grudging: ["{O}... oh, alright. but you have to promise to wear a helmet", "well... {O}. I suppose. you're a persuasive young person", "{O}. fine, honey. I was going to ask more but you have a kind face", "oh my. {O}. alright. don't tell my bridge club, they said hold firm"],
      counter: ["how about {C}, dear? that's fair, I think", "{C} and I'll include the little basket that goes on front", "let's meet at {C}. I looked it up on the Google and that's the going rate", "{C}, honey. I knitted the seat cover myself, that's worth something"],
      firm: ["{C}, dear. I may be old but I wasn't born yesterday", "no, honey. {C}. Harold kept every receipt in a shoebox", "{C} is my number. firm but with love", "I can't do less than {C}. the bingo ladies need me solvent"],
      reject: ["{O}? oh, honey. no", "now that's just silly. {O}. no", "{O} wouldn't buy the basket, dear", "I've been lowballed by professionals, sweetie. {O} is amateur hour"],
      block: ["well I never. we're done, dear", "blocked, honey. and I bake for this whole street, so. your loss", "goodbye. {O}. honestly"],
      generous: ["you know what, honey — {O}. you remind me of my grandson", "{O}. take it. an old lady doesn't need two", "oh, alright. {O}. come hungry, there's pie"],
      met: ["{O}! there we are, dear. deal", "see? {O}. lovely doing business with you", "{O}. done. I'll wrap the title in a doily"]
    },
    racer: {
      accept: ["{O}! sold. she did 62 on the flats in '89, no lie", "deal at {O}. you're buying a piece of history, kid", "{O}. done. I once outran a state trooper on her. allegedly", "sold. {O}. treat her gentle, she's got stories"],
      grudging: ["{O}... alright. back in my day that buys two of these. inflation's a thief", "fine, {O}. the trophies stay with me though", "{O}. ok. my knees say sell, my heart says keep, knees win", "you haggled a legend down to {O}. hope you're proud"],
      counter: ["{C}. and I'll throw in a story you can't repeat", "meet me at {C}. champions meet in the middle", "{C}. she's timed, tuned, and terrifying at full chat", "come to {C}. I've won races worth less than this bike"],
      firm: ["{C}. I set records on worse money", "{C} firm. the plaque on my wall says I don't fold", "no. {C}. I raced for pinks and never lost her", "{C}. final. champions don't chase"],
      reject: ["{O}? I wouldn't sell my warm-up bike for that", "{O} buys you a photo with it. maybe", "kid, I was beating {O} offers before you were born", "{O}. hilarious. no"],
      block: ["blocked. go race a tricycle", "we're done. {O}. the disrespect", "yeah no. checkered flag, conversation over"],
      generous: ["you've got the look of a rider. {O}", "{O}. fine. one legend to another", "ah, hell. {O}. I like your style"],
      met: ["{O}! deal. now we're talking", "there it is. {O}. champion's handshake", "{O}. done. the legend approves"]
    },
    hoarder: {
      accept: ["{O}... ok. but I have eleven more if this one's not right", "sold. {O}. one down, forty-seven to go", "{O}. fine. don't tell the others I'm letting one go", "deal at {O}. the barn breathes a little easier"],
      grudging: ["{O}... alright. it was behind three others anyway", "fine, {O}. I found it in the stack last spring, I'll find another", "{O}. ok. my therapist says this is progress", "you're getting {O} worth of emotional growth. deal"],
      counter: ["{C}. I've got the space to wait, you know", "meet at {C}. or don't. it'll sit with its brothers", "{C}. I turned down that before. then I bought two more sheds", "how bout {C}. I know it's in there somewhere under the tarps"],
      firm: ["{C}. firm. the collection has standards", "no. {C}. I don't need the money, I need the SPACE, and even then", "{C}. I've said no to better in the rain", "{C}. final. a man and his forty bikes have principles"],
      reject: ["{O}? I'd rather add it to the pile", "{O} doesn't even rent the shed it sleeps in", "no. {O}. I'll bury it in the back with the others first", "{O}. cute. I have a whole section for offers like that. it's called no"],
      block: ["blocked. the collection is closed to you", "we're done. {O}. the bikes saw it too", "goodbye. I'm telling the sheds about you"],
      generous: ["...fine. {O}. take it before I bond with it", "{O}. you caught me on spring cleaning day, a sacred holiday", "take it for {O}. my wife counted the bikes. she COUNTED them"],
      met: ["{O}. deal. now help me pretend this was the plan all along", "there. {O}. one less for the intervention", "{O}. done. the herd thins"]
    },
    divorcee: {
      accept: ["{O}. sold. he bought it during the 'finding himself' phase", "deal! {O}. every dollar is a dollar he doesn't get", "{O}. wonderful. the garage is being reclaimed. by me. for shoes", "sold at {O}. his loss in every sense"],
      grudging: ["{O}... fine. I wanted more just to be petty, but fine", "ok {O}. spite only stretches so far, apparently", "{O}. alright. his golf clubs went cheaper, so. balance", "fine. {O}. the mediator says I have to be 'reasonable'"],
      counter: ["{C}. he paid double that and rode it twice. TWICE", "meet me at {C}. the price includes his regret, free of charge", "{C}. I checked his receipts (all of them) and it's worth it", "{C} and I'll point out the scratch HE put in it. purely for context"],
      firm: ["{C}. I survived a marriage, I can survive this negotiation", "{C} firm. his attorney offered less and I declined that too", "no. {C}. everything must go, but not for nothing", "{C}. final. the decree says sell, it doesn't say fold"],
      reject: ["{O}? my ex offered exactly that as a settlement. I chose the bike", "{O}. no. I've been lowballed by a whole husband, you're not special", "{O} wouldn't cover the therapy. no", "hahaha. {O}. no"],
      block: ["blocked. and unlike him, I mean it", "we're done. {O}. I've ended better arrangements over less", "goodbye. may your offers improve"],
      generous: ["you know what — {O}. you seem stable. I value that now", "{O}! it's yours. quick, before his cousin messages me", "fine, {O}. new chapter, new garage"],
      met: ["{O}. deal. closure looks good on me", "there. {O}. sold and spite-satisfied", "{O}! done. tell him it went to a good home. or don't. don't care"]
    },
    dealer: {
      accept: ["{O}. done. I'll have the paperwork ready — we do this properly", "sold at {O}. shop's open til 6, come sign", "{O} works. invoice, receipt, the whole nine yards", "deal. {O}. thirty years in business, still love a clean sale"],
      grudging: ["{O}... alright. margin's thin but winter's coming", "fine, {O}. my accountant will have words. mostly with me", "{O}. ok. moving units is moving units", "you got me at {O}. the showroom thanks you"],
      counter: ["{C} out the door. that's the number with everything", "I can do {C}. that's wholesale plus a handshake", "meet at {C} and I'll put a fresh plug in it", "{C}. I've sold three this month at that number"],
      firm: ["{C}. I run a business, not a flea market", "{C} firm. the price is the price, it's on the tag", "no. {C}. I have rent on a showroom, friend", "{C}. final. I don't haggle against my own listings"],
      reject: ["{O}? this is a dealership, friend", "{O} doesn't cover my overhead for the day", "no. {O}. I suggest the private sellers down the road", "{O}. I frame lowballs in the breakroom. yours is mid-tier"],
      block: ["we're closed to you. permanently", "blocked. the shop has spoken", "{O}. we're done. the sign says no soliciting and it means you"],
      generous: ["{O}. alright — slow Tuesday, you win", "you know what, {O}. first sale of the day discount. don't quote me", "{O}. deal. I like moving metal more than storing it"],
      met: ["{O}. done. I'll write it up", "there we are. {O}. pleasure doing business", "{O} sold. the paperwork takes five minutes"]
    },
    bro: {
      accept: ["{O}?? DEAL. this thing absolutely RIPS", "sold bro. {O}. you're gonna love the braaap", "{O} done. handshake. firm one. respect", "LETS GO. {O}. pickup before thursday, thursdays are leg day"],
      grudging: ["{O}... fine bro. that stings but ok", "ok {O}. you're lucky I just hit a PR and I'm in a good mood", "{O}. deal. my gains, your bike. equal trade", "fine. {O}. no lowball goes unpunished in the group chat tho"],
      counter: ["{C} bro. that's the sweet spot, trust", "meet me at {C} and I'll show you the wheelie spot", "{C}. she's got new grips. NEW GRIPS bro", "come on, {C}. the thing's a weapon. a tiny, legal weapon"],
      firm: ["{C}. firm like my core, bro", "no. {C}. I don't skip leg day and I don't skip price day", "{C} final. the bike's shredded and so am I", "{C}. respect the number, bro"],
      reject: ["{O}?? bro. BRO.", "{O} is what I spend on protein. no", "nah bro {O} is disrespectful to the braaap", "{O}. my gym bro offered more and he doesn't even ride"],
      block: ["blocked bro. tragic. but necessary", "we're done. {O}. the braaap community will hear of this", "bye bro. may your offers get swoler"],
      generous: ["you know what bro? {O}. I like your vibe", "{O}! for you? done. bring it by the gym sometime", "fine {O}. you caught me post-workout, endorphins are high"],
      met: ["{O}! DEAL. knew you'd get there bro", "there it is. {O}. respect earned", "{O}. done. LEGENDARY haggle"]
    },
    engineer: {
      accept: ["{O}. acceptable. the spreadsheet concurs", "deal at {O}. within 2% of my modeled value. efficient", "{O}. sold. I have the maintenance log, tabulated", "agreed. {O}. I'll include the torque documentation"],
      grudging: ["{O}... my model said no, but the variance is tolerable", "fine. {O}. I've run the numbers and I hate them, but they're numbers", "{O}. ok. depreciation curves are cruel and so are you", "conceded at {O}. this will be reflected in my review of the process"],
      counter: ["{C}. I derived it from three comparables and the manual", "meet at {C}. it's the statistically fair price", "{C}. the carb was rebuilt to factory spec, documentation available", "I can do {C}. per the service manual, that's generous"],
      firm: ["{C}. the math is the math", "no. {C}. emotion is not a currency I accept", "{C} firm. I have receipts organized by date AND category", "{C}. final. further negotiation has diminishing returns"],
      reject: ["{O}? that figure has no basis in reality", "{O} is three standard deviations from serious", "no. I calculated {O} and got an error", "{O}. I respect the attempt. the attempt failed"],
      block: ["this interaction is terminated. blocked", "we're done. your offers are non-compliant", "{O}. goodbye. I've logged this"],
      generous: ["{O}. my model objects, but you've been... precise. deal", "fine. {O}. an anomaly I'll allow", "{O}. sold. you presented data. I respect data"],
      met: ["{O}. exactly the predicted outcome. deal", "there. {O}. converged, as calculated", "{O}. done. an efficient negotiation"]
    },
    artist: {
      accept: ["{O}. sold. her name is Geraldine, by the way", "deal, {O}. the universe provides and so do you", "{O}. she's yours. the paint is lead-free but the vibes are heavy", "ok {O}. I painted her during a storm. she likes you, I can tell"],
      grudging: ["{O}... alright. Geraldine understands. I explained it to her", "fine, {O}. money is a construct and so is my rent, unfortunately", "{O}. ok. the muse demands supplies and the supplies demand money", "you've haggled the stars down to {O}. I hope the cosmos forgives you"],
      counter: ["{C} and I'll sign the tank. it's art now, technically", "meet at {C}. half for the bike, half for the aura", "{C}. she was in a gallery once. a garage gallery. still counts", "I feel {C} in my spirit. the spirit is rarely wrong"],
      firm: ["{C}. the vision doesn't discount", "no. {C}. I've turned down gallery money (there was none, but still)", "{C} firm. creativity appreciates, friend", "{C}. final. Geraldine has spoken through me"],
      reject: ["{O}? Geraldine is offended and she's a motorcycle", "{O} wouldn't buy the paint I used. it was expensive paint", "no. the cosmos says no to {O}", "{O}. I astral-projected a better offer than that once"],
      block: ["blocked. the energy was rancid", "we're done. Geraldine doesn't know you anymore", "{O}. goodbye. I'm smudging this chat"],
      generous: ["{O}. the moon is right and so are you. deal", "take her for {O}. she chose you, I just held the keys", "{O}! sold. the stars demanded a discount and who am I to argue"],
      met: ["{O}. the prophecy is fulfilled. deal", "there. {O}. Geraldine approves", "{O}. done. beautiful energy all around"]
    },
    mom: {
      accept: ["{O}? oh wonderful. my son said 'just sell it mom' and here we are", "sold! {O}. you'll have to explain to me how the money part works", "{O}. deal. it was taking up the whole side of the garage", "oh good, {O}. I was so tired of working around it"],
      grudging: ["{O}... alright. my son said don't take the first offer but he also doesn't call, so", "fine, {O}. he owes me for the storage anyway. years of it", "{O}. ok. I just want it gone before the HOA meeting", "you seem nice. {O}. my son can have his feelings about it later"],
      counter: ["how about {C}? my neighbor's son said that's fair and he works at a bank", "{C}. I looked some things up. I printed them out", "meet at {C}? I don't know much about these but I know my garage", "{C} and I'll throw in his old helmet. he left everything, honestly"],
      firm: ["{C}. my son may not call but he did text 'don't go below that mom'", "{C} firm. I raised three kids, I can hold a price", "no, dear. {C}. the bingo group coached me", "{C}. final. I have bridge at 4"],
      reject: ["{O}? oh, I don't think so", "{O} is less than the shoes he left here. no", "no. even I know {O} is silly, and I thought the carburetor was a radio part", "{O}. my son taught me the word 'lowball' specifically for this"],
      block: ["blocked. my son will hear about this", "we're done. {O}. I'm telling the neighborhood watch", "goodbye. I don't sell to people who offer {O}"],
      generous: ["{O}? oh, alright. you seem like a good kid", "take it for {O}. just get it out of my garage before Sunday dinner", "{O}. deal. come round the side gate, the dog is dramatic"],
      met: ["{O}! deal. see, I CAN do this", "there! {O}. my son is going to be so surprised I negotiated", "{O}. done. I did it. I sold a motorcycle on the internet"]
    },
    fisherman: {
      accept: ["{O}. sold. tide's turning, come before the ramp gets busy", "deal at {O}. she's steadier than my boat, honestly", "{O}. done. I got crab pots to pull and you're holding a good bike", "{O} works. cash at the dock. I mean driveway"],
      grudging: ["{O}... alright. fuel prices being what they are", "fine, {O}. the ocean takes my money, now you too", "{O}. ok. my boat needs a new impeller and apparently so does my life", "you got me at {O}. same way the fog gets the harbor. slowly"],
      counter: ["{C}, and that's dock price, friend", "meet at {C}. half my money's in the water anyway, join it", "{C}. she runs like a kicker motor on a calm morning", "I can do {C}. weather's fair, price is too"],
      firm: ["{C}. I've waited out storms longer than this negotiation", "{C} firm. the sea doesn't haggle and neither do I", "no. {C}. I can sit on it till the salmon run", "{C}. final. take it or the tide takes us both"],
      reject: ["{O}? that's bait money, not bike money", "{O} wouldn't fill my tanks. either of them", "no. I've thrown back better offers than {O}", "{O}. landlubber numbers"],
      block: ["blocked. back to port with you", "we're done. {O}. the harbor has rules", "goodbye. may your offers find better waters"],
      generous: ["{O}. fine. you caught me with a full trap and a full heart", "take it for {O}. a good bike's like a good tide. don't waste it", "{O}. deal. you have a sailor's honesty"],
      met: ["{O}. there she blows. deal", "{O}. done. smooth sailing", "{O} sold. may she carry you like a following sea"]
    },
    conspiracy: {
      accept: ["{O}. deal. we never met. delete this chat (don't, I can't do it for you)", "sold, {O}. meet where we discussed. we didn't discuss. you know where", "{O}. fine. cash, obviously. for reasons", "ok {O}. I'll be the one by the old payphone. the payphone thing is a whole story"],
      grudging: ["{O}... the numbers allow it. fine", "ok {O}. I ran this through the version of my brain I trust", "{O}. alright. they WANT me to sell it, which is why I almost didn't", "fine. {O}. but if a drone flies over during pickup, the deal's off"],
      counter: ["{C}. and going forward we keep messages short. you know why", "meet at {C}. location undisclosed (it's my driveway. 4pm)", "{C}. they undervalue these on purpose. wake up", "I counter {C}. the manuals they don't let you read say that's fair"],
      firm: ["{C}. I don't fold. folding is what they expect", "{C} firm. I've sat on better prices for longer", "no. {C}. the price is the price, in this timeline anyway", "{C}. final. my sources confirm"],
      reject: ["{O}? that's exactly what a fed would offer", "{O}. suspiciously round. no", "no. {O} has been flagged by my systems (a notebook)", "{O}?? nice try, agencies"],
      block: ["blocked. this account is burned", "we're done. {O}. I'm changing my name (to another username)", "goodbye. forget you saw this listing"],
      generous: ["{O}. you type like a human. a real one. deal", "{O}. fine. my storage has two of everything except patience", "take it for {O}. if anyone asks, it was always yours"],
      met: ["{O}. convergence confirmed. deal", "there. {O}. exactly as predicted (by me, just now)", "{O}. done. a pleasure, citizen"]
    },
  },
  SHARED: {
    accept: ["{O}? yeah, i can do that", "{O} — deal. when can you pick up", "you got it for {O}", "done at {O}. cash talks", "{O} works. it's yours", "sold at {O}. come get it before i change my mind"],
    grudging: ["hmm... {O}. alright, it's yours", "{O}? fine. you drive a hard bargain", "i was hoping for more, but {O} — sold", "okay okay, {O}. don't tell my wife", "{O}. ugh. fine. i need the space anyway", "you're killing me. {O} — deal"],
    counter: ["{O}? i could do {C}", "nah, but i'll meet you at {C}", "{C} and we shake on it", "split the difference — {C}", "{C}. meet me halfway and it's done", "i can do {C}. that's my middle ground"],
    firm: ["{O}? come on. {C} and we've got a deal", "i can't do {O}. {C} is my floor", "look, i need {C} out of this. that's already a steal", "{C}. i've had other people ask about this one", "my bottom dollar is {C}. i won't budge"],
    reject: ["{O}?? no lowballs, come on", "{O}? be serious", "{O} wouldn't buy the seat. try again", "lol. {O}. good one", "i'm gonna pretend you didn't send {O}", "{O}? what is this, a yard sale"],
    block: ["{O}?? yeah, we're done here", "get out of my messages with that {O} nonsense", "{O}. blocked", "i'd rather keep it than sell it for {O}. blocked", "blocked. go lowball someone with less patience"],
    generous: ["you know what? {O} — it's yours", "ah hell, i like you. {O} and we skip the dance", "fine — {O}. i was tired of looking at the listing anyway", "you messaged like a human instead of a bot. {O}, deal"],
    met: ["deal. {O}. knew we'd get there", "{O} — there we go. done", "ok, {O}. that's the number. sold"],
  },
};

// Real Olympic Peninsula towns with road distances from Port Angeles, WA
const LOCAL_TOWNS = [
  ["Port Angeles, WA", 0], ["Agnew, WA", 8], ["Carlsborg, WA", 12],
  ["Joyce, WA", 15], ["Sequim, WA", 17], ["Blyn, WA", 20],
  ["Diamond Point, WA", 25], ["Chimacum, WA", 28], ["Port Hadlock, WA", 30],
  ["Gardiner, WA", 32], ["Port Townsend, WA", 35], ["Nordland, WA", 36],
  ["Beaver, WA", 40], ["Marrowstone, WA", 41], ["Sappho, WA", 45],
  ["Quilcene, WA", 46], ["Clallam Bay, WA", 50], ["Forks, WA", 55],
  ["Brinnon, WA", 57], ["Sekiu, WA", 62], ["Poulsbo, WA", 63],
  ["Silverdale, WA", 66], ["La Push, WA", 70], ["Neah Bay, WA", 72],
  ["Bremerton, WA", 75], ["Hoodsport, WA", 78], ["Port Orchard, WA", 82],
  ["Shelton, WA", 90], ["Olympia, WA", 108], ["Tacoma, WA", 112],
];



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
  // [pristine, used_good, used_bad, totaled, missing] — pristine is rare, rough bikes lose parts
  "Mint":       [0.15, 0.50, 0.30, 0.05, 0.00],
  "Clean":      [0.10, 0.45, 0.35, 0.10, 0.00],
  "Good":       [0.05, 0.40, 0.40, 0.13, 0.02],
  "Fair":       [0.03, 0.30, 0.47, 0.15, 0.05],
  "Rough":      [0.01, 0.15, 0.54, 0.20, 0.10],
  "Non-runner": [0.00, 0.10, 0.50, 0.25, 0.15],
  "Parts bike": [0.00, 0.05, 0.35, 0.40, 0.20],
};
const PART_STATES = ["pristine", "used_good", "used_bad", "totaled", "missing"];

// Recalculate a bike's fair value from its condition and base value
function recalcFairValue(bike) {
  if (!bike || !bike.baseValue) return;
  const cond = (typeof CONDITIONS !== "undefined")
    ? CONDITIONS.find(c => c.name === bike.condition)
    : null;
  let mult = cond ? cond.mult : 1.0;
  // Repainted cap (market model): a bike the player built UP past the
  // condition it was bought in sells as a repaint, not an original — its
  // value multiple caps at Clean (1.15), never the Mint 1.35. Bikes born
  // at their condition are untouched; no bornCond snapshot = no cap.
  if (bike.bornCond && cond) {
    const bornIdx = CONDITIONS.findIndex(c => c.name === bike.bornCond);
    const curIdx = CONDITIONS.findIndex(c => c.name === cond.name);
    if (bornIdx >= 0 && curIdx >= 0 && curIdx < bornIdx) mult = Math.min(mult, 1.15);
  }
  const missingCount = bike.partStates
    ? Object.values(bike.partStates).filter(s => s === "missing").length
    : 0;
  bike.fairValue = Math.round(bike.baseValue * mult * Math.pow(0.92, missingCount) / 5) * 5;
  // NOS showpiece premium: the market pays something for factory-sealed parts on a bike,
  // but never full dealer retail — half the premium over pristine value
  if (bike.partStates) {
    let nosBonus = 0;
    for (const [k, s] of Object.entries(bike.partStates)) {
      if (s === "nos") nosBonus += (PART_BASE_PRICE[k] || 0) * (CRATE_PREMIUM - 1.0) * 0.5;
    }
    if (nosBonus) bike.fairValue += Math.round(nosBonus / 5) * 5;
  }
}

// Calculate a bike's overall condition from its individual part states.
// Critical parts (engine) weigh heavily — a shot engine caps the bike at Non-runner.
function calcBikeCondition(partStates, sprite) {
  if (!partStates) return "Good";
  const weights = {
    engine: 4, wheel_front: 2, wheel_rear: 2, exhaust: 1.5,
    fuel_tank: 1, headlight: 0.5, handlebars: 1, turn_signals: 0.5,
  };
  const scores = { pristine: 100, nos: 100, used_good: 75, used_bad: 40, totaled: 10, missing: 0 };
  let totalWeight = 0, weightedSum = 0;
  let worstCritical = 100;

  const parts = sprite ? availableParts(sprite) : Object.keys(partStates).map(k => ({ key: k }));
  for (const p of parts) {
    const key = p.key || p;
    const st = partStates[key] || "pristine";
    const w = weights[key] || 1;
    const score = scores[st] ?? 50;
    weightedSum += score * w;
    totalWeight += w;
    // Engine is critical — track its worst state
    if (key === "engine" && score < worstCritical) worstCritical = score;
  }

  if (totalWeight === 0) return "Good";
  let avg = weightedSum / totalWeight;

  // Critical part caps: shot/missing engine drags the whole bike down
  if (worstCritical <= 10) avg = Math.min(avg, 25);  // totaled/missing engine
  else if (worstCritical <= 40) avg = Math.min(avg, 45); // worn engine

  if (avg >= 90) return "Mint";
  if (avg >= 75) return "Clean";
  if (avg >= 60) return "Good";
  if (avg >= 40) return "Fair";
  if (avg >= 20) return "Rough";
  if (avg >= 10) return "Non-runner";
  return "Parts bike";
}
const PART_STATE_LABEL = { pristine: "Pristine", used_good: "Good", used_bad: "Worn", totaled: "Shot", missing: "Missing", nos: "NOS" };

// Condition % → state mapping (0-100)
function pctToState(pct) {
  if (pct >= 90) return "pristine";
  if (pct >= 70) return "used_good";
  if (pct >= 40) return "used_bad";
  return "totaled";
}
// Default % for a given state (midpoint of its band)
function stateToPct(state) {
  return { pristine: 95, used_good: 80, used_bad: 55, totaled: 20, nos: 100 }[state] ?? 50;
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
  // Worse condition = more expensive, but cheaper overall: 0.8x at 25% → 0.45x at 69%
  const mult = 0.8 - (pct / 200);
  return Math.max(3, Math.round(base * mult));
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
    for (let i = 0; i < 5; i++) { acc += dist[i]; if (r <= acc) { state = PART_STATES[i]; break; } }
    states[p.key] = state;
  }
  return states;
}

function partImg(sprite, partKey, state) {
  if (state === "missing") return null; // no image — part isn't there
  // Map game sprite names to parts folder names (zuma uses underscore)
  const folder = sprite.replace(/-/g, "_");
  const suffix = (state === "pristine" || state === "nos") ? "" : "_" + state;
  return `assets/bikes/parts/${folder}/${partKey}${suffix}.png`;
}

// ---------- parts shop ----------
const PART_BASE_PRICE = {
  engine: 220, exhaust: 90, wheel_front: 70, wheel_rear: 70,
  fuel_tank: 80, headlight: 45, handlebars: 35, turn_signals: 25,
};
const PART_COND_MULT = { pristine: 1.0, used_good: 0.55, used_bad: 0.28, totaled: 0.1, nos: 1.65 };

// Crate Fresh — NOS dealer pricing: fixed premium over base, rounded to $5 (printed MSRP, no jitter)
const CRATE_PREMIUM = 1.65;
function cratePriceFor(partKey) {
  return Math.max(10, Math.round((PART_BASE_PRICE[partKey] || 20) * CRATE_PREMIUM / 5) * 5);
}
// Crate Fresh stock: finite NOS parts, spread across bikes like the Boneyard guarantee
function genCrateStock(n = 12) {
  const out = [];
  let idc = 0;
  const mk = (bike) => {
    const avail = availableParts(bike.sprite);
    const part = avail[(Math.random() * avail.length) | 0];
    out.push({
      id: idc++, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
      partKey: part.key, partLabel: part.label, state: "nos",
      stateLabel: PART_STATE_LABEL.nos,
      price: cratePriceFor(part.key), wasPrice: null, watchers: 0,
      img: partImg(bike.sprite, part.key, "pristine"),
      listingType: "bin", seller: "Crate Fresh",
    });
  };
  const shuffled = [...BIKES].sort(() => Math.random() - 0.5);
  for (const bike of shuffled) {
    if (out.length >= n) break;
    // The Crate Fresh shelf almost never holds a Unique part
    if (isUnique(bike.sprite) && Math.random() > UNIQUE_KEEP.crate) continue;
    mk(bike);
  }
  while (out.length < n) mk(gatedPick(BIKES, UNIQUE_KEEP.crate));
  return out;
}

const BIDDER_NAMES = ["moped_mike", "rusty_rider", "carb_king", "two_stroke_tom",
  "barnfind_betty", "alpen_amy", "dolce_vince", "throttle_jockey", "grease_monkey",
  "scoot_scoot", "wrench_wendy", "piston_paul"];

function genPartsShop(n = 16) {
  const out = [];
  let idc = 0;
  const mkPart = (bike) => {
    const avail = availableParts(bike.sprite);
    const part = avail[(Math.random() * avail.length) | 0];
    // Randomize condition — pristine is rare on the Boneyard, NOS is an event
    const roll = Math.random();
    const state = roll < 0.007 ? "nos"
      : roll < 0.08 ? "pristine"
      : roll < 0.40 ? "used_good"
      : roll < 0.75 ? "used_bad"
      : "totaled";
    let price, watchers, wasPrice;
    if (state === "nos") {
      // Flipper listing: someone bought a NOS part to resell it — dealer price plus markup
      price = Math.round(cratePriceFor(part.key) * (1.15 + Math.random() * 0.2));
      watchers = 18 + ((Math.random() * 22) | 0);
      wasPrice = null;
    } else {
      price = Math.max(5, Math.round(PART_BASE_PRICE[part.key] * PART_COND_MULT[state] * (0.85 + Math.random() * 0.3)));
      // eBay flavor: watchers + strikethrough "was" price
      watchers = 1 + ((Math.random() * 14) | 0);
      wasPrice = Math.random() < 0.4 ? Math.round(price * (1.1 + Math.random() * 0.25)) : null;
    }
    const item = {
      id: idc++, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
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
  };
  // Guarantee: at least 1 random part per bike model — except Uniques,
  // whose parts are trophy-rare in the Boneyard (gated, never guaranteed)
  [...BIKES].sort(() => Math.random() - 0.5).forEach(bike => {
    if (isUnique(bike.sprite) && Math.random() > UNIQUE_KEEP.parts) return;
    mkPart(bike);
  });
  // Eliseo_M lists parts randomly like anyone else (~5% per item)
  for (const item of out) {
    if (Math.random() < 0.05) { item.seller = "Eliseo_M"; item.isDanny = true; }
  }
  // Fill remaining slots with random bikes (if n > bike count)
  const extra = Math.max(0, n - BIKES.length);
  for (let i = 0; i < extra; i++) {
    mkPart(gatedPick(BIKES, UNIQUE_KEEP.parts));
  }
  for (const it of out) it.persona = randomPersona();
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
  const bike = gatedPick(BIKES, UNIQUE_KEEP.market);
  const cond = pickWeighted(CONDITIONS, "weight");
  // Price: base * condition * (0.85–1.25 noise) — sometimes a deal, sometimes overpriced
  const dealFactor = 0.85 + Math.random() * 0.4;
  const price = Math.round(bike.base * cond.mult * dealFactor / 10) * 10;
  const minsAgo = Math.floor(Math.random() * 600) + 2;
  const partStates = rollPartStates(cond.name, bike.sprite);
  // Recalculate true condition from parts (may differ from rolled condition)
  const trueCond = calcBikeCondition(partStates, bike.sprite);
  const trueCondObj = CONDITIONS.find(c => c.name === trueCond) || cond;
  // Title uses TRUE condition so it matches the description
  // Tags are filtered to not contradict the condition
  const badConds = ["parts bike", "non-runner"];
  const isBad = badConds.some(bc => trueCond.toLowerCase().includes(bc));
  const goodTags = TAGS.filter(t => {
    const tl = t.toLowerCase();
    if (isBad && ["runs great", "runs gr8", "fresh top end", "just serviced", "new tires"].some(g => tl.includes(g))) return false;
    if (!isBad && ["needs carb work", "project bike", "ran when parked"].some(b => tl.includes(b))) return false;
    return true;
  });
  const tag = pick(goodTags.length ? goodTags : TAGS);
  const title = pick(TITLES).replace("{bike}", `${bike.brand} ${bike.name}`)
    .replace("{cond}", trueCond.toLowerCase()).replace("{tag}", tag);
  // Each missing part knocks ~8% off fair value
  const missingCount = Object.values(partStates).filter(s => s === "missing").length;
  const fairValue = Math.round(bike.base * trueCondObj.mult * Math.pow(0.92, missingCount) / 10) * 10;
  return {
    id, bikeId: bike.id, brand: bike.brand, model: bike.name,
    sprite: bike.sprite,
    baseValue: bike.base, rarity: bike.rarity,
    condition: trueCond, price,
    partStates,
    // fair value estimate (what inspection would reveal)
    fairValue,
    title,
    description: `${bike.desc} ${(() => {
      const tc = trueCond.toLowerCase();
      // Condition-matched flavor lines — no more "starts right up" on a rough bike
      if (tc.includes("mint") || tc.includes("clean")) {
        return pick([
          "Starts right up, idles smooth.", "Turn key and go. Seriously.",
          "Garage kept, adult owned. Meticulous.",
          "Just serviced, ready to ride home today.",
        ]);
      } else if (tc.includes("good")) {
        return pick([
          "Could use a tune but solid bones.", "Runs strong, just cosmetic wear.",
          "Daily rider. Starts every time.",
        ]);
      } else if (tc.includes("fair")) {
        return pick([
          "Been sitting, will need the usual.", "Needs love. Priced accordingly.",
          "Runs but rough around the edges. Honest bike.",
        ]);
      } else if (tc.includes("rough")) {
        return pick([
          "Ran when parked. Been sitting a while.", "Project bike, priced to move.",
          "Needs work — engine turns over but won't catch.",
          "As-is special. Bring a truck and a dream.",
        ]);
      } else { // non-runner, parts bike
        return pick([
          "Does not run. Selling as a parts bike.", "Blown motor. Good bones for parts.",
          "I don't know much about these, selling for a friend.",
          "Roller — no engine. Everything else is there.",
        ]);
      }
    })()} ${pick(["Clean title in hand.", "Bill of sale only.", "Title in hand.", "Lost title, BOS only."])}`,
    seller: pick(SELLERS),
    sellerRating: (3.5 + Math.random() * 1.5).toFixed(1),
    ...(() => { const t = pickTown(); return { location: t.town, miles: t.miles }; })(),
    postedAgo: minsAgo < 60 ? `${minsAgo}m ago` : `${Math.floor(minsAgo / 60)}h ago`,
    fresh: minsAgo < 30,
    photos: 1 + Math.floor(Math.random() * 4),
  };
}

// Eliseo_M — Garrett's brother. Always has one listing in each shop. Pure homage.
function makeDannyListing(id) {
  const l = makeListing(id);
  l.seller = "Eliseo_M";
  l.sellerRating = (4.8 + Math.random() * 0.2).toFixed(1);
  l.location = "Sequim";
  l.miles = (8 + Math.floor(Math.random() * 5)) + " mi";
  l.isDanny = true;
  return l;
}

function makeDannyPart(id) {
  const bike = gatedPick(BIKES, UNIQUE_KEEP.parts);
  const avail = availableParts(bike.sprite);
  const part = avail[(Math.random() * avail.length) | 0];
  const roll = Math.random();
  const state = roll < 0.08 ? "pristine"
    : roll < 0.40 ? "used_good"
    : roll < 0.75 ? "used_bad"
    : "totaled";
  const price = Math.max(5, Math.round(PART_BASE_PRICE[part.key] * PART_COND_MULT[state] * (0.85 + Math.random() * 0.3)));
  return {
    id, bikeBrand: bike.brand, bikeModel: bike.name, bikeSprite: bike.sprite,
    partKey: part.key, partLabel: part.label, state,
    stateLabel: PART_STATE_LABEL[state],
    price, wasPrice: null, watchers: 1 + ((Math.random() * 10) | 0),
    img: partImg(bike.sprite, part.key, state),
    listingType: "bin",
    seller: "Eliseo_M", isDanny: true,
  };
}

function pickTown() {
  const [town, dist] = LOCAL_TOWNS[Math.floor(Math.random() * LOCAL_TOWNS.length)];
  // Add a little jitter so distances feel natural (±3 mi)
  const jittered = Math.max(1, dist + Math.floor(Math.random() * 7) - 3);
  return { town, miles: jittered + " mi" };
}

function genListings(n, startId = 0, prevBikeId = null) {
  const out = [];
  for (let i = 0; i < n; i++) {
    // Eliseo_M shows up randomly like any other seller (~6% per listing)
    let l = Math.random() < 0.06 ? makeDannyListing(startId + i) : makeListing(startId + i);
    // Never put the same bike twice in a row (re-roll up to 5x)
    let tries = 0;
    while (l.bikeId === prevBikeId && tries < 5) {
      l = makeListing(startId + i);
      tries++;
    }
    prevBikeId = l.bikeId;
    out.push(l);
  }
  for (const l of out) if (!l.isDanny) l.persona = randomPersona();
  return out;
}
