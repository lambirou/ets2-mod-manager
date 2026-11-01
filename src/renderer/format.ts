import type { CompatState, ModRecord } from "../shared/types";

export const compatibilityLabels: Record<CompatState, string> = {
  compatible: "Déclaré compatible",
  incompatible: "Déclaré incompatible",
  unknown: "Indéterminé",
};

export const categories: Record<string, string> = {
  other: "Autre",
  map: "Carte",
  truck: "Camion",
  trailer: "Remorque",
  sound: "Son",
  graphics: "Graphismes",
  physics: "Physique",
  ai_traffic: "Trafic",
  paint_job: "Peinture",
  tuning_parts: "Accessoires",
  interior: "Intérieur",
  ui: "Interface",
};

export function formatSize(bytes: number): string {
  if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + " Go";
  if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + " Mo";
  return Math.round(bytes / 1024) + " Ko";
}

export function checkState(mod: ModRecord): CompatState {
  return mod.check?.state ?? "unknown";
}

export function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(
    /^Error invoking remote method '[^']+': (?:Error: )?/,
    "",
  );
}
