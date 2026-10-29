const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { execFile } = require("node:child_process");
const { readMod } = require("./packages.cjs");
async function analyzeHashFS(mod, target, cache, packer) {
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
      { windowsHide: true, timeout: 600000, maxBuffer: 8 * 1024 * 1024 },
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
module.exports = { analyzeHashFS };
