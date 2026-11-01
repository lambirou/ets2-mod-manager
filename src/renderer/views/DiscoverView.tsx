import { Badge, Button, Input } from "@fluentui/react-components";
import {
  OpenRegular,
  SearchRegular,
} from "@fluentui/react-icons";
import type { SearchSource } from "../../shared/types";
import { EmptyState } from "../components/EmptyState";

export function DiscoverView(props: {
  query: string;
  results: SearchSource[];
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  onOpen: (url: string) => void;
}) {
  return (
    <>
      <p className="muted intro">
        Recherchez sur plusieurs sources. Les informations annoncées restent
        distinctes de l’analyse des fichiers installés.
      </p>
      <div className="toolbar">
        <Input
          className="toolbar-search"
          contentBefore={<SearchRegular />}
          placeholder="Ex. Scania, météo, carte…"
          aria-label="Rechercher sur les sites"
          value={props.query}
          onChange={(_, data) => props.onQueryChange(data.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") props.onSearch();
          }}
        />
        <Button
          appearance="primary"
          icon={<SearchRegular />}
          onClick={props.onSearch}
        >
          Rechercher
        </Button>
      </div>

      {!props.results.length ? (
        <EmptyState icon={<SearchRegular />} title="Votre prochain mod commence ici.">
          Steam Workshop · ETS2.lt · TruckyMods · ProMods
          <br />
          Résultats intégrés lorsque disponibles, accès au site sinon.
        </EmptyState>
      ) : (
        <div className="source-list">
          {props.results.map((source) => (
            <section className="source" key={source.name}>
              <header className="source-head">
                <div>
                  <h2>{source.name}</h2>
                  <p className="muted">
                    {source.message ||
                      source.items.length +
                        " résultats · " +
                        (source.checkedAt
                          ? new Date(source.checkedAt).toLocaleString("fr-FR")
                          : "")}
                  </p>
                </div>
                <Badge appearance="tint" color="informative">
                  {source.mode === "integrated"
                    ? "Recherche intégrée"
                    : "Site officiel"}
                </Badge>
                <Button
                  appearance="secondary"
                  icon={<OpenRegular />}
                  onClick={() => props.onOpen(source.url)}
                >
                  Ouvrir {source.name}
                </Button>
              </header>
              {source.items.map((item) => (
                <div className="result-row" key={item.url}>
                  <div className="result-main">
                    <h3>{item.name}</h3>
                    <small>
                      {source.name} · {item.author || "Auteur non renseigné"}
                      <br />
                      Version annoncée :{" "}
                      {item.announced?.join(", ") || "Non renseignée"}
                    </small>
                    <p className="muted">
                      {item.description?.slice(0, 220) ||
                        "Ouvrez la fiche pour consulter les prérequis et les instructions de téléchargement."}
                    </p>
                  </div>
                  <Button
                    appearance="secondary"
                    size="small"
                    icon={<OpenRegular />}
                    onClick={() => props.onOpen(item.url)}
                  >
                    Fiche et téléchargement
                  </Button>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
