import { useEffect, useMemo, useState } from "react";
import { Button, Card, Select } from "@fluentui/react-components";
import {
  AddRegular,
  ArrowDownloadRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  CopyRegular,
  DeleteRegular,
  LayerRegular,
  RenameRegular,
} from "@fluentui/react-icons";
import type {
  Build,
  ModRecord,
  ProfileInfo,
} from "../../shared/types";
import {
  checkState,
  compatibilityLabels,
} from "../format";
import { EmptyState } from "../components/EmptyState";

export function BuildsView(props: {
  builds: Build[];
  selected: Build | undefined;
  mods: ModRecord[];
  profiles: ProfileInfo[];
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (build: Build) => void;
  onCopy: (build: Build) => void;
  onDelete: (build: Build) => void;
  onMove: (build: Build, index: number, direction: number) => void;
  onRemove: (build: Build, index: number) => void;
  onApply: (build: Build, profile: string) => void;
  onRestore: () => void;
}) {
  const [profileFile, setProfileFile] = useState("");
  const build = props.selected;
  const byId = useMemo(
    () => new Map(props.mods.map((mod) => [mod.id, mod])),
    [props.mods],
  );
  useEffect(() => {
    const current = props.profiles.some(
      (profile) => profile.file === profileFile && profile.supported,
    );
    if (!current)
      setProfileFile(
        props.profiles.find((profile) => profile.supported)?.file ?? "",
      );
  }, [props.profiles, profileFile]);

  return (
    <>
      <p className="muted intro">
        L’ordre va de la priorité la plus élevée à la plus faible. Enregistrer
        ici ne modifie pas votre profil de jeu.
      </p>
      <div className="build-head">
        {props.builds.length ? (
          <Select
            aria-label="Configuration active"
            className="build-select"
            value={build?.id ?? ""}
            onChange={(_, data) => props.onSelect(data.value)}
          >
            {props.builds.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        ) : (
          <span className="muted">Aucune configuration enregistrée</span>
        )}
        <div className="build-actions">
          <Button icon={<AddRegular />} onClick={props.onNew}>
            Nouvelle
          </Button>
          {build ? (
            <>
              <Button
                icon={<RenameRegular />}
                onClick={() => props.onRename(build)}
              >
                Renommer
              </Button>
              <Button
                icon={<CopyRegular />}
                onClick={() => props.onCopy(build)}
              >
                Copier
              </Button>
              <Button
                icon={<DeleteRegular />}
                onClick={() => props.onDelete(build)}
              >
                Supprimer
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {!build ? (
        <EmptyState icon={<LayerRegular />} title="Créez votre première configuration.">
          Ajoutez ensuite vos mods depuis la bibliothèque.
        </EmptyState>
      ) : (
        <>
          <div className="build-rows">
            {!build.ids.length ? (
              <EmptyState icon={<LayerRegular />} title="Cette configuration est vide.">
                Ajoutez des mods depuis la bibliothèque pour composer votre
                ordre de chargement.
              </EmptyState>
            ) : (
              build.ids.map((id, index) => {
                const mod = byId.get(id);
                const state = mod ? checkState(mod) : "unknown";
                return (
                  <div className="build-row" key={id + index}>
                    <span className="index-pill">{index + 1}</span>
                    <div className="result-main">
                      <h3>{mod?.name ?? id}</h3>
                      <small>
                        {mod
                          ? compatibilityLabels[state]
                          : "Paquet absent de la bibliothèque"}
                      </small>
                    </div>
                    <div className="row-actions">
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<ChevronUpRegular />}
                        aria-label="Monter"
                        disabled={index === 0}
                        onClick={() => props.onMove(build, index, -1)}
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<ChevronDownRegular />}
                        aria-label="Descendre"
                        disabled={index === build.ids.length - 1}
                        onClick={() => props.onMove(build, index, 1)}
                      />
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={() => props.onRemove(build, index)}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Card appearance="outline" className="panel profile-panel">
            <h2>Appliquer à un profil</h2>
            <p className="hint">
              Fermez le jeu avant application. Une sauvegarde est créée avant
              écriture. Les profils binaires ou chiffrés sont détectés mais ne
              sont pas modifiés par cette version.
            </p>
            <div className="profile-line">
              <Select
                aria-label="Profil ETS 2"
                value={profileFile}
                onChange={(_, data) => setProfileFile(data.value)}
              >
                {!props.profiles.length ? (
                  <option value="">Aucun profil détecté</option>
                ) : null}
                {props.profiles.map((profile) => (
                  <option
                    key={profile.file}
                    value={profile.file}
                    disabled={!profile.supported}
                  >
                    {profile.name}
                    {profile.supported ? "" : " — format non pris en charge"}
                  </option>
                ))}
              </Select>
              <Button
                appearance="primary"
                icon={<ArrowDownloadRegular />}
                disabled={!profileFile}
                onClick={() => props.onApply(build, profileFile)}
              >
                Appliquer avec sauvegarde
              </Button>
              <Button onClick={props.onRestore}>
                Restaurer une sauvegarde
              </Button>
            </div>
          </Card>
        </>
      )}
    </>
  );
}
