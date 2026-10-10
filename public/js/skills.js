// Sold As-Is — Skill System
// All tunable numbers live in SKILLS_CONFIG for easy balancing.

const SKILLS_CONFIG = {
  // XP
  xpPerDollarProfit: 1,        // XP gained per $1 of profit

  // Skill point thresholds: point N costs (base + (N-1) * step) cumulative XP
  // Point 1 at 500, point 2 at 500+1000=1500 total, point 3 at 1500+1500=3000, etc.
  pointBaseXP: 500,            // XP needed for first skill point
  pointStepXP: 500,            // each subsequent point costs this much more

  // Tier costs (skill points)
  tierCosts: [1, 2, 3],        // tier 1 costs 1pt, tier 2 costs 2pts, tier 3 costs 3pts

  // Smooth Talker: haggling bonuses
  smoothTalkerDiscount: [0, 0.05, 0.10, 0.15],  // index by tier (0 = untrained)

  // Browser Extension: parts site discounts
  browserExtDiscount: [0, 0, 0.05, 0.10],       // index by tier
};

const SKILL_DEFS = [
  {
    id: "gearhead",
    name: "Gear Head",
    icon: "gear",
    desc: "See through a seller's lies. Reveals part conditions on marketplace listings — otherwise they're hidden until you buy and inspect in your garage.",
    tiers: [
      "Listings show condition labels (Poor / Fair / Good / Mint).",
      "Listings show exact condition percentage.",
      "Also flags parts worth a closer look in the garage.",
    ],
  },
  {
    id: "smoothtalker",
    name: "Smooth Talker",
    icon: "chat",
    desc: "Talk your way to better deals.",
    tiers: [
      "Unlock haggling: counteroffers, up to 5% better prices.",
      "Up to 10% better prices, plus one free retry after rejection.",
      "Up to 15% better prices, plus a hint of the seller's lowest price.",
    ],
  },
  {
    id: "browserext",
    name: "Browser Extension",
    icon: "clipboard",
    desc: "Master the parts marketplace.",
    tiers: [
      "Listings show market-average comparison (green = deal, red = overpriced).",
      "5% off all parts purchases, plus price history per part.",
      "10% off, plus alerts when parts drop in price or deals go live.",
    ],
  },
];

