import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  nativeTheme,
  shell,
} from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { detect, scan } from "./library";
import { evaluate } from "./compatibility";
import { writeAtomic, applyProfile, restoreProfile } from "./profiles";
import { analyzeHashFS } from "./hashfs";
import { search } from "./search";
import type {
  AppState,
  ApplyRequest,
  Build,
  ProfileInfo,
  ScanResult,
  Settings,
} from "../shared/types";

if (process.env.ETS2_MANAGER_DATA)
  app.setPath("userData", process.env.ETS2_MANAGER_DATA);

let win: BrowserWindow;
let state: AppState;
let store: string;
let latest: ScanResult = { mods: [], dlcs: [], warnings: [], cancelled: false };
let cancelled = false;
let busy = false;

const storeFile = () => path.join(store, "state.json");

async function persist(): Promise<void> {
  await writeAtomic(storeFile(), JSON.stringify(state, null, 2));
}

async function gameClosed(): Promise<void> {
  const { stdout } = await promisify(execFile)(
    "tasklist",
    ["/FI", "IMAGENAME eq eurotrucks2.exe", "/FO", "CSV"],
    { windowsHide: true },
  );
  if (/eurotrucks2\.exe/i.test(stdout))
    throw Error("Ferme ETS 2 avant de modifier un profil.");
}

async function profiles(): Promise<ProfileInfo[]> {
  const result: ProfileInfo[] = [];
  for (const type of ["profiles", "steam_profiles"]) {
    const root = path.join(state.settings.home, type);
    for (const entry of await fs
      .readdir(root, { withFileTypes: true })
      .catch(() => [])) {
      if (!entry.isDirectory()) continue;
      const file = path.join(root, entry.name, "profile.sii");
      const content = await fs.readFile(file).catch(() => null);
      if (content)
        result.push({
          file,
          name:
            content.toString().match(/profile_name:\s*"([^"]+)"/)?.[1] ||
            Buffer.from(entry.name, "hex").toString("utf8") ||
            entry.name,
          supported: content.subarray(0, 8).toString() === "SiiNunit",
        });
    }
  }
  return result;
}

type Handler = (arg: never) => Promise<unknown>;

const handlers = {
  analyzeHashFS: async (id: string) => {
    const mod = latest.mods.find((candidate) => candidate.id === id);
    if (!mod) throw Error("Paquet absent");
    const result = await analyzeHashFS(
      mod,
      state.settings.target,
      path.join(store, "hashfs-cache"),
      path.join(__dirname, "../../tools/scs_packer.exe"),
    );
    latest.mods[latest.mods.indexOf(mod)] = result;
    return {
      ...result,
      check: evaluate(result, state.settings.target, latest.dlcs),
    };
  },
  init: async () => ({ ...state, version: app.getVersion() }),
  saveSettings: async (settings: Partial<Settings>) => {
    state.settings = { ...state.settings, ...settings };
    await persist();
    return state.settings;
  },
  chooseFolder: async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openDirectory"],
    });
    return result.canceled ? null : result.filePaths[0];
  },
  cancel: async () => {
    cancelled = true;
  },
  scan: async () => {
    if (busy) throw Error("Une analyse est déjà en cours.");
    busy = true;
    cancelled = false;
    try {
      latest = await scan(
        state.settings,
        (progress) => win.webContents.send("progress", progress),
        () => cancelled,
      );
      return {
        ...latest,
        mods: latest.mods.map((mod) => ({
          ...mod,
          check: evaluate(mod, state.settings.target, latest.dlcs),
        })),
      };
    } finally {
      busy = false;
    }
  },
  search: async (query: string) => search(String(query).slice(0, 200)),
  openUrl: async (url: string) => {
    const target = new URL(url);
    if (target.protocol !== "https:") throw Error("Lien HTTPS requis");
    await shell.openExternal(target.href);
  },
  import: async () => {
    const result = await dialog.showOpenDialog(win, {
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Mods ETS 2", extensions: ["scs", "zip"] }],
    });
    if (result.canceled) return [];
    await fs.mkdir(state.settings.mod, { recursive: true });
    const messages: string[] = [];
    for (const file of result.filePaths) {
      const destination = path.join(state.settings.mod, path.basename(file));
      try {
        await fs.copyFile(
          file,
          destination,
          constants.COPYFILE_EXCL,
        );
        messages.push(path.basename(file) + " : importé");
      } catch (error) {
        messages.push(
          path.basename(file) +
            " : " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    }
    return messages;
  },
  saveBuilds: async (builds: Build[]) => {
    if (!Array.isArray(builds)) throw Error("Configurations invalides");
    state.builds = builds;
    await persist();
  },
  profiles,
  apply: async ({ profile, ids }: ApplyRequest) => {
    await gameClosed();
    if (!(await profiles()).some((item) => item.file === profile && item.supported))
      throw Error("Profil non pris en charge");
    const mods = ids.map((id) => latest.mods.find((mod) => mod.id === id));
    if (mods.some((mod) => !mod || mod.error))
      throw Error("Un paquet est absent ou illisible.");
    const names = mods.map((mod) =>
      mod!.source === "Workshop"
        ? "steam_workshop." + path.basename(mod!.file)
        : path.basename(mod!.file).replace(/\.(scs|zip)$/i, ""),
    );
    const result = await dialog.showMessageBox(win, {
      type: "question",
      buttons: ["Annuler", "Appliquer avec sauvegarde"],
      defaultId: 0,
      message: "Appliquer cet ordre au profil ?",
      detail:
        profile +
        "\n\nPriorité haute → basse :\n" +
        mods.map((mod) => mod!.name).join("\n"),
    });
    if (result.response !== 1) return null;
    await gameClosed();
    return applyProfile(profile, names, path.join(store, "backups"));
  },
  restore: async () => {
    await gameClosed();
    const result = await dialog.showOpenDialog(win, {
      defaultPath: path.join(store, "backups"),
      properties: ["openFile"],
      filters: [{ name: "Sauvegarde du gestionnaire", extensions: ["json"] }],
    });
    if (result.canceled) return;
    const selected = result.filePaths[0];
    if (path.dirname(selected) !== path.join(store, "backups"))
      throw Error("Sélectionne une sauvegarde créée par ce gestionnaire.");
    await restoreProfile(selected);
    return true;
  },
} satisfies Record<string, Handler>;

app.whenReady().then(async () => {
  store = app.getPath("userData");
  await fs.mkdir(store, { recursive: true });
  state = await fs
    .readFile(storeFile(), "utf8")
    .then((content) => JSON.parse(content) as AppState)
    .catch(async () => ({
      settings: await detect(app.getPath("documents")),
      builds: [],
    }));
  Menu.setApplicationMenu(null);
  nativeTheme.themeSource = "system";
  const windowsBuild = Number(process.getSystemVersion().split(".")[2] || 0);
  const micaAvailable =
    process.platform === "win32" && windowsBuild >= 22_000;
  win = new BrowserWindow({
    width: 1450,
    height: 940,
    minWidth: 1_050,
    minHeight: 700,
    backgroundColor: micaAvailable ? "#00000000" : "#1b1b1b",
    ...(micaAvailable ? { backgroundMaterial: "mica" as const } : {}),
    title: "ETS2 Mod Manager",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event) => event.preventDefault());
  for (const [name, handler] of Object.entries(handlers))
    ipcMain.handle(name, (_event, arg) => handler(arg as never));
  await win.loadFile(path.join(__dirname, "../renderer/index.html"));
});

app.on("window-all-closed", () => app.quit());
