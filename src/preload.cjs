const { contextBridge, ipcRenderer } = require("electron");
const commands = [
  "analyzeHashFS",
  "init",
  "scan",
  "cancel",
  "saveSettings",
  "chooseFolder",
  "import",
  "search",
  "openUrl",
  "saveBuilds",
  "profiles",
  "apply",
  "restore",
];
contextBridge.exposeInMainWorld(
  "manager",
  Object.fromEntries(
    commands.map((c) => [c, (arg) => ipcRenderer.invoke(c, arg)]),
  ),
);
contextBridge.exposeInMainWorld("progress", {
  listen: (cb) => ipcRenderer.on("progress", (_, p) => cb(p)),
});
