import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  FluentProvider,
  Input,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  Field,
} from "@fluentui/react-components";
import {
  BoxRegular,
  DismissRegular,
  LayerRegular,
  SearchRegular,
  SettingsRegular,
} from "@fluentui/react-icons";
import { darkTheme, lightTheme } from "./theme";
import { cleanError } from "./format";
import type {
  AppState,
  Build,
  CompatState,
  ModRecord,
  ProfileInfo,
  ScanResult,
  SearchSource,
  Settings,
} from "../shared/types";
import { LibraryView } from "./views/LibraryView";
import { DiscoverView } from "./views/DiscoverView";
import { BuildsView } from "./views/BuildsView";
import { SettingsView } from "./views/SettingsView";
import { ModDetail } from "./components/ModDetail";
import { NameDialog, type NameRequest } from "./components/NameDialog";

type ViewKey = "library" | "discover" | "builds" | "settings";
type NoticeKind = "info" | "success" | "warning" | "error";

const titles: Record<ViewKey, string> = {
  library: "Mes mods",
  discover: "Découvrir",
  builds: "Mes configurations",
  settings: "Paramètres",
};

const navItems = [
  { key: "library", label: "Mes mods", icon: <BoxRegular /> },
  { key: "discover", label: "Découvrir", icon: <SearchRegular /> },
  { key: "builds", label: "Mes configurations", icon: <LayerRegular /> },
] as const;

