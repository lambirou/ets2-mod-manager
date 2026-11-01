import { useMemo } from "react";
import {
  Button,
  Badge,
  Input,
  Select,
  Spinner,
} from "@fluentui/react-components";
import {
  ArrowDownloadRegular,
  AddRegular,
  ArrowSyncRegular,
  BoxRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import type { CompatState, ModRecord } from "../../shared/types";
import {
  categories,
  formatSize,
  checkState,
  compatibilityLabels,
} from "../format";
import { EmptyState } from "../components/EmptyState";


export function LibraryView(props: {
  mods: ModRecord[];
  scanning: boolean;
  query: string;
  filter: CompatState | "";
  source: string;
  onQueryChange: (value: string) => void;
  onFilterChange: (value: CompatState | "") => void;
  onSourceChange: (value: string) => void;
  onScan: () => void;
  onCancel: () => void;
  onImport: () => void;
  onDetails: (mod: ModRecord) => void;
  onAdd: (mod: ModRecord) => void;
  selectedId?: string;
}) {
  const list = useMemo(() => {
    const needle = props.query.trim().toLowerCase();
    return props.mods.filter(
      (mod) =>
        (!needle ||
          (mod.name + " " + (mod.author ?? "")).toLowerCase().includes(needle)) &&
        (!props.filter || checkState(mod) === props.filter) &&
        (!props.source || props.source === mod.source),
    );
  }, [props.mods, props.query, props.filter, props.source]);
  const compatible = props.mods.filter(
    (mod) => checkState(mod) === "compatible",
  ).length;

  return (
    <>
      <div className="toolbar">
        <Input
          className="toolbar-search"
          contentBefore={<SearchRegular />}
          placeholder="Rechercher un nom ou un auteur…"
          aria-label="Rechercher un mod"
          value={props.query}
          onChange={(_, data) => props.onQueryChange(data.value)}
        />
        <Select
          aria-label="Filtrer par état"
          value={props.filter}
          onChange={(_, data) =>
            props.onFilterChange(data.value as CompatState | "")
          }
        >
          <option value="">Tous les états</option>
          {Object.entries(compatibilityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filtrer par source"
          value={props.source}
          onChange={(_, data) => props.onSourceChange(data.value)}
        >
          <option value="">Toutes les sources</option>
          <option value="Local">Local</option>
          <option value="Workshop">Workshop</option>
        </Select>
        <div className="toolbar-actions">
          <Button
            icon={
              props.scanning ? <Spinner size="tiny" /> : <ArrowSyncRegular />
            }
            onClick={props.scanning ? props.onCancel : props.onScan}
          >
            {props.scanning ? "Annuler" : "Actualiser"}
          </Button>
          <Button
            appearance="primary"
            icon={<ArrowDownloadRegular />}
            onClick={props.onImport}
          >
            Importer
          </Button>
        </div>
      </div>

      <div className="library-summary" role="status">
        <span><strong>{props.mods.length}</strong> mods dans la bibliothèque</span>
        <span className="summary-dot" />
        <span>{compatible} déclarés compatibles</span>
        <span className="summary-dot" />
        <span>{props.mods.length - compatible} à vérifier</span>
        {list.length !== props.mods.length ? <span> · {list.length} affichés</span> : null}
      </div>
      {list.length ? (
        <div className="mod-table-wrap">
          <table className="mod-table" aria-label="Bibliothèque des mods">
            <thead><tr>
              <th scope="col">Mod</th>
              <th scope="col" className="version-cell">Version / taille</th>
              <th scope="col" className="source-cell">Source</th>
              <th scope="col" className="compat-cell">Compatibilité</th>
              <th scope="col" className="actions-cell"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody>{list.map((mod) => {
              const state = checkState(mod);
              return <tr key={mod.id} className={props.selectedId === mod.id ? "selected-row" : undefined}>
                <td><div className="mod-identity">
                  <span className="mod-thumbnail">{mod.image ? <img alt="" src={mod.image} loading="lazy" /> : <BoxRegular />}</span>
                  <div className="mod-name">
                    <h3><button className="mod-title" onClick={() => props.onDetails(mod)}>{mod.name}</button></h3>
                    <span className="mod-subtitle">{mod.author || categories[mod.category] || mod.category}</span>
                    <span className="inline-status">{compatibilityLabels[state]} · {mod.source}</span>
                  </div>
                </div></td>
                <td className="version-cell"><span>{mod.version || "—"}</span><small>{formatSize(mod.size)}</small></td>
                <td className="source-cell">{mod.source}</td>
                <td className="compat-cell"><Badge appearance="tint" color={state === "compatible" ? "success" : state === "incompatible" ? "danger" : "warning"}>{compatibilityLabels[state]}</Badge></td>
                <td className="actions-cell"><div className="row-actions">
                  <Button size="small" appearance="subtle" onClick={() => props.onDetails(mod)}>Détails</Button>
                  <Button size="small" appearance="subtle" icon={<AddRegular />} aria-label="+ Configuration" title="Ajouter à une configuration" onClick={() => props.onAdd(mod)} />
                </div></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={props.scanning ? <ArrowSyncRegular /> : <BoxRegular />}
          title={
            props.scanning
              ? "Analyse de votre bibliothèque…"
              : props.mods.length ? "Aucun résultat" : "Votre bibliothèque est vide"
          }
        >
          {props.mods.length ? "Essayez un autre nom, auteur ou filtre." : "Importez un paquet .scs / .zip ou choisissez votre dossier dans Paramètres."}
        </EmptyState>
      )}
    </>
  );
}
