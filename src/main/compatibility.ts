import type { CompatState, ModCheck, ModRecord } from "../shared/types";

export function clean(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/(?:#|\/\/)(?=(?:[^"\\]*"[^"\\]*")*[^"\\]*$).*$/, ""),
    )
    .join("\n");
}

export function values(text: string, key: string): string[] {
  return [
    ...clean(text).matchAll(
      new RegExp(
        "\\b" + key + '(?:\\[\\d*\\])?\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"',
        "g",
      ),
    ),
  ].map((match) => match[1].replace(/\\"/g, '"'));
}

export interface ManifestMetadata {
  name?: string;
  author?: string;
  version?: string;
  category: string;
  versions: string[];
  dlc: string[];
  descriptionFile?: string;
  icon?: string;
}

export function parseManifest(text: string): ManifestMetadata {
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

export function matches(pattern: string, version: string): boolean {
  const actual = String(version).trim().replace(/s$/i, "").split(".");
  const parts = String(pattern).split(".");
  if (!actual.every((part) => /^\d+$/.test(part))) return false;
  return (
    parts.every(
      (part, index) =>
        part === "*" ||
        (/^\d+$/.test(part) &&
          actual[index] !== undefined &&
          Number(part) === Number(actual[index])),
    ) && (parts.at(-1) === "*" || parts.length === actual.length)
  );
}

export function evaluate(
  mod: Pick<ModRecord, "versions"> & Partial<Pick<ModRecord, "dlc" | "error">>,
  target: string,
  dlcs: string[] = [],
): ModCheck {
  const missing = (mod.dlc ?? []).filter((dlc) => !dlcs.includes(dlc));
  const state: CompatState =
    mod.error || !mod.versions?.length
      ? "unknown"
      : mod.versions.some((pattern) => matches(pattern, target))
        ? "compatible"
        : "incompatible";
  const reason =
    mod.error ||
    (!mod.versions?.length
      ? "Aucune restriction de version déclarée : fonctionnement non vérifié."
      : `Versions déclarées : ${mod.versions.join(", ")}. Cible : ${target}.`);
  return { state, reason, missing, checkedAt: new Date().toISOString() };
}
