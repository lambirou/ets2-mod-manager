import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { readMod } from "../src/main/packages";
import { applyProfile, restoreProfile } from "../src/main/profiles";

test("lecture réelle d’un dossier de mod et rejet d’une archive corrompue", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-package-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(dir, "manifest.sii"),
    'SiiNunit\n{mod_package : .x {\ndisplay_name: "Essai"\ncompatible_versions[]: "1.61.*"\n}}',
  );
  const mod = await readMod(dir, "Local", "1.61.1");
  assert.equal(mod.name, "Essai");
  assert.deepEqual(mod.versions, ["1.61.*"]);
  const broken = path.join(dir, "broken.scs");
  await fs.writeFile(broken, "bad");
  assert.ok((await readMod(broken, "Local", "1.61")).error);
});

test("application, sauvegarde et restauration vérifiées sur un fichier temporaire", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-profile-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "profile.sii");
  const text = "SiiNunit\n{\nprofile : _x {\n active_mods: 0\n money: 10\n}\n}\n";
  await fs.writeFile(file, text);
  const backup = await applyProfile(
    file,
    ["example"],
    path.join(dir, "backup"),
  );
  assert.match(await fs.readFile(file, "utf8"), /example/);
  await restoreProfile(backup);
  assert.equal(await fs.readFile(file, "utf8"), text);
});

test("restauration refuse une modification postérieure du profil", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-concurrent-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "profile.sii");
  await fs.writeFile(file, "SiiNunit\n{profile : x {\n active_mods: 0\n}}");
  const backup = await applyProfile(
    file,
    ["example"],
    path.join(dir, "backup"),
  );
  await fs.appendFile(file, "# changé");
  await assert.rejects(() => restoreProfile(backup), /changé/);
});
