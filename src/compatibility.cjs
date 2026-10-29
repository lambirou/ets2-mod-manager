function clean(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/(?:#|\/\/)(?=(?:[^"\\]*"[^"\\]*")*[^"\\]*$).*$/, ""),
    )
    .join("\n");
}
function values(text, key) {
  return [
    ...clean(text).matchAll(
      new RegExp(
        "\\b" + key + '(?:\\[\\d*\\])?\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"',
        "g",
      ),
    ),
  ].map((m) => m[1].replace(/\\"/g, '"'));
}
function parseManifest(text) {
  return {
    name: values(text, "display_name")[0],
    author: values(text, "author")[0],
    version: values(text, "package_version")[0],
    category: values(text, "category")[0] || "other",
    versions: values(text, "compatible_versions"),
    dlc: values(text, "dlc_dependencies"),
    descriptionFile: values(text, "description_file")[0],
    icon: values(text, "icon")[0],
  };
}
function matches(pattern, version) {
  const actual = String(version).trim().replace(/s$/i, "").split(".");
  const parts = String(pattern).split(".");
  if (!actual.every((p) => /^\d+$/.test(p))) return false;
  return (
    parts.every(
      (p, i) =>
        p === "*" ||
        (/^\d+$/.test(p) &&
          actual[i] !== undefined &&
          Number(p) === Number(actual[i])),
    ) &&
    (parts.at(-1) === "*" || parts.length === actual.length)
  );
}
function evaluate(mod, target, dlcs = []) {
  const missing = (mod.dlc || []).filter((d) => !dlcs.includes(d));
  const state =
    mod.error || !mod.versions?.length
      ? "unknown"
      : mod.versions.some((v) => matches(v, target))
        ? "compatible"
        : "incompatible";
  const reason =
    mod.error ||
    (!mod.versions?.length
      ? "Aucune restriction de version déclarée : fonctionnement non vérifié."
      : `Versions déclarées : ${mod.versions.join(", ")}. Cible : ${target}.`);
  return { state, reason, missing, checkedAt: new Date().toISOString() };
}
module.exports = { clean, values, parseManifest, matches, evaluate };
