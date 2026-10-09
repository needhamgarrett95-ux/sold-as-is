// Sold As-Is — custom SVG icon set
// Gritty marketplace aesthetic: bold strokes, theme colors
// Usage: Icon.moped('cls') returns svg string, or Icon.get('moped')

const Icon = (() => {
  const S = (inner, vb = "0 0 24 24") =>
    `<svg viewBox="${vb}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;

  const icons = {
    // Moped — marketplace tab
    moped: S(`<circle cx="5.5" cy="17" r="3.2"/><circle cx="18.5" cy="17" r="3.2"/>
      <path d="M5.5 17 9 10h6l3.5 7"/><path d="M9 10 7.5 6H5"/><path d="M12 10V6h3"/>
      <circle cx="12" cy="5" r="1"/>`),

    // Gear — boneyard tab
    gear: S(`<circle cx="12" cy="12" r="3.2"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>`),

    // Wrench — garage tab
    wrench: S(`<path d="M21 6.5a5 5 0 0 1-6.8 4.7L7 18.4a2 2 0 0 1-2.8-2.8l7.2-7.2A5 5 0 0 1 17.5 3l-2.6 2.6 3.5 3.5L21 6.5z"/>`),

    // Trophy — collection tab
    trophy: S(`<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 5H4a3 3 0 0 0 3 5M16 5h4a3 3 0 0 1-3 5"/>
      <path d="M12 13v4M8 20h8M10 17h4"/>`),

    // Scooter — boneyard header (vespa-style)
    scooter: S(`<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/>
      <path d="M6 17h7l2-6h3"/><path d="M13 11l-2-4H8"/><path d="M18 17l-1.5-7"/>`),

    // Money bag / cash — sell
    cash: S(`<circle cx="12" cy="12" r="9"/><path d="M12 7v10M15 9.5c-.7-1-1.8-1.5-3-1.5-1.7 0-3 .9-3 2.2 0 2.9 6 1.4 6 4.3 0 1.3-1.3 2.2-3 2.2-1.2 0-2.3-.5-3-1.5"/>`),

    // Gavel — auction
    gavel: S(`<path d="M9 4l7 7M7 6l7 7M4 20h7"/><path d="M14 9l-4.5 4.5M13 5l6 6"/>`),

    // Bone — boneyard logo (diagonal dog bone, filled knobs)
    bone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9.5 14.5l5-5" stroke-width="4"/><circle cx="7" cy="7" r="2.4" fill="currentColor" stroke="none"/><circle cx="10.2" cy="4.8" r="2.4" fill="currentColor" stroke="none"/><circle cx="17" cy="17" r="2.4" fill="currentColor" stroke="none"/><circle cx="13.8" cy="19.2" r="2.4" fill="currentColor" stroke="none"/></svg>`,

    // Clipboard — list on marketplace
    clipboard: S(`<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4a2 2 0 0 1 6 0M9 11h6M9 15h6"/>`),

    // Chat bubble — haggle
    chat: S(`<path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z"/><path d="M9 12h.01M12.5 12h.01M16 12h.01"/>`),

    // Close X
    close: S(`<path d="M6 6l12 12M18 6L6 18"/>`),

    // Star — collection
    star: S(`<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8L12 3z"/>`),

    // Check
    check: S(`<path d="M4 12.5l5 5L20 6.5"/>`),

    // Lock
    lock: S(`<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>`),

    // Camera (for photo placeholders)
    camera: S(`<path d="M4 8h3l2-2h6l2 2h3v11H4V8z"/><circle cx="12" cy="13" r="3.5"/>`),

    // Tag — price/for sale
    tag: S(`<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1.5"/>`),

    // Timer/clock — auction countdown
    timer: S(`<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>`),

    // Cart
    cart: S(`<circle cx="9" cy="20" r="1.6"/><circle cx="17" cy="20" r="1.6"/><path d="M3 4h2l2.4 11h10.4l2-8H7"/>`),
  };

  return {
    get(name, cls = "") {
      const svg = icons[name] || icons.tag;
      return cls ? svg.replace("<svg", `<svg class="${cls}"`) : svg;
    },
    // Fill all [data-icon] placeholders in the DOM
    hydrate(root = document) {
      root.querySelectorAll("[data-icon]").forEach(el => {
        const name = el.dataset.icon;
        if (icons[name] && !el.dataset.hydrated) {
          el.innerHTML = icons[name];
          el.dataset.hydrated = "1";
        }
      });
    },
    names: Object.keys(icons),
  };
})();
