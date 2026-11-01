import { useEffect, useState } from "react";
import { Button, Card, Field, Input } from "@fluentui/react-components";
import { FolderRegular, SaveRegular } from "@fluentui/react-icons";
import type { Settings } from "../../shared/types";

export function SettingsView(props: {
  settings: Settings;
  onBrowse: () => Promise<string | null>;
  onSave: (settings: Settings) => void;
}) {
  const [draft, setDraft] = useState({
    home: props.settings.home,
    game: props.settings.game,
    mod: props.settings.mod,
    workshop: (props.settings.workshop ?? []).join(";"),
  });
  useEffect(() => {
    setDraft({
      home: props.settings.home,
      game: props.settings.game,
      mod: props.settings.mod,
      workshop: (props.settings.workshop ?? []).join(";"),
    });
  }, [props.settings]);

  const browse = async (key: "home" | "game" | "mod") => {
    const selected = await props.onBrowse();
    if (selected) setDraft((current) => ({ ...current, [key]: selected }));
  };

  return (
    <Card appearance="outline" className="panel settings-panel">
      <p className="muted intro">
        Les chemins sont enregistrés sur cet ordinateur. La version cible sert à
        l’analyse ; elle ne change pas la version installée du jeu.
      </p>
      {(
        [
          ["home", "Données utilisateur ETS 2"],
          ["game", "Installation du jeu"],
          ["mod", "Dossier des mods"],
        ] as const
      ).map(([key, label]) => (
        <Field key={key} label={label}>
          <div className="field-line">
            <Input
              value={draft[key]}
              onChange={(_, data) =>
                setDraft((current) => ({ ...current, [key]: data.value }))
              }
            />
            <Button
              icon={<FolderRegular />}
              onClick={() => void browse(key)}
            >
              Parcourir
            </Button>
          </div>
        </Field>
      ))}
      <Field
        label="Dossiers Workshop (un chemin par ligne)"
        hint="Séparez plusieurs chemins par un point-virgule."
      >
        <Input
          value={draft.workshop}
          onChange={(_, data) =>
            setDraft((current) => ({ ...current, workshop: data.value }))
          }
        />
      </Field>
      <div className="settings-actions">
        <Button
          appearance="primary"
          icon={<SaveRegular />}
          onClick={() =>
            props.onSave({
              home: draft.home.trim(),
              game: draft.game.trim(),
              mod: draft.mod.trim(),
              workshop: draft.workshop
                .split(";")
                .map((item) => item.trim())
                .filter(Boolean),
              target: props.settings.target,
            })
          }
        >
          Enregistrer et analyser
        </Button>
      </div>
      <p className="hint">
        Archives lisibles : dossiers et ZIP (.zip ou .scs). Les archives HashFS
        se lisent à la demande depuis leur fiche, via le Packer officiel SCS
        (extraction dans un cache local). Recherche intégrée : Steam Workshop et
        ETS2.lt ; liens officiels : TruckyMods et ProMods.
      </p>
    </Card>
  );
}
