// Sold As-Is — bespoke hand-drawn home-screen app icons (aud212).
// Each icon is its own little ink illustration: wobbly strokes, varied weight,
// sketchy details. Deliberately NOT the tab-bar glyphs — Garrett: "make them
// look less AI generated." Ink color comes from the tile via currentColor.
const AppIcons = {
  // Marketplace: loose moped with a price tag hanging off the bars
  market: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M12.2 38.6c-3.5-.4-6-3.4-5.7-6.9.3-3.4 3.3-6 6.8-5.7 3.4.3 6 3.2 5.7 6.7-.3 3.5-3.3 6.2-6.8 5.9z"/>
    <path d="M36.1 38.4c-3.5-.3-6.2-3.2-6-6.7.2-3.5 3.2-6.1 6.7-5.9 3.5.2 6.1 3.1 5.9 6.6-.2 3.5-3.1 6.2-6.6 6z"/>
    <path d="M12.4 31.6c2.1-2.7 4.3-5.3 6.7-7.9l7.7-1.2c1.7 2.6 3.4 5.1 5.2 7.5"/>
    <path d="M16.6 23.4c2.7-1.2 5.9-1.1 8.5.2"/>
    <path d="M26.9 22.4l1.3-6.1"/>
    <path d="M25.6 16.6c1.5-1 3.8-1.1 5.3-.3"/>
    <path d="M36.3 31.3L31.2 19"/>
    <path d="M31.6 21.3c1.2-.1 2.2.8 2.2 1.9 0 1.2-1 2-2.1 1.9"/>
    <path d="M30.9 16.2c.8 2 1.7 3.9 2.9 5.6"/>
    <path d="M33.8 21.9l6.7 2.2-1.3 5.1-6.7-2.2c-.5-1.7-.1-3.5 1.3-5.1z"/>
    <path d="M35.6 24c.5.2.8.8.6 1.3"/>
    <path d="M37.2 25.6c.6.2 1.2.5 1.7.9"/>
  </svg>`,
  // Boneyard: two sketchy crossed bones
  parts: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14.2 33.8c6.4-6.1 12.8-12.4 19.3-18.6"/>
    <path d="M11.6 30.1c-1.3.1-2.3 1.2-2.2 2.5.1 1.2 1.2 2.1 2.5 2 1.2-.1 2.1-1.2 2-2.4-.1-1.3-1.1-2.2-2.3-2.1z"/>
    <path d="M13.2 34.4c-1.1.6-1.6 2-.9 3.1.6 1.1 2 1.5 3.1.9 1.1-.6 1.5-2 .9-3.1-.6-1.1-2-1.5-3.1-.9z"/>
    <path d="M31.8 12.9c-1.2-.4-2.5.3-2.9 1.5-.4 1.2.3 2.5 1.5 2.9 1.2.4 2.5-.3 2.9-1.5.4-1.2-.3-2.5-1.5-2.9z"/>
    <path d="M35.9 14.2c-.6-1.1-.3-2.5.8-3.1 1.1-.6 2.5-.2 3.1.9.6 1.1.2 2.5-.9 3.1-1.1.6-2.5.2-3-.9z"/>
    <path d="M14.2 14.2c6.4 6.1 12.8 12.4 19.3 18.6"/>
    <path d="M11.6 17.9c-1.3-.1-2.3-1.2-2.2-2.5.1-1.2 1.2-2.1 2.5-2 1.2.1 2.1 1.2 2 2.4-.1 1.3-1.1 2.2-2.3 2.1z"/>
    <path d="M13.2 13.6c-1.1-.6-1.6-2-.9-3.1.6-1.1 2-1.5 3.1-.9 1.1.6 1.5 2 .9 3.1-.6 1.1-2 1.5-3.1.9z"/>
    <path d="M31.8 35.1c-1.2.4-2.5-.3-2.9-1.5-.4-1.2.3-2.5 1.5-2.9 1.2-.4 2.5.3 2.9 1.5.4 1.2-.3 2.5-1.5 2.9z"/>
    <path d="M35.9 33.8c-.6 1.1-.3 2.5.8 3.1 1.1.6 2.5.2 3.1-.9.6-1.1.2-2.5-.9-3.1-1.1-.6-2.5-.2-3 .9z"/>
    <path d="M22 9.5l1.8-.4M38.5 26.5l1.9.3"/>
  </svg>`,
  // Crate Fresh: sketchy wooden crate with X brace
  crate: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M10.6 13.4c9-.8 18.3-.9 27.3-.3.6 7.6.5 15.1-.2 22.6-9 .8-18.4.9-27.4.3-.6-7.5-.5-15.1.3-22.6z"/>
    <path d="M10.9 21.4c8.7-.7 17.6-.8 26.4-.2"/>
    <path d="M10.6 29.4c8.9-.6 17.9-.7 26.8-.1"/>
    <path d="M12.2 15.6c7.4 6 14.9 12.4 22.3 18.4"/>
    <path d="M35.3 15.9c-7.2 6.1-14.6 12.2-22.1 18.1"/>
    <path d="M14 15.8l1.8 1.8m-1.8 0l1.8-1.8"/>
    <path d="M32.5 15.5l1.8 1.8m-1.8 0l1.8-1.8"/>
    <path d="M14.2 32.3l1.8 1.8m-1.8 0l1.8-1.8"/>
    <path d="M32.3 32.1l1.8 1.8m-1.8 0l1.8-1.8"/>
    <path d="M20 18.5c2.5 2 5 4.1 7.5 6.2"/>
  </svg>`,
  // Garage: hand-drawn open-end wrench with shade hatches
  garage: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M37.8 9.3c2.8.9 4.4 3.6 3.8 6.4-.5 2.5-2.6 4.3-5.1 4.4"/>
    <path d="M33.2 20.4c-1.5-.4-2.6-1.7-2.8-3.2-.2-1.7.8-3.3 2.4-3.9"/>
    <path d="M30.5 17.2l2.9 2.9c-1.3 2.4-3.3 4.3-5.8 5.5"/>
    <path d="M33.6 19.8c-5.4 5.6-10.9 11.1-16.6 16.4"/>
    <path d="M14.5 33.5c-1.6 1.7-3.2 3.3-4.9 4.9"/>
    <path d="M11.8 36.1c-1.4 1-1.7 2.9-.7 4.3 1 1.4 2.9 1.7 4.3.7 1.4-1 1.7-2.9.7-4.3-1-1.4-2.9-1.7-4.3-.7z"/>
    <path d="M20.5 31.8l2.8-1M23.5 28.9l2.8-1"/>
    <path d="M27.5 24.5l-1.5 1.5"/>
  </svg>`,
  // Collection: sketchy trophy with a star
  collection: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M14.6 10.8c6-.7 12.4-.7 18.4 0-.5 6-3 10.4-7 12.4-1.3.7-2.9.9-4.3.7-1.4-.2-2.7-.9-3.7-2-3.2-3.3-4.1-7.4-3.4-11.1z"/>
    <path d="M14.9 13.8c-3.5.3-5.5 2.5-5 5.4.4 2.5 2.8 4 5.4 3.5"/>
    <path d="M33.1 13.8c3.5.3 5.5 2.5 5 5.4-.4 2.5-2.8 4-5.4 3.5"/>
    <path d="M24 14.3l1 2.1 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z"/>
    <path d="M22.4 25.4c.3 2.5.2 5-.3 7.4M25.6 25.2c-.2 2.6-.1 5.2.4 7.6"/>
    <path d="M22.1 33.2c-2 .8-3.4 2-3.9 4M25.9 33c2 .9 3.3 2.2 3.7 4.1"/>
    <path d="M17.2 38.3c5.4-1 11.4-1 16.8 0"/>
    <path d="M19.5 38.1c-.1 1-.2 2-.2 3M28.5 38.1c.1 1 .2 2 .2 3"/>
  </svg>`,
  // Ledger: open ledger book with wobbly ruled lines
  ledger: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M9.2 13.4c4.5-1.8 9.4-2.3 14.3-1.5 5-1 9.9-.3 14.3 1.7v17.2c-4.4-2-9.3-2.7-14.3-1.8-4.9-.9-9.8-.2-14.3 1.6v-17.2z"/>
    <path d="M23.5 11.9v18.9"/>
    <path d="M12.2 18.3c2.9-1 5.9-1.2 8.8-.5"/>
    <path d="M12.2 22.3c2.9-1 5.9-1.2 8.8-.5"/>
    <path d="M12.2 26.3c2.4-.8 4.9-1 7.3-.4"/>
    <path d="M27 18.1c2.9-.8 5.8-.9 8.7-.3"/>
    <path d="M27 22.1c2.9-.8 5.8-.9 8.7-.3"/>
    <path d="M27 26.1c2.4-.6 4.8-.7 7.2-.2"/>
    <path d="M33.5 30.5l5.5 7M33.5 30.5l-1.2 1.6M39 37.5l-2.2-1.2"/>
    <path d="M32.3 32.1l-1.5 4.5 4.5-1.5"/>
  </svg>`,
  // Settings: sketchy gear with uneven teeth
  settings: `<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M24 13.4c5.7-.3 10.6 4.1 10.9 9.8.3 5.7-4.1 10.6-9.8 10.9-5.7.3-10.6-4.1-10.9-9.8-.3-5.7 4.1-10.6 9.8-10.9z"/>
    <path d="M24 19.9c2.2-.1 4.1 1.6 4.2 3.8.1 2.2-1.6 4.1-3.8 4.2-2.2.1-4.1-1.6-4.2-3.8-.1-2.2 1.6-4.1 3.8-4.2z"/>
    <path d="M24 8.4c.1 1.8.1 3.2 0 4.6M31.6 10.4c-1 1.5-1.9 2.7-3 3.8M37.1 16.9c-1.7.6-3.1 1-4.6 1.3M38.6 25.4c-1.8-.1-3.2-.1-4.7.1M36.1 33.4c-1.4-1.1-2.5-2.1-3.6-3.2M29.6 38.7c-.8-1.6-1.4-3-1.8-4.5M21.1 39.4c.1-1.8.1-3.3-.1-4.8M13.6 36.4c1.2-1.4 2.2-2.5 3.4-3.5M9.6 29.4c1.7-.7 3-1.2 4.6-1.5M10.1 20.9c1.8.2 3.2.2 4.8 0M13.9 13.4c1.3 1.2 2.3 2.2 3.3 3.4M20.6 9.1c.7 1.7 1.2 3 1.5 4.6"/>
  </svg>`,
};

// Replace home-screen + dock tile glyphs with the bespoke art.
function renderAppIcons(root) {
  (root || document).querySelectorAll("[data-appicon]").forEach(el => {
    const art = AppIcons[el.dataset.appicon];
    if (art) el.innerHTML = art;
  });
}
