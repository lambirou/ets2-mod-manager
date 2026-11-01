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
  const fixtures = [
    ["map", "Extension de carte — test", "map", "1.61.*", "Équipe Cartographie", "2.4"],
    ["sound", "Sons moteur — test", "sound", "1.60.*", "Atelier Audio", "1.8"],
    ["graphics", "Éclairage et météo — test", "graphics", "", "Studio Environnement", "3.0"],
    ["trailer", "Remorques et chargements — test", "trailer", "1.61.*", "Atelier Transport", "1.2"],
    ["traffic", "Trafic routier — test", "ai_traffic", "1.61.*", "Atelier Simulation", "2.0"],
  ];
  for (const [folder, name, category, compatible, author, version] of fixtures) {
    const directory = path.join(mods, folder);
    await fs.mkdir(directory);
    await fs.writeFile(path.join(directory, "manifest.sii"),
      `SiiNunit\n{mod_package : .test {\ndisplay_name: "${name}"\ncategory[]: "${category}"\nauthor: "${author}"\npackage_version: "${version}"\n${compatible ? `compatible_versions[]: "${compatible}"` : ""}\n}}`);
  }
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
    await page.emulateMedia({ colorScheme: "dark" });
    await fs.mkdir("artifacts", { recursive: true });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const consoleErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    await page
      .getByRole("heading", { name: "Camion de vérification" })
      .waitFor();
    assert.equal(await page.getByRole("table", { name: "Bibliothèque des mods" }).count(), 1);
    await page.getByRole("button", { name: "Détails", exact: true }).first().click();
    const detail = page.getByRole("complementary", { name: "Détails du mod" });
    await detail.waitFor({ state: "visible" });
    assert.match(await detail.innerText(), /1\.61/);
    assert.equal(await page.getByRole("button", { name: "Importer", exact: true }).isEnabled(), true);
    await page.waitForTimeout(250);
    await page.screenshot({ path: "artifacts/detail.png" });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1050, 700));
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    const footerBox = await page.locator(".statusbar").boundingBox();
    assert.ok(footerBox && footerBox.y + footerBox.height <= await page.evaluate(() => window.innerHeight));
    const addButton = page.getByRole("button", { name: "+ Configuration" }).first();
    const addBox = await addButton.boundingBox();
    const paneBox = await detail.boundingBox();
    assert.ok(addBox && paneBox && addBox.x + addBox.width <= paneBox.x);
    await page.screenshot({ path: "artifacts/library-compact.png" });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1450, 940));
    await detail.getByRole("button", { name: "Fermer" }).last().click();
    await page.getByRole("button", { name: "Détails", exact: true }).first().click();
    await page.keyboard.press("Escape");
    await detail.waitFor({ state: "hidden" });
    await page.getByRole("textbox", { name: "Rechercher un mod" }).fill("introuvable");
    await page.getByText("Aucun résultat").waitFor();
    await page.getByRole("textbox", { name: "Rechercher un mod" }).fill("");
    await page.getByRole("button", { name: "+ Configuration" }).first().click();
    await page.getByRole("button", { name: "+ Configuration" }).first().click();
    await page.getByText(/déjà dans/).waitFor();
    await page.getByRole("button", { name: "Masquer le message" }).click();
    await page.getByRole("button", { name: "Mes configurations" }).click();
    await page.waitForTimeout(250);
    await page.screenshot({ path: "artifacts/builds.png" });
    await page.getByRole("button", { name: "Nouvelle", exact: true }).click();
    await page.locator("#name-input").fill("Test de persistance");
    await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
    await page.getByRole("button", { name: "Renommer", exact: true }).waitFor();
    await page.getByRole("button", { name: "Mes mods" }).click();
    await page.waitForTimeout(350);
    await page.screenshot({ path: "artifacts/library.png" });
    await page.getByRole("button", { name: "Découvrir" }).click();
    await page
      .getByRole("heading", { name: "Découvrir" })
      .waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: "artifacts/discover.png" });
    await page.getByRole("button", { name: "Paramètres" }).click();
    await page
      .getByRole("heading", { name: "Paramètres" })
      .waitFor();
    await page.waitForTimeout(250);
    await page.screenshot({ path: "artifacts/settings.png" });
    await page.getByRole("button", { name: "Mes mods" }).click();
    await page.emulateMedia({ colorScheme: "light" });
    await page.waitForTimeout(300);
    await page.screenshot({ path: "artifacts/library-light.png" });
    assert.deepEqual(errors, []);
    assert.deepEqual(consoleErrors, []);
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
