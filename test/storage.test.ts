import { test } from "node:test";
import assert from "node:assert/strict";
import { replaceMods } from "../src/main/profiles";

test("préserve les autres informations et écrit les mods dans le sens du profil", () => {
  const text =
    'SiiNunit\n{\nprofile : _x {\n name: "Pilote"\n active_mods: 1\n active_mods[0]: "old"\n money: 123\n}\n}';
  const result = replaceMods(text, ["first", "second"]);
  assert.match(result, /money: 123/);
  assert.match(result, /active_mods\[0\]: "second"/);
  assert.match(result, /active_mods\[1\]: "first"/);
  assert.doesNotMatch(result, /"old"/);
});

test("refuse les formats inconnus et les identifiants injectés", () => {
  assert.throws(() => replaceMods("ScsC", []));
  assert.throws(() =>
    replaceMods(
      "SiiNunit\n{profile : x {\n active_mods: 0\n}}",
      ['a"b'],
    ),
  );
});
