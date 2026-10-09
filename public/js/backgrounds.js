// Sold As-Is — procedural pixel-art listing backgrounds
// Drawn at low res on canvas, scaled up with pixelated rendering to match sprite style
const BG = {
  types: ["barn", "yard", "garage"],

  rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  },

  generate(type, seed) {
    const W = 160, H = 120;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d");
    const r = this.rng(seed);
    if (type === "barn") this.barn(x, W, H, r);
    else if (type === "yard") this.yard(x, W, H, r);
    else this.garage(x, W, H, r);
    return c.toDataURL("image/png");
  },

  barn(x, W, H, r) {
    // Wooden plank wall
    x.fillStyle = "#6b4a2f"; x.fillRect(0, 0, W, H);
    x.fillStyle = "#57391f";
    for (let y = 0; y < H; y += 14) x.fillRect(0, y, W, 2);
    // Wood grain speckle
    x.fillStyle = "#7d5a38";
    for (let i = 0; i < 50; i++) x.fillRect((r()*W)|0, (r()*H)|0, 3, 1);
    x.fillStyle = "#4e3319";
    for (let i = 0; i < 24; i++) x.fillRect((r()*W)|0, (r()*H)|0, 2, 2);
    // Dirt floor
    x.fillStyle = "#4a3826"; x.fillRect(0, H-26, W, 26);
    x.fillStyle = "#c9a44a";
    for (let i = 0; i < 40; i++) x.fillRect((r()*W)|0, H-26+((r()*26)|0), 2, 1);
    // Window with light
    const wx = 18 + ((r()*96)|0);
    x.fillStyle = "#241a10"; x.fillRect(wx, 14, 30, 34);
    x.fillStyle = "#ffe9a3"; x.fillRect(wx+3, 17, 24, 28);
    x.fillStyle = "#241a10";
    x.fillRect(wx+14, 17, 2, 28); x.fillRect(wx+3, 29, 24, 2);
    // Hay bale
    if (r() > 0.35) {
      const bx = (r()*(W-40))|0, by = H-44;
      x.fillStyle = "#d4af4e"; x.fillRect(bx, by, 38, 18);
      x.fillStyle = "#a8842f"; x.fillRect(bx, by, 38, 3); x.fillRect(bx, by+15, 38, 3);
      x.fillStyle = "#b8943a";
      for (let i = 0; i < 12; i++) x.fillRect(bx+((r()*36)|0), by+4+((r()*10)|0), 2, 1);
    }
    // Hanging tool silhouette
    if (r() > 0.5) {
      const tx = 8 + ((r()*40)|0);
      x.fillStyle = "#2e2114"; x.fillRect(tx, 8, 3, 22); x.fillRect(tx-4, 26, 11, 5);
    }
    // Warm light vignette
    const g = x.createRadialGradient(W/2, H/2, 20, W/2, H/2, 110);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(20,10,0,.35)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  },

  yard(x, W, H, r) {
    // Sky
    const sky = x.createLinearGradient(0, 0, 0, 72);
    sky.addColorStop(0, "#6db9dd"); sky.addColorStop(1, "#c2e4f2");
    x.fillStyle = sky; x.fillRect(0, 0, W, 72);
    // Sun
    x.fillStyle = "#ffdf5e"; x.fillRect(W-30, 8, 16, 16);
    x.fillStyle = "#fff3b0"; x.fillRect(W-27, 11, 10, 10);
    // Clouds
    x.fillStyle = "rgba(255,255,255,.92)";
    for (let i = 0; i < 3; i++) {
      const cx = (r()*W)|0, cy = (r()*36)|0;
      x.fillRect(cx, cy, 26, 9); x.fillRect(cx+7, cy-5, 14, 6);
    }
    // Grass
    x.fillStyle = "#5da24b"; x.fillRect(0, 72, W, 48);
    x.fillStyle = "#4c8a3d";
    for (let i = 0; i < 90; i++) x.fillRect((r()*W)|0, 72+((r()*48)|0), 2, 3);
    x.fillStyle = "#6fb45c";
    for (let i = 0; i < 40; i++) x.fillRect((r()*W)|0, 72+((r()*48)|0), 2, 2);
    // Fence
    x.fillStyle = "#8a6f4d"; x.fillRect(0, 56, W, 4); x.fillRect(0, 64, W, 4);
    x.fillStyle = "#75593a";
    for (let px = 0; px < W; px += 18) x.fillRect(px, 52, 4, 20);
    // Tree
    if (r() > 0.25) {
      const tx = 8 + ((r()*(W-40))|0);
      x.fillStyle = "#5a3d26"; x.fillRect(tx+12, 26, 9, 48);
      x.fillStyle = "#3e7a34"; x.fillRect(tx, 6, 34, 26);
      x.fillStyle = "#4f9140"; x.fillRect(tx+5, 10, 18, 12);
      x.fillStyle = "#356b2b";
      for (let i = 0; i < 10; i++) x.fillRect(tx+((r()*32)|0), 6+((r()*24)|0), 3, 3);
    }
    // Dirt patch
    x.fillStyle = "#8a7355";
    const dx = (r()*(W-50))|0;
    x.fillRect(dx, 96, 50, 16);
    x.fillStyle = "#755f45";
    for (let i = 0; i < 16; i++) x.fillRect(dx+((r()*48)|0), 96+((r()*14)|0), 3, 2);
  },

  garage(x, W, H, r) {
    // Cinder block wall
    x.fillStyle = "#8f9296"; x.fillRect(0, 0, W, 84);
    x.fillStyle = "#7c7f83";
    for (let y = 0; y < 84; y += 14) x.fillRect(0, y, W, 1);
    for (let row = 0; row < 6; row++) {
      const off = (row % 2) * 16;
      for (let px = off; px < W; px += 32) x.fillRect(px, row*14, 1, 14);
    }
    // Concrete floor
    x.fillStyle = "#5e6165"; x.fillRect(0, 84, W, 36);
    x.fillStyle = "#4c4f53";
    for (let i = 0; i < 30; i++) x.fillRect((r()*W)|0, 84+((r()*36)|0), 3, 2);
    // Oil stains
    x.fillStyle = "#33363a";
    for (let i = 0; i < 4; i++) {
      const ox = (r()*W)|0, oy = 88+((r()*28)|0);
      x.fillRect(ox, oy, 10, 5); x.fillRect(ox+2, oy-2, 6, 2);
    }
    // Pegboard with tools
    const bx = 8 + ((r()*60)|0);
    x.fillStyle = "#4a3a28"; x.fillRect(bx, 10, 52, 38);
    x.fillStyle = "#5c4b36";
    for (let py = 14; py < 46; py += 6) for (let px = bx+4; px < bx+52; px += 6) x.fillRect(px, py, 1, 1);
    const tools = ["#b8bcc0", "#8f959b", "#d0d4d8", "#a8adb3", "#c0c5cb"];
    for (let i = 0; i < 5; i++) {
      x.fillStyle = tools[i % tools.length];
      x.fillRect(bx+7+i*9, 16, 4, 16+((r()*10)|0));
    }
    // Window
    x.fillStyle = "#26292d"; x.fillRect(W-46, 10, 34, 26);
    x.fillStyle = "#a9d2e8"; x.fillRect(W-43, 13, 28, 20);
    x.fillStyle = "#26292d"; x.fillRect(W-30, 13, 2, 20); x.fillRect(W-43, 22, 28, 2);
    x.fillStyle = "rgba(255,255,255,.5)"; x.fillRect(W-41, 15, 8, 6);
    // Workbench
    if (r() > 0.35) {
      const wx = r() > 0.5 ? 0 : W-60;
      x.fillStyle = "#6b4a2f"; x.fillRect(wx, 64, 60, 20);
      x.fillStyle = "#54371f"; x.fillRect(wx, 64, 60, 3);
      x.fillStyle = "#4a3018"; x.fillRect(wx+5, 84, 5, 14); x.fillRect(wx+50, 84, 5, 14);
      // Items on bench
      x.fillStyle = "#b0392b"; x.fillRect(wx+12, 56, 10, 8);
      x.fillStyle = "#7f8c8d"; x.fillRect(wx+30, 58, 14, 6);
    }
    // Cool light vignette
    const g = x.createRadialGradient(W/2, H/2, 24, W/2, H/2, 110);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,20,.3)");
    x.fillStyle = g; x.fillRect(0, 0, W, H);
  },

  cache: {},
  urlFor(listing) {
    const key = listing.id + ":" + listing.sprite;
    if (!this.cache[key]) {
      const type = this.types[listing.id % this.types.length];
      this.cache[key] = this.generate(type, listing.id * 7919 + 101);
    }
    return this.cache[key];
  },
  clear() { this.cache = {}; },
};
