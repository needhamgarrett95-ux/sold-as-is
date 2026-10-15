// Sold As-Is Launcher V1 — main process.
// Checks the pc-test-v1 prerelease for the game installer, downloads
// updates with progress, installs silently, and launches the game.
const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { spawn, execFile } = require("child_process");
const fs = require("fs");
const path = require("path");
const https = require("https");

const REPO = "needhamgarrett95-ux/sold-as-is";
const TAG = "pc-test-v1";
const GAME_ASSET = "SoldAsIs-PC-test-setup.exe";
const GAME_EXE = "Sold As-Is PC.exe";

function installDir() {
  return path.join(process.env.LOCALAPPDATA || "", "Programs", "sold-as-is-pc");
}
function stampPath() {
  return path.join(app.getPath("userData"), "installed.json");
}
function readStamp() {
  try { return JSON.parse(fs.readFileSync(stampPath(), "utf8")); }
  catch (e) { return null; }
}
function writeStamp(s) {
  try {
    fs.mkdirSync(path.dirname(stampPath()), { recursive: true });
    fs.writeFileSync(stampPath(), JSON.stringify(s));
  } catch (e) {}
}
function gameExePath() {
  return path.join(installDir(), GAME_EXE);
}
function isInstalled() {
  return fs.existsSync(gameExePath());
}

function ghGet(urlPath) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.github.com",
      path: urlPath,
      method: "GET",
      headers: { "User-Agent": "sold-as-is-launcher", "Accept": "application/vnd.github+json" },
    }, (res) => {
      let body = "";
      res.on("data", (c) => (body += c));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
        } else reject(new Error("GitHub API " + res.statusCode));
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function getRelease() {
  const rel = await ghGet(`/repos/${REPO}/releases/tags/${TAG}`);
  const asset = (rel.assets || []).find((a) => a.name === GAME_ASSET);
  if (!asset) throw new Error("installer asset not found");
  return { notes: rel.body || "", asset };
}

let win = null;
function send(ch, data) {
  if (win && !win.isDestroyed()) win.webContents.send(ch, data);
}

function createWindow() {
  win = new BrowserWindow({
    width: 960, height: 600, resizable: false, frame: false,
    backgroundColor: "#101318",
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false },
  });
  win.loadFile(path.join(__dirname, "ui", "index.html"));
}

ipcMain.handle("launcher:state", async () => {
  try {
    const { notes, asset } = await getRelease();
    const stamp = readStamp();
    const updateAvailable = !stamp || stamp.assetId !== asset.id;
    return {
      ok: true,
      installed: isInstalled(),
      updateAvailable,
      notes,
      remoteUpdatedAt: asset.updated_at,
      version: app.getVersion(),
    };
  } catch (e) {
    return { ok: false, error: e.message, installed: isInstalled() };
  }
});

ipcMain.handle("launcher:update", async () => {
  try {
    const { asset } = await getRelease();
    const tmp = path.join(app.getPath("temp"), GAME_ASSET);
    send("launcher:progress", { phase: "downloading", pct: 0 });
    await downloadFile(asset.browser_download_url, tmp, (pct) => {
      send("launcher:progress", { phase: "downloading", pct });
    });
    send("launcher:progress", { phase: "installing", pct: 100 });
    await runSilent(tmp);
    try { fs.unlinkSync(tmp); } catch (e) {}
    writeStamp({ assetId: asset.id, updatedAt: asset.updated_at, at: Date.now() });
    send("launcher:progress", { phase: "done", pct: 100 });
    return { ok: true, installed: isInstalled() };
  } catch (e) {
    send("launcher:progress", { phase: "error", pct: 0, error: e.message });
    return { ok: false, error: e.message };
  }
});

function downloadFile(url, dest, onPct) {
  return new Promise((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    const get = (u) => {
      https.get(u, { headers: { "User-Agent": "sold-as-is-launcher" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location);
        if (res.statusCode !== 200) return reject(new Error("download HTTP " + res.statusCode));
        const total = parseInt(res.headers["content-length"] || "0", 10);
        let got = 0;
        res.on("data", (c) => {
          got += c.length;
          if (total) onPct(Math.round((got / total) * 100));
        });
        res.pipe(out);
        out.on("finish", () => { out.close(); resolve(); });
      }).on("error", (e) => { try { fs.unlinkSync(dest); } catch (_) {} reject(e); });
    };
    get(url);
  });
}

function runSilent(installer) {
  return new Promise((resolve, reject) => {
    // NSIS silent install; then wait for the game exe to exist.
    execFile(installer, ["/S"], { timeout: 10 * 60 * 1000 }, (err) => {
      if (err) return reject(err);
      const t0 = Date.now();
      const tick = () => {
        if (isInstalled()) return resolve();
        if (Date.now() - t0 > 5 * 60 * 1000) return reject(new Error("install timed out"));
        setTimeout(tick, 2000);
      };
      tick();
    });
  });
}

ipcMain.handle("launcher:play", async () => {
  const exe = gameExePath();
  if (!fs.existsSync(exe)) return { ok: false, error: "game not installed" };
  spawn(exe, [], { detached: true, stdio: "ignore" }).unref();
  return { ok: true };
});

ipcMain.handle("launcher:close", () => { app.quit(); });

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
