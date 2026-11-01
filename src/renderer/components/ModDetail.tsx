import { useEffect, useRef } from "react";
import { Badge, Button, Divider } from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import {
  categories,
  compatibilityLabels,
  formatSize,
} from "../format";
import type { ModRecord } from "../../shared/types";

const badgeColor = {
  compatible: "success",
  incompatible: "danger",
  unknown: "warning",
} as const;

export function ModDetail(props: {
  mod: ModRecord | null;
  target: string;
  dlcs: string[];
  onClose: () => void;
  onAnalyze?: () => void;
}) {
  const { mod } = props;
  const state = mod?.check?.state ?? "unknown";
  const reason =
    mod?.check?.reason ||
    mod?.error ||
    (mod?.versions?.length
      ? "Versions déclarées : " + mod.versions.join(", ")
      : "Aucune restriction de version déclarée. Fonctionnement non vérifié.");
  const missing =
    mod?.check?.missing ??
    (mod?.dlc ?? []).filter((dlc) => !props.dlcs.includes(dlc));
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mod) return;
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [mod?.id]);
  useEffect(() => {
    if (!mod) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [mod, props.onClose]);
  if (!mod) return null;
  return (
    <aside className="detail-pane" aria-label="Détails du mod">
      <div className="detail-header">
        <span>Détails du mod</span>
        <Button ref={closeRef} appearance="subtle" icon={<DismissRegular />} aria-label="Fermer" onClick={props.onClose} />
      </div>
      <div className="detail-scroll">
        <h2>{mod.name}</h2>
        <div className="detail-content">
          <div className="detail-tags">
            <Badge appearance="tint" color="brand">
              {categories[mod.category] ?? mod.category}
            </Badge>
            <Badge appearance="tint" color={badgeColor[state]}>
              {compatibilityLabels[state]}
            </Badge>
          </div>
          <p className="detail-reason">{reason}</p>
          <p className="muted">
            Cible : {props.target}
            {mod.check?.checkedAt
              ? " · Analyse du " +
                new Date(mod.check.checkedAt).toLocaleString("fr-FR")
              : ""}
            <br />
            Origine : {mod.analyzedFile || "Lecture du paquet impossible"}
          </p>
          <Divider />
          <div className="description">
            {mod.description || "Description non disponible."}
          </div>
          <Divider />
          <div className="meta-grid">
            <span>Auteur</span>
            <strong>{mod.author || "Non renseigné"}</strong>
            <span>Version du mod</span>
            <strong>{mod.version || "Non renseignée"}</strong>
            <span>Source</span>
            <strong>{mod.source}</strong>
            <span>Taille du paquet</span>
            <strong>{formatSize(mod.size)}</strong>
            <span>Prérequis déclarés</span>
            <strong>{(mod.dlc ?? []).join(", ") || "Aucun DLC déclaré"}</strong>
            {missing.length ? (
              <>
                <span>DLC non détectés</span>
                <strong className="danger-text">{missing.join(", ")}</strong>
              </>
            ) : null}
          </div>
          <code className="path">{mod.file}</code>
          {props.onAnalyze ? (
            <div>
              <Button
                appearance="secondary"
                onClick={props.onAnalyze}
              >
                Analyser une archive HashFS
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