export function App() {
  const [dark, setDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const [data, setData] = useState<AppState | null>(null);
  const [mods, setMods] = useState<ModRecord[]>([]);
  const [dlcs, setDlcs] = useState<string[]>([]);
  const [view, setView] = useState<ViewKey>("library");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CompatState | "">("");
  const [source, setSource] = useState("");
  const [selectedBuildId, setSelectedBuildId] = useState("");
  const [searchResults, setSearchResults] = useState<SearchSource[]>([]);
  const [profiles, setProfiles] = useState<ProfileInfo[]>([]);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState("Prêt");
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<NoticeKind>("info");
  const [detailMod, setDetailMod] = useState<ModRecord | null>(null);
  const [targetDraft, setTargetDraft] = useState("");
  const [nameRequest, setNameRequest] = useState<NameRequest | null>(null);
  const started = useRef(false);

  const showNotice = useCallback((message: string, kind: NoticeKind = "info") => {
    setNotice(message);
    setNoticeKind(kind);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => setDark(event.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    return window.progress.listen((progress) => {
      setStatus(`Analyse : ${progress.done} / ${progress.total} paquets`);
    });
  }, []);

  const scanLibrary = useCallback(async () => {
    setScanning(true);
    setStatus("Analyse en cours…");
    try {
      const result: ScanResult = await window.manager.scan();
      setMods(result.mods);
      setDlcs(result.dlcs);
      if (result.warnings.length)
        showNotice(result.warnings.join("\n"), "warning");
      setStatus(
        result.mods.length +
          " mods · " +
          result.dlcs.length +
          " DLC installés" +
          (result.cancelled ? " · analyse interrompue" : ""),
      );
    } catch (error) {
      showNotice(cleanError(error), "error");
      setStatus("Analyse interrompue");
    } finally {
      setScanning(false);
    }
  }, [showNotice]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const initial = await window.manager.init();
        setData(initial);
        setSelectedBuildId(initial.builds[0]?.id ?? "");
        setTargetDraft(initial.settings.target);
        setProfiles(await window.manager.profiles());
        await scanLibrary();
      } catch (error) {
        showNotice(cleanError(error), "error");
        setStatus("Initialisation impossible");
      }
    })();
  }, [scanLibrary, showNotice]);

  const run = useCallback(
    async (action: () => Promise<void>) => {
      try {
        await action();
      } catch (error) {
        showNotice(cleanError(error), "error");
      }
    },
    [showNotice],
  );

  const saveSettings = useCallback(async (patch: Partial<Settings>) => {
    const settings = await window.manager.saveSettings(patch);
    setData((current) => (current ? { ...current, settings } : current));
    return settings;
  }, []);

  const saveBuilds = useCallback(
    async (builds: Build[]) => {
      setData((current) => (current ? { ...current, builds } : current));
      try {
        await window.manager.saveBuilds(builds);
      } catch (error) {
        showNotice(cleanError(error), "error");
      }
    },
    [showNotice],
  );

  const askName = useCallback(
    (title: string, value = "") =>
      new Promise<string | null>((resolve) => {
        setNameRequest({ title, value, resolve });
      }),
    [],
  );

  const closeName = (value: string | null) => {
    const request = nameRequest;
    setNameRequest(null);
    request?.resolve(value);
  };

  const currentBuild = data?.builds.find(
    (build) => build.id === selectedBuildId,
  );

  const handleNewBuild = () =>
    run(async () => {
      const name = await askName("Nom de la configuration");
      if (!name) return;
      const build: Build = {
        id: crypto.randomUUID(),
        name,
        ids: [],
      };
      await saveBuilds([...(data?.builds ?? []), build]);
      setSelectedBuildId(build.id);
    });

  const handleRename = (build: Build) =>
    run(async () => {
      const name = await askName("Nouveau nom", build.name);
      if (!name) return;
      await saveBuilds(
        (data?.builds ?? []).map((item) =>
          item.id === build.id ? { ...item, name } : item,
        ),
      );
    });

  const handleCopy = (build: Build) =>
    run(async () => {
      const copy: Build = {
        ...build,
        id: crypto.randomUUID(),
        name: build.name + " (copie)",
        ids: [...build.ids],
      };
      await saveBuilds([...(data?.builds ?? []), copy]);
      setSelectedBuildId(copy.id);
    });

  const handleDelete = (build: Build) =>
    run(async () => {
      if (
        !window.confirm(
          "Supprimer cette configuration ? Les fichiers de mods sont conservés.",
        )
      )
        return;
      const builds = (data?.builds ?? []).filter(
        (item) => item.id !== build.id,
      );
      await saveBuilds(builds);
      setSelectedBuildId(builds[0]?.id ?? "");
    });

  const handleMove = (build: Build, index: number, direction: number) =>
    run(async () => {
      const target = index + direction;
      if (target < 0 || target >= build.ids.length) return;
      const ids = [...build.ids];
      [ids[index], ids[target]] = [ids[target], ids[index]];
      await saveBuilds(
        (data?.builds ?? []).map((item) =>
          item.id === build.id ? { ...item, ids } : item,
        ),
      );
    });

  const handleRemove = (build: Build, index: number) =>
    run(async () => {
      await saveBuilds(
        (data?.builds ?? []).map((item) =>
          item.id === build.id
            ? { ...item, ids: item.ids.filter((_, i) => i !== index) }
            : item,
        ),
      );
    });

  const handleAdd = (mod: ModRecord) =>
    run(async () => {
      if (!data) return;
      let build = data.builds.find((item) => item.id === selectedBuildId);
      let builds = data.builds;
      if (!build) {
        build = {
          id: crypto.randomUUID(),
          name: "Ma configuration",
          ids: [],
        };
        builds = [...builds, build];
      }
      if (build.ids.includes(mod.id))
        showNotice(`« ${mod.name} » est déjà dans « ${build.name} ».`);
      else
        builds = builds.map((item) =>
          item.id === build!.id
            ? { ...item, ids: [...item.ids, mod.id] }
            : item,
        );
      await saveBuilds(builds);
      setSelectedBuildId(build.id);
      if (!build.ids.includes(mod.id))
        showNotice(`Ajouté à « ${build.name} ».`, "success");
    });

  const commitTarget = () =>
    run(async () => {
      const value = targetDraft.trim();
      if (value === data?.settings.target) return;
      if (!/^\d+\.\d+(?:\.\d+)*s?$/.test(value))
        throw Error(
          "Saisis une version numérique, par exemple 1.61.1.9.",
        );
      const settings = await saveSettings({ target: value });
      setTargetDraft(settings.target);
      await scanLibrary();
    });

  const handleImport = () =>
    run(async () => {
      const messages = await window.manager.import();
      if (messages.length) showNotice(messages.join("\n"), "info");
      await scanLibrary();
    });

  const handleSearch = () =>
    run(async () => {
      if (!query.trim()) return;
      setStatus("Recherche sur les sites…");
      setSearchResults(await window.manager.search(query));
      setStatus("Recherche terminée");
    });

  const handleSaveSettings = (settings: Settings) =>
    run(async () => {
      const saved = await saveSettings(settings);
      setTargetDraft(saved.target);
      setProfiles(await window.manager.profiles());
      setView("library");
      await scanLibrary();
    });

  const handleApply = (build: Build, profile: string) =>
    run(async () => {
      const backup = await window.manager.apply({
        profile,
        ids: build.ids,
      });
      if (backup)
        showNotice("Configuration appliquée. Sauvegarde : " + backup, "success");
    });

  const handleRestore = () =>
    run(async () => {
      if (await window.manager.restore()) showNotice("Profil restauré.", "success");
    });

  const handleAnalyze = (mod: ModRecord) =>
    run(async () => {
      const result = await window.manager.analyzeHashFS(mod.id);
      setMods((current) =>
        current.map((item) => (item.id === result.id ? result : item)),
      );
      setDetailMod(result);
      showNotice("Archive HashFS analysée.", "success");
    });

  const theme = dark ? darkTheme : lightTheme;

  return (
    <FluentProvider theme={theme} className="provider">
      <div className={`app ${dark ? "dark" : "light"}`}>
        <aside className="sidebar" aria-label="Navigation principale">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              E2
            </span>
            <div className="brand-text">
              <strong>ETS2 Mod Manager</strong>
              <small>Euro Truck Simulator 2</small>
            </div>
          </div>
          <nav className="nav">
            {navItems.map((item) => (
              <Button
                key={item.key}
                appearance="subtle"
                icon={item.icon}
                className="nav-item"
                aria-current={view === item.key ? "page" : undefined}
                onClick={() => {
                  setView(item.key);
                  setNotice("");
                }}
              >
                {item.label}
              </Button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <Button
              appearance="subtle"
              icon={<SettingsRegular />}
              className="nav-item"
              aria-current={view === "settings" ? "page" : undefined}
              onClick={() => {
                setView("settings");
                setNotice("");
              }}
            >
              Paramètres
            </Button>
          </div>
        </aside>

        <div className={`workspace ${view === "library" && detailMod ? "has-detail" : ""}`}>
          <header className="topbar">
            <div className="headline">
              <span className="eyebrow">Euro Truck Simulator 2</span>
              <h1>{titles[view]}</h1>
            </div>
            <Field
              className="target"
              label="Version cible ETS 2"
            >
              <Input
                value={targetDraft}
                placeholder="1.61.1.9"
                aria-label="Version cible"
                onChange={(_, input) => setTargetDraft(input.value)}
                onBlur={() => void commitTarget()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") event.currentTarget.blur();
                }}
              />
            </Field>
          </header>

          {notice ? (
            <MessageBar
              className="notice"
              intent={noticeKind}
              layout="multiline"
            >
              <MessageBarBody className="notice-body">{notice}</MessageBarBody>
              <MessageBarActions
                containerAction={
                  <Button
                    appearance="transparent"
                    icon={<DismissRegular />}
                    aria-label="Masquer le message"
                    onClick={() => setNotice("")}
                  />
                }
              />
            </MessageBar>
          ) : null}

          <div className="content-area">
            <main className="content">
              {view === "library" ? (
                <LibraryView
                  mods={mods}
                  selectedId={detailMod?.id}
                  scanning={scanning}
                  query={query}
                  filter={filter}
                  source={source}
                  onQueryChange={setQuery}
                  onFilterChange={setFilter}
                  onSourceChange={setSource}
                  onScan={() => void scanLibrary()}
                  onCancel={() => void window.manager.cancel()}
                  onImport={() => void handleImport()}
                  onDetails={setDetailMod}
                  onAdd={(mod) => void handleAdd(mod)}
                />
              ) : null}
              {view === "discover" ? (
                <DiscoverView
                  query={query}
                  results={searchResults}
                  onQueryChange={setQuery}
                  onSearch={() => void handleSearch()}
                  onOpen={(url) =>
                    void run(async () => {
                      await window.manager.openUrl(url);
                    })
                  }
                />
              ) : null}
              {view === "builds" ? (
                <BuildsView
                  builds={data?.builds ?? []}
                  selected={currentBuild}
                  mods={mods}
                  profiles={profiles}
                  onSelect={setSelectedBuildId}
                  onNew={() => void handleNewBuild()}
                  onRename={(build) => void handleRename(build)}
                  onCopy={(build) => void handleCopy(build)}
                  onDelete={(build) => void handleDelete(build)}
                  onMove={(build, index, direction) =>
                    void handleMove(build, index, direction)
                  }
                  onRemove={(build, index) => void handleRemove(build, index)}
                  onApply={(build, profile) => void handleApply(build, profile)}
                  onRestore={() => void handleRestore()}
                />
              ) : null}
              {view === "settings" && data ? (
                <SettingsView
                  settings={data.settings}
                  onBrowse={() => window.manager.chooseFolder()}
                  onSave={(settings) => void handleSaveSettings(settings)}
                />
              ) : null}
            </main>
            <ModDetail
              mod={view === "library" ? detailMod : null}
              target={data?.settings.target ?? ""}
              dlcs={dlcs}
              onClose={() => setDetailMod(null)}
              onAnalyze={
                detailMod &&
                /hashfs|non lisible/i.test(detailMod.error ?? "")
                  ? () => void handleAnalyze(detailMod)
                  : undefined
              }
            />
          </div>

          <footer className="statusbar">
            <span>{status}</span>
            <span>
              Les déclarations de compatibilité ne garantissent pas le
              fonctionnement en jeu.
            </span>
          </footer>
        </div>

        <NameDialog request={nameRequest} onClose={closeName} />
      </div>
    </FluentProvider>
  );
}
