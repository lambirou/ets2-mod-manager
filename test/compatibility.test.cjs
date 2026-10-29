const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  matches,
  evaluate,
  parseManifest,
} = require("../src/compatibility.cjs");
test("les motifs SCS comparent les composants, avec suffixe Steam", () => {
  assert.equal(matches("1.61.*", "1.61.1.9s"), true);
  assert.equal(matches("1.61.*", "1.610"), false);
  assert.equal(matches("1.61.*", "1.62"), false);
  assert.equal(matches("1.61.1", "1.61.1.9"), false);
});
test("absence de restriction et contradiction ne deviennent pas compatibles", () => {
  assert.equal(evaluate({ versions: [] }, "1.61").state, "unknown");
  assert.equal(
    evaluate({ versions: ["1.60.*", "1.61.*"] }, "1.61.1").state,
    "compatible",
  );
  assert.equal(
    evaluate({ versions: ["1.60.*"] }, "1.61").state,
    "incompatible",
  );
});
test("les commentaires ne créent pas de fausse restriction", () => {
  const m = parseManifest(
    'SiiNunit { mod_package : .x {\n# compatible_versions[]: "1.60.*"\n display_name: "Camion"\n compatible_versions[]: "1.61.*"\n dlc_dependencies[]: "dlc_north"\n}}',
  );
  assert.deepEqual(m.versions, ["1.61.*"]);
  assert.equal(m.name, "Camion");
  assert.deepEqual(m.dlc, ["dlc_north"]);
});
