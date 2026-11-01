import fs from "node:fs/promises";
import path from "node:path";
import yauzl, { type Entry, type ZipFile } from "yauzl";
import { parseManifest, clean, matches } from "./compatibility";
import type { ModRecord } from "../shared/types";

export function safe(name: string): boolean {
  return (
    !path.posix.isAbsolute(name) &&
    !name.split(/[\\/]/).includes("..") &&
    !name.includes(":")
  );
}

export interface PackageReader {
  size: number;
  read(name: string): Promise<Buffer>;
  close(): void;
}

export async function openPackage(file: string): Promise<PackageReader> {
  const stat = await fs.stat(file);
  if (stat.isDirectory()) {
    return {
      size: 0,
      read: async (name) => {
        if (!safe(name)) throw Error("Chemin de ressource invalide");
        return fs.readFile(path.join(file, name));
      },
      close() {},
    };
  }
  return new Promise<PackageReader>((resolve, reject) => {
    yauzl.open(file, { lazyEntries: true, autoClose: false }, (error, zip) => {
      if (error || !zip) {
        reject(Error("Archive non lisible (HashFS ou fichier endommagé)."));
        return;
      }
      const entries = new Map<string, Entry>();
      zip.on("error", reject);
      zip.on("entry", (entry: Entry) => {
        entries.set(entry.fileName, entry);
        zip.readEntry();
      });
      zip.on("end", () => {
        resolve({
          size: stat.size,
          close: () => zip.close(),
          read: (name) =>
            new Promise<Buffer>((res, rej) => {
              const entry = entries.get(name);
              if (!entry) {
                rej(Error("Ressource absente : " + name));
                return;
              }
              if (entry.uncompressedSize > 4 * 1024 * 1024) {
                rej(Error("Métadonnée trop volumineuse"));
                return;
              }
              zip.openReadStream(entry, (streamError, stream) => {
                if (streamError || !stream) {
                  rej(streamError ?? Error("Flux illisible"));
                  return;
                }
                const chunks: Buffer[] = [];
                stream.on("data", (chunk: Buffer) => chunks.push(chunk));
                stream.on("error", rej);
                stream.on("end", () => res(Buffer.concat(chunks)));
              });
            }),
        });
      });
      zip.readEntry();
    });
  });
}

export async function readMod(
  file: string,
  source: string,
  target: string,
): Promise<ModRecord> {
  const fallback: ModRecord = {
    id: file,
    file,
    name: path.basename(file),
    source,
    versions: [],
    dlc: [],
    category: "other",
    size: 0,
  };
  let pkg: PackageReader | undefined;
  try {
    fallback.size = (await fs.stat(file)).size;
    pkg = await openPackage(file);
    let prefix = "";
    if (source === "Workshop") {
      const versions = await pkg
        .read("versions.sii")
        .then((buffer) => clean(buffer.toString()))
        .catch(() => null);
      if (versions) {
        const blocks = [
          ...versions.matchAll(
            /package_version_info\s*:\s*[^\s{]+\s*\{([^}]+)\}/g,
          ),
        ];
        const variants = blocks.map((block) => parseManifest(block[1]));
        let index = variants.findIndex((variant) =>
          variant.versions.some((pattern) => matches(pattern, target)),
        );
        if (index < 0)
          index = variants.findIndex((variant) => !variant.versions.length);
        if (index < 0)
          throw Error("Aucune variante Workshop pour cette version.");
        prefix =
          (blocks[index][1].match(/package_name\s*:\s*"([^"]+)"/) ?? [])[1] +
          "/";
        fallback.versions = variants[index].versions;
      }
    }
    const text = (await pkg.read(prefix + "manifest.sii")).toString("utf8");
    const meta = parseManifest(text);
    if (source === "Workshop" && fallback.versions.length)
      meta.versions = fallback.versions;
    const mod: ModRecord = {
      ...fallback,
      ...meta,
      name: meta.name || fallback.name,
      analyzedFile: prefix + "manifest.sii",
    };
    if (meta.descriptionFile && safe(meta.descriptionFile)) {
      mod.description = await pkg
        .read(prefix + meta.descriptionFile)
        .then((buffer) => buffer.toString("utf8"))
        .catch(() => "");
    }
    if (meta.icon && safe(meta.icon)) {
      mod.image = await pkg
        .read(prefix + meta.icon)
        .then((buffer) => "data:image/jpeg;base64," + buffer.toString("base64"))
        .catch(() => null);
    }
    return mod;
  } catch (error) {
    return {
      ...fallback,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    pkg?.close();
  }
}
