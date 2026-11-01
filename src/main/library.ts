import fs from "node:fs/promises";
import path from "node:path";
import { readMod } from "./packages";
import type {
  ScanProgress,
  ScanResult,
  Settings,
} from "../shared/types";

const entries = (dir: string) =>
  fs.readdir(dir, { withFileTypes: true }).catch(() => []);

export async function detect(documents: string): Promise<Settings> {
  const home = path.join(documents, "Euro Truck Simulator 2");
  const log = await fs
    .readFile(path.join(home, "game.log.txt"), "utf8")
    .catch(() => "");
  const version = log.match(/Loaded pack set version ([\d.]+)/)?.[1] || "";
  const game =
    log
      .match(/device (.+?)\/(?:base|def)\.scs mounted/)?.[1]
      ?.replace(/\//g, path.sep) || "";
  const steamRoots = [
    "C:\\Program Files (x86)\\Steam",
    "C:\\Program Files\\Steam",
  ];
  const libraries = new Set(steamRoots);
  for (const root of steamRoots) {
    const vdf = await fs
      .readFile(path.join(root, "steamapps", "libraryfolders.vdf"), "utf8")
      .catch(() => "");
    for (const match of vdf.matchAll(/"path"\s*"([^"]+)"/g))
      libraries.add(match[1].replace(/\\\\/g, "\\"));
  }
  if (game) libraries.add(path.resolve(game, "..", "..", ".."));
  const workshop: string[] = [];
  for (const root of libraries) {
    const directory = path.join(
      root,
      "steamapps",
      "workshop",
      "content",
      "227300",
    );
    if (await fs.stat(directory).catch(() => null)) workshop.push(directory);
  }
  return { home, game, mod: path.join(home, "mod"), workshop, target: version };
}

export async function scan(
  settings: Settings,
  onProgress: (progress: ScanProgress) => void = () => {},
  cancel: () => boolean = () => false,
): Promise<ScanResult> {
  const mods: ScanResult["mods"] = [];
  const warnings: string[] = [];
  const jobs: Array<[string, string]> = [];
  try {
    for (const entry of await fs.readdir(settings.mod, {
      withFileTypes: true,
    })) {
      if (entry.isDirectory() || /\.(scs|zip)$/i.test(entry.name))
        jobs.push([path.join(settings.mod, entry.name), "Local"]);
    }
  } catch (error) {
    warnings.push(
      "Dossier des mods inaccessible : " +
        (error instanceof Error ? error.message : String(error)),
    );
  }
  for (const root of settings.workshop ?? []) {
    for (const entry of await entries(root)) {
      if (entry.isDirectory())
        jobs.push([path.join(root, entry.name), "Workshop"]);
    }
  }
  for (const [file, source] of jobs) {
    if (cancel()) break;
    mods.push(await readMod(file, source, settings.target));
    onProgress({ done: mods.length, total: jobs.length });
    await new Promise((resolve) => setImmediate(resolve));
  }
  const dlcs = (await entries(settings.game))
    .filter((entry) => /^dlc_.+\.scs$/.test(entry.name))
    .map((entry) => entry.name.slice(0, -4));
  return { mods, dlcs, warnings, cancelled: cancel() };
}
