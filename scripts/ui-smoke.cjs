const { _electron } = require("playwright-core");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const assert = require("node:assert/strict");
(async () => {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-ui-"));
  const data = path.join(temp, "data");
  await fs.mkdir(data);
  const mods = path.join(temp, "mods");
  await fs.mkdir(path.join(mods, "sample"), { recursive: true });
  await fs.writeFile(
    path.join(mods, "sample", "manifest.sii"),
    'SiiNunit\n{mod_package : .test {\ndisplay_name: "Camion de vérification"\ncompatible_versions[]: "1.61.*"\n}}',
  );
  await fs.writeFile(
    path.join(data, "state.json"),
    JSON.stringify({
      settings: {
        home: temp,
        mod: mods,
        game: temp,
        workshop: [],
        target: "1.61.1.9",
      },
      builds: [],
    }),
  );
  let app;
  try {
    app = await _electron.launch({
      executablePath: process.env.ETS2_MANAGER_EXECUTABLE || undefined,
      args: process.env.ETS2_MANAGER_EXECUTABLE ? [] : [path.resolve(".")],
      env: { ...process.env, ETS2_MANAGER_DATA: data },
    });
    const page = await app.firstWindow();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page
      .getByRole("heading", { name: "Camion de vérification" })
      .waitFor();
    await page.getByRole("button", { name: "Détails", exact: true }).click();
    await page.locator("#detail").waitFor({ state: "visible" });
    assert.match(await page.locator("#detail-body").innerText(), /1.61/);
    await page.locator("#close-detail").click();
    await page.getByRole("button", { name: "+ Configuration" }).click();
    await page.locator('[data-view="builds"]').click();
    await page.getByRole("button", { name: "Nouvelle", exact: true }).click();
    await page.locator("#name-input").fill("Test de persistance");
    await page.locator('#name-dialog button[value="ok"]').click();
    await page.getByRole("button", { name: "Renommer", exact: true }).waitFor();
    await page.locator('[data-view="library"]').click();
    await fs.mkdir("artifacts", { recursive: true });
    await page.screenshot({ path: "artifacts/library.png" });
    assert.deepEqual(errors, []);
    await app.close();
    app = null;
    const saved = JSON.parse(
      await fs.readFile(path.join(data, "state.json"), "utf8"),
    );
    assert.equal(saved.builds.length, 2);
    assert.equal(saved.builds[1].name, "Test de persistance");
    console.log(
      "UI OK : scan, fiche, ajout, création, persistance ; aucune erreur JavaScript.",
    );
  } finally {
    if (app) await app.close();
    await fs.rm(temp, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
