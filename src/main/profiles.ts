import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export function replaceMods(text: string, mods: string[]): string {
  if (!text.startsWith("SiiNunit") || !/^\s*active_mods:\s*\d+\s*$/m.test(text))
    throw Error(
      "Seuls les profils SII texte avec liste de mods explicite sont pris en charge.",
    );
  if (mods.some((id) => !id || /["\r\n\\]/.test(id)))
    throw Error("Identifiant de mod invalide");
  const block = [
    " active_mods: " + mods.length,
    ...[...mods].reverse().map((id, index) => ` active_mods[${index}]: "${id}"`),
  ].join("\n");
  return text
    .replace(/^\s*active_mods\[\d+\]:[^\r\n]*(?:\r?\n|$)/gm, "")
    .replace(/^\s*active_mods:\s*\d+\s*$/m, block);
}

const digest = (buffer: Buffer) =>
  crypto.createHash("sha256").update(buffer).digest("hex");

export async function writeAtomic(
  file: string,
  content: string | Buffer,
): Promise<void> {
  const temporary = file + "." + crypto.randomUUID() + ".tmp";
  await fs.writeFile(temporary, content, { flag: "wx" });
  await fs.rename(temporary, file);
}

interface BackupRecord {
  file: string;
  content: string;
  beforeHash: string;
  afterHash: string;
}

export async function applyProfile(
  file: string,
  mods: string[],
  backups: string,
): Promise<string> {
  const before = await fs.readFile(file);
  const after = replaceMods(before.toString("utf8"), mods);
  await fs.mkdir(backups, { recursive: true });
  const backup = path.join(
    backups,
    Date.now() + "-" + crypto.randomUUID() + ".json",
  );
  const record: BackupRecord = {
    file,
    content: before.toString("base64"),
    beforeHash: digest(before),
    afterHash: digest(Buffer.from(after)),
  };
  await fs.writeFile(backup, JSON.stringify(record), { flag: "wx" });
  const verified: BackupRecord = JSON.parse(
    await fs.readFile(backup, "utf8"),
  );
  if (verified.beforeHash !== digest(Buffer.from(verified.content, "base64")))
    throw Error("Sauvegarde invalide");
  if (digest(await fs.readFile(file)) !== record.beforeHash)
    throw Error("Le profil a changé. Application annulée.");
  await writeAtomic(file, after);
  return backup;
}

export async function restoreProfile(backup: string): Promise<void> {
  const record: BackupRecord = JSON.parse(await fs.readFile(backup, "utf8"));
  if (digest(await fs.readFile(record.file)) !== record.afterHash)
    throw Error(
      "Le profil a changé depuis la sauvegarde. Restauration annulée.",
    );
  const before = Buffer.from(record.content, "base64");
  if (digest(before) !== record.beforeHash) throw Error("Sauvegarde endommagée");
  await writeAtomic(record.file, before);
}