const Skills = {
  // Persistent state (saved)
  totalXP: 0,
  pointsEarned: 0,
  pointsSpent: 0,
  unlocked: { gearhead: 0, smoothtalker: 0, browserext: 0 }, // tier 0-3 per skill

  init(saved) {
    if (saved) {
      this.totalXP = saved.totalXP || 0;
      this.pointsEarned = saved.pointsEarned || 0;
      this.pointsSpent = saved.pointsSpent || 0;
      this.unlocked = Object.assign({ gearhead: 0, smoothtalker: 0, browserext: 0 }, saved.unlocked);
    }
  },

  toJSON() {
    return {
      totalXP: this.totalXP,
      pointsEarned: this.pointsEarned,
      pointsSpent: this.pointsSpent,
      unlocked: this.unlocked,
    };
  },

  // --- XP ---
  xpForPoint(n) {
    // XP threshold (cumulative) to earn point number n (1-indexed)
    // point 1: 500, point 2: 500+1000=1500, point 3: 1500+1500=3000
    let total = 0;
    for (let i = 1; i <= n; i++) {
      total += SKILLS_CONFIG.pointBaseXP + (i - 1) * SKILLS_CONFIG.pointStepXP;
    }
    return total;
  },

  xpForNextPoint() {
    return this.xpForPoint(this.pointsEarned + 1);
  },

  xpProgress() {
    const prevThreshold = this.pointsEarned === 0 ? 0 : this.xpForPoint(this.pointsEarned);
    const nextThreshold = this.xpForNextPoint();
    return {
      current: this.totalXP - prevThreshold,
      needed: nextThreshold - prevThreshold,
      pct: Math.min(100, Math.round(((this.totalXP - prevThreshold) / (nextThreshold - prevThreshold)) * 100)),
    };
  },

  unspentPoints() {
    return this.pointsEarned - this.pointsSpent;
  },

  gainXP(amount) {
    if (amount <= 0) return 0;
    const xp = Math.round(amount * SKILLS_CONFIG.xpPerDollarProfit);
    if (xp <= 0) return 0;
    this.totalXP += xp;
    // Check for new skill points
    let newPoints = 0;
    while (this.totalXP >= this.xpForPoint(this.pointsEarned + 1)) {
      this.pointsEarned++;
      newPoints++;
    }
    Save.save();
    return { xp, newPoints };
  },

  // Called after a completed sale. Returns { xp, newPoints } for the popup.
  awardForSale(salePrice, costBasis) {
    const profit = Math.round(salePrice - (costBasis || 0));
    if (profit <= 0) return { xp: 0, newPoints: 0, profit };
    const result = this.gainXP(profit);
    return { ...result, profit };
  },

  // --- Unlocking ---
  tierCost(tier) {
    return SKILLS_CONFIG.tierCosts[tier - 1] || 0;
  },

  canUnlock(skillId) {
    const current = this.unlocked[skillId] || 0;
    if (current >= 3) return false;
    return this.unspentPoints() >= this.tierCost(current + 1);
  },

  unlockTier(skillId) {
    const current = this.unlocked[skillId] || 0;
    if (current >= 3) return false;
    const cost = this.tierCost(current + 1);
    if (this.unspentPoints() < cost) return false;
    this.unlocked[skillId] = current + 1;
    this.pointsSpent += cost;
    Save.save();
    return true;
  },

  tier(skillId) {
    return this.unlocked[skillId] || 0;
  },

  // --- Effect helpers ---
  // Gear Head
  gearHeadTier() { return this.tier("gearhead"); },

  // Smooth Talker: discount multiplier for buy prices (0-1)
  haggleDiscount() {
    return SKILLS_CONFIG.smoothTalkerDiscount[this.tier("smoothtalker")] || 0;
  },
  hasRetry() { return this.tier("smoothtalker") >= 2; },
  hasSellerHint() { return this.tier("smoothtalker") >= 3; },

  // Browser Extension
  partsDiscount() {
    return SKILLS_CONFIG.browserExtDiscount[this.tier("browserext")] || 0;
  },
  hasMarketTags() { return this.tier("browserext") >= 1; },
  hasPriceHistory() { return this.tier("browserext") >= 2; },
  hasPriceAlerts() { return this.tier("browserext") >= 3; },

  // --- Gear Head: condition display ---
  // Returns HTML for a part's condition based on Gear Head tier
  condDisplay(part) {
    const tier = this.gearHeadTier();
    const pct = part.conditionPct ?? 50;
    const state = part.stateLabel || part.state || "Unknown";
    if (tier === 0) {
      return `<span class="cond-hidden" title="Train Gear Head to reveal condition">???</span>`;
    }
    if (tier === 1) {
      return state;
    }
    if (tier === 2) {
      return `${state} · ${pct}%`;
    }
    // Tier 3: exact % + hidden defects + repair estimate
    const defects = this.hiddenDefects(part);
    const repairEst = this.repairEstimate(part);
    let html = `${state} · ${pct}%`;
    if (defects.length) {
      html += `<div class="cond-defects">⚠ ${defects.join(", ")}</div>`;
    }
    if (repairEst > 0) {
      html += `<div class="cond-repair">Est. repair: $${repairEst}</div>`;
    }
    return html;
  },

  // Deterministic "hidden defects" based on part identity + condition
  hiddenDefects(part) {
    const pct = part.conditionPct ?? 50;
    if (pct >= 70) return [];
    // Seed from part key for consistency
    const key = (part.partKey || "") + (part.bikeSprite || "") + (part.listedAt || 0);
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    const defects = [];
    const pool = ["hairline crack", "stripped threads", "worn bushing", "pitted surface", "bent tab", "corroded contacts"];
    const count = pct < 30 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      defects.push(pool[Math.abs(hash + i * 7) % pool.length]);
    }
    return [...new Set(defects)];
  },

  repairEstimate(part) {
    const pct = part.conditionPct ?? 50;
    if (pct >= 70) return 0;
    // Rough estimate: $2 per missing point below 70, scaled by part base price
    const base = (typeof PART_BASE_PRICE !== "undefined" && PART_BASE_PRICE[part.partKey]) || 20;
    return Math.round(((70 - pct) * 0.5 + base * 0.1));
  },

  // --- Browser Extension ---
  // Market comparison tag: green = below average (deal), red = above
  marketTag(part) {
    if (!this.hasMarketTags()) return "";
    const avg = this.marketAverage(part);
    if (!avg || !part.price) return "";
    const diff = (avg - part.price) / avg;
    if (diff >= 0.15) return `<span class="mkt-tag deal">🔥 ${Math.round(diff * 100)}% below market</span>`;
    if (diff >= 0.05) return `<span class="mkt-tag ok">${Math.round(diff * 100)}% below avg</span>`;
    if (diff <= -0.15) return `<span class="mkt-tag over">${Math.round(-diff * 100)}% above market</span>`;
    return `<span class="mkt-tag fair">~market avg</span>`;
  },

  marketAverage(part) {
    if (typeof PART_BASE_PRICE === "undefined" || !part.partKey) return 0;
    const base = PART_BASE_PRICE[part.partKey] || 20;
    const mult = (typeof PART_COND_MULT !== "undefined" && PART_COND_MULT[part.state]) || 0.5;
    return Math.round(base * mult);
  },

  // Fake-but-stable price history for a part (Tier 2)
  priceHistory(part) {
    if (!this.hasPriceHistory()) return [];
    const key = (part.partKey || "") + (part.bikeSprite || "");
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    const avg = this.marketAverage(part);
    const history = [];
    let price = avg * 1.1;
    for (let i = 6; i >= 0; i--) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      const drift = ((hash % 30) - 15) / 100;
      price = Math.max(5, Math.round(price * (1 + drift)));
      history.push({ daysAgo: i, price });
    }
    // Last point is current price
    history[history.length - 1].price = part.price;
    return history;
  },

  priceHistoryHTML(part) {
    const hist = this.priceHistory(part);
    if (!hist.length) return "";
    const max = Math.max(...hist.map(h => h.price));
    const min = Math.min(...hist.map(h => h.price));
    const range = Math.max(1, max - min);
    const bars = hist.map(h => {
      const hgt = 8 + Math.round(((h.price - min) / range) * 32);
      return `<div class="ph-bar" style="height:${hgt}px" title="$${h.price} ${h.daysAgo === 0 ? "(now)" : h.daysAgo + "d ago"}"></div>`;
    }).join("");
    return `<div class="price-hist"><div class="ph-label">7-day price history</div><div class="ph-bars">${bars}</div></div>`;
  },
};

// XP popup — floating "+X XP" near the sale result
const XPPopup = {
  show(xp, newPoints) {
    if (xp <= 0) return;
    const el = document.createElement("div");
    el.className = "xp-popup";
    el.innerHTML = `+${xp} XP${newPoints > 0 ? `<span class="xp-point"> · +${newPoints} skill point${newPoints > 1 ? "s" : ""}!</span>` : ""}`;
    document.body.appendChild(el);
    // Position near center-top
    setTimeout(() => el.classList.add("show"), 50);
    setTimeout(() => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 400);
    }, 2600);
  },
};
