const fs = require("node:fs/promises");
const path = require("node:path");
const yauzl = require("yauzl");
const { parseManifest, clean, matches } = require("./compatibility.cjs");
function safe(name) {
  return (
    !path.posix.isAbsolute(name) &&
    !name.split(/[\\/]/).includes("..") &&
    !name.includes(":")
  );
}
async function openPackage(file) {
  const stat = await fs.stat(file);
  if (stat.isDirectory())
    return {
      size: 0,
      read: async (name) => {
        if (!safe(name)) throw Error("Chemin de ressource invalide");
        return fs.readFile(path.join(file, name));
      },
      close() {},
    };
  return new Promise((resolve, reject) =>
    yauzl.open(file, { lazyEntries: true, autoClose: false }, (err, zip) => {
      if (err) {
        reject(Error("Archive non lisible (HashFS ou fichier endommagé)."));
        return;
      }
      const entries = new Map();
      zip.on("error", reject);
      zip.on("entry", (entry) => {
        entries.set(entry.fileName, entry);
        zip.readEntry();
      });
      zip.on("end", () =>
        resolve({
          size: stat.size,
          close: () => zip.close(),
          read: (name) =>
            new Promise((res, rej) => {
              const e = entries.get(name);
              if (!e) return rej(Error("Ressource absente : " + name));
              if (e.uncompressedSize > 4 * 1024 * 1024)
                return rej(Error("Métadonnée trop volumineuse"));
              zip.openReadStream(e, (error, s) => {
                if (error) return rej(error);
                const chunks = [];
                s.on("data", (b) => chunks.push(b));
                s.on("error", rej);
                s.on("end", () => res(Buffer.concat(chunks)));
              });
            }),
        }),
      );
      zip.readEntry();
    }),
  );
}
async function readMod(file, source, target) {
  const fallback = {
    id: file,
    file,
    name: path.basename(file),
    source,
    versions: [],
    dlc: [],
    category: "other",
    size: 0,
  };
  let pkg;
  try {
    fallback.size = (await fs.stat(file)).size;
    pkg = await openPackage(file);
    let prefix = "";
    if (source === "Workshop") {
      const versions = await pkg
        .read("versions.sii")
        .then((b) => clean(b.toString()))
        .catch(() => null);
      if (versions) {
        const variants = [
          ...versions.matchAll(
            /package_version_info\s*:\s*[^\s{]+\s*\{([^}]+)\}/g,
          ),
        ].map((m) => parseManifest(m[1]));
        const blocks = [
          ...versions.matchAll(
            /package_version_info\s*:\s*[^\s{]+\s*\{([^}]+)\}/g,
          ),
        ];
        let i = variants.findIndex((v) =>
          v.versions.some((p) => matches(p, target)),
        );
        if (i < 0) i = variants.findIndex((v) => !v.versions.length);
        if (i < 0) throw Error("Aucune variante Workshop pour cette version.");
        prefix =
          (blocks[i][1].match(/package_name\s*:\s*"([^"]+)"/) || [])[1] + "/";
        fallback.versions = variants[i].versions;
      }
    }
    const text = (await pkg.read(prefix + "manifest.sii")).toString("utf8");
    const meta = parseManifest(text);
    if (source === "Workshop" && fallback.versions.length)
      meta.versions = fallback.versions;
    const mod = {
      ...fallback,
      ...meta,
      name: meta.name || fallback.name,
      analyzedFile: prefix + "manifest.sii",
    };
    if (meta.descriptionFile && safe(meta.descriptionFile))
      mod.description = await pkg
        .read(prefix + meta.descriptionFile)
        .then((b) => b.toString("utf8"))
        .catch(() => "");
    if (meta.icon && safe(meta.icon))
      mod.image = await pkg
        .read(prefix + meta.icon)
        .then((b) => "data:image/jpeg;base64," + b.toString("base64"))
        .catch(() => null);
    return mod;
  } catch (error) {
    return { ...fallback, error: error.message };
  } finally {
    pkg?.close();
  }
}
module.exports = { readMod, safe, openPackage };
