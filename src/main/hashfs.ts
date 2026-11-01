import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { readMod } from "./packages";
import type { ModRecord } from "../shared/types";

export async function analyzeHashFS(
  mod: Pick<ModRecord, "file" | "id" | "source">,
  target: string,
  cache: string,
  packer: string,
): Promise<ModRecord> {
  const handle = await fs.open(mod.file, "r");
  const magic = Buffer.alloc(4);
  try {
    await handle.read(magic, 0, 4, 0);
  } finally {
    await handle.close();
  }
  if (magic.toString() !== "SCS#")
    throw Error("Ce fichier n’est pas une archive HashFS reconnue.");
  const stat = await fs.stat(mod.file);
  const key = crypto
    .createHash("sha256")
    .update(JSON.stringify([mod.file, stat.size, stat.mtimeMs]))
    .digest("hex");
  const root = path.join(cache, key);
  const marker = path.join(root, ".extracted");
  await fs.mkdir(root, { recursive: true });
  if (!(await fs.stat(marker).catch(() => null))) {
    await promisify(execFile)(
      packer,
      ["extract", mod.file, "-root", root, "-io-buffers-size", "64"],
      { windowsHide: true, timeout: 600_000, maxBuffer: 8 * 1024 * 1024 },
    );
    await fs.writeFile(marker, "ok");
  }
  const result = await readMod(root, mod.source, target);
  return {
    ...result,
    id: mod.id,
    file: mod.file,
    size: stat.size,
    analyzedFile: "HashFS extrait / " + (result.analyzedFile || "manifest.sii"),
  };
}
