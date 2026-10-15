const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#101318",
    autoHideMenuBar: true,
    fullscreen: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });
  // F11 toggles fullscreen (Esc is the game's own "back to desktop")
  win.webContents.on("before-input-event", (e, input) => {
    if (input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  // PC desktop shell is gated on ?pc=1; the web build never sees it.
  win.loadFile(path.join(__dirname, "public", "index.html"), { query: { pc: "1", trailer: "1" } });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
