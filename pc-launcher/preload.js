const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("launcher", {
  state: () => ipcRenderer.invoke("launcher:state"),
  update: () => ipcRenderer.invoke("launcher:update"),
  play: () => ipcRenderer.invoke("launcher:play"),
  close: () => ipcRenderer.invoke("launcher:close"),
  onProgress: (cb) => ipcRenderer.on("launcher:progress", (_e, d) => cb(d)),
});
