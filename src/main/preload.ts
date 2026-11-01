import { contextBridge, ipcRenderer } from "electron";
import type {
  ManagerApi,
  ProgressBridge,
  ScanProgress,
} from "../shared/types";

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
] as const;

const manager = Object.fromEntries(
  commands.map((command) => [
    command,
    (arg: unknown) => ipcRenderer.invoke(command, arg),
  ]),
) as unknown as ManagerApi;

const progress: ProgressBridge = {
  listen(callback: (progress: ScanProgress) => void) {
    const listener = (_event: Electron.IpcRendererEvent, value: ScanProgress) =>
      callback(value);
    ipcRenderer.on("progress", listener);
    return () => ipcRenderer.removeListener("progress", listener);
  },
};

contextBridge.exposeInMainWorld("manager", manager);
contextBridge.exposeInMainWorld("progress", progress);
