import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { analyzeHashFS } from "../src/main/hashfs";

test("création et analyse réelle d’une archive HashFS v2 avec l’outil SCS", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ets2-hashfs-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const root = path.join(dir, "input");
  await fs.mkdir(root);
  await fs.writeFile(
    path.join(root, "manifest.sii"),
    'SiiNunit\n{mod_package : .x {\ndisplay_name: "HashFS vérifié"\ncompatible_versions[]: "1.61.*"\n}}',
  );
  const packer = path.resolve("tools/scs_packer.exe");
  const file = path.join(dir, "sample.scs");
  await promisify(execFile)(packer, ["create", file, "-root", root], {
    windowsHide: true,
  });
  const mod = await analyzeHashFS(
    { file, id: file, source: "Local" },
    "1.61.1",
    path.join(dir, "cache"),
    packer,
  );
  assert.equal(mod.name, "HashFS vérifié");
  assert.deepEqual(mod.versions, ["1.61.*"]);
  assert.equal(mod.file, file);
  assert.equal(mod.error, undefined);
});
