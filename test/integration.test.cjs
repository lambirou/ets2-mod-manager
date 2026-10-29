const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { readMod } = require("../src/packages.cjs");
const { applyProfile, restoreProfile } = require("../src/profiles.cjs");
test("lecture réelle d’un dossier de mod et rejet d’une archive corrompue", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-package-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  await fs.writeFile(
    path.join(dir, "manifest.sii"),
    'SiiNunit\n{mod_package : .x {\ndisplay_name: "Essai"\ncompatible_versions[]: "1.61.*"\n}}',
  );
  const m = await readMod(dir, "Local", "1.61.1");
  assert.equal(m.name, "Essai");
  assert.deepEqual(m.versions, ["1.61.*"]);
  const broken = path.join(dir, "broken.scs");
  await fs.writeFile(broken, "bad");
  assert.ok((await readMod(broken, "Local", "1.61")).error);
});
test("application, sauvegarde et restauration vérifiées sur un fichier temporaire", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-profile-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, "profile.sii"),
    text = "SiiNunit\n{\nprofile : _x {\n active_mods: 0\n money: 10\n}\n}\n";
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
