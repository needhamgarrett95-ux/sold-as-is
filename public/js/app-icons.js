// Sold As-Is — home-screen app icons (aud213).
// Clean, geometric, instantly readable. One consistent stroke language,
// game palette. Garrett-approved set.
const AppIcons = {
  // Marketplace: step-through moped
  market: `<svg viewBox="0 0 120 120" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <circle cx="34" cy="82" r="15"/><circle cx="86" cy="82" r="15"/>
    <path d="M34 82 Q60 76 76 56"/><path d="M46 76 L52 54"/>
    <path d="M40 50 L64 50" stroke-width="10"/>
    <path d="M76 56 L84 42"/><path d="M84 42 L86 82"/>
    <path d="M84 42 L86 28"/><path d="M86 28 L76 28"/>
    <circle cx="92" cy="50" r="4.5"/>
  </svg>`,
  // Boneyard: bone
  parts: `<svg viewBox="0 0 120 120" fill="none" stroke="#fff8ef" stroke-linecap="round" aria-hidden="true">
    <path d="M44 60 H76" stroke-width="14"/>
    <circle cx="38" cy="50" r="9" fill="#fff8ef" stroke="none"/>
    <circle cx="38" cy="70" r="9" fill="#fff8ef" stroke="none"/>
    <circle cx="82" cy="50" r="9" fill="#fff8ef" stroke="none"/>
    <circle cx="82" cy="70" r="9" fill="#fff8ef" stroke="none"/>
  </svg>`,
  // Crate Fresh: X-braced crate
  crate: `<svg viewBox="0 0 120 120" fill="none" stroke="#7dd68f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="36" y="40" width="48" height="40" rx="4"/>
    <path d="M36 40 L84 80 M84 40 L36 80" stroke-width="5"/>
  </svg>`,
  // Garage: open-end wrench
  garage: `<svg viewBox="0 0 120 120" fill="none" stroke="#26200a" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M66 54 L40 80" stroke-width="9"/>
    <path d="M84.8 44.1 A11 11 0 1 1 75.9 35.2" stroke-width="8"/>
  </svg>`,
  // Collection: trophy cup
  collection: `<svg viewBox="0 0 120 120" fill="none" stroke="#febc2e" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M45 36 H75 V50 C75 62 68 68 60 68 C52 68 45 62 45 50 Z"/>
    <path d="M45 42 C36 42 36 54 46 56"/>
    <path d="M75 42 C84 42 84 54 74 56" stroke-width="6"/>
    <path d="M60 68 V78"/>
    <path d="M48 84 H72" stroke-width="9"/>
  </svg>`,
  // Ledger: open ledger book
  ledger: `<svg viewBox="0 0 120 120" fill="none" stroke="#f5edd8" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M30 42 Q45 34 60 42 Q75 34 90 42 V74 Q75 66 60 74 Q45 66 30 74 Z"/>
    <path d="M60 42 V74" stroke-width="5"/>
    <path d="M38 54 H52 M68 54 H82 M38 62 H52" stroke-width="4"/>
  </svg>`,
  // Settings: gear
  settings: `<svg viewBox="0 0 120 120" fill="none" stroke="#dfe3e8" stroke-width="7" stroke-linecap="round" aria-hidden="true">
    <circle cx="60" cy="60" r="12"/>
    <path d="M76 60 H84 M71.3 71.3 L77 77 M60 76 V84 M48.7 71.3 L43 77 M44 60 H36 M48.7 48.7 L43 43 M60 44 V36 M71.3 48.7 L77 43"/>
  </svg>`,
};

// Replace home-screen + dock tile glyphs with the bespoke art.
function renderAppIcons(root) {
  (root || document).querySelectorAll("[data-appicon]").forEach(el => {
    const art = AppIcons[el.dataset.appicon];
    if (art) el.innerHTML = art;
  });
}
