const api = window.manager,
  $ = (s) => document.querySelector(s);
let state,
  mods = [],
  dlcs = [],
  view = "library",
  query = "",
  filter = "",
  source = "",
  selected = "",
  searchResults = [],
  profileList = [],
  scanning = false;
const labels = {
  compatible: "Déclaré compatible",
  incompatible: "Déclaré incompatible",
  unknown: "Indéterminé",
};
const categories = {
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
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const size = (n) =>
  n > 1e9
    ? (n / 1e9).toFixed(2) + " Go"
    : n > 1e6
      ? (n / 1e6).toFixed(1) + " Mo"
      : Math.round(n / 1024) + " Ko";
function notice(s = "") {
  $("#notice").textContent = s;
}
function button(text, action, cls = "", iconName = "") {
  const b = document.createElement("button");
  b.type = "button";
  if (iconName) b.innerHTML = icon(iconName) + esc(text);
  else b.textContent = text;
  b.className = cls;
  b.onclick = () => run(action);
  return b;
}
async function run(fn) {
  try {
    await fn();
  } catch (e) {
    notice(
      e.message.replace(/^Error invoking remote method '[^']+': Error: /, ""),
    );
  }
}
function check(m) {
  return m.check?.state || "unknown";
}
function build() {
  return state.builds.find((b) => b.id === selected);
}
async function save() {
  await api.saveBuilds(state.builds);
}
async function scan() {
  scanning = true;
  render();
  $("#status").textContent = "Analyse en cours…";
  try {
    const r = await api.scan();
    mods = r.mods;
    dlcs = r.dlcs;
    notice(r.warnings.join("\n"));
    $("#status").textContent =
      mods.length +
      " mods · " +
      dlcs.length +
      " DLC installés" +
      (r.cancelled ? " · analyse interrompue" : "");
  } finally {
    scanning = false;
    render();
  }
}
function detail(m) {
  const missing = (m.dlc || []).filter((d) => !dlcs.includes(d));
  $("#detail-body").innerHTML =
    `<span class="category">${esc(categories[m.category] || m.category)}</span><h2>${esc(m.name)}</h2><span class="badge ${check(m)}">${labels[check(m)]}</span><p>${esc(m.error || (m.versions?.length ? "Versions déclarées : " + m.versions.join(", ") : "Aucune restriction de version déclarée. Fonctionnement non vérifié."))}</p><p class="muted">Cible : ${esc(state.settings.target)} · Analyse du ${esc(new Date().toLocaleString("fr-FR"))}<br>Origine : ${esc(m.analyzedFile || "Lecture du paquet impossible")}</p><hr><div class="description">${esc(m.description || "Description non disponible.")}</div><hr><p>Auteur : ${esc(m.author || "Non renseigné")}<br>Version du mod : ${esc(m.version || "Non renseignée")}<br>Source : ${esc(m.source)}<br>Taille du paquet : ${size(m.size)}</p><p>Prérequis déclarés : ${esc((m.dlc || []).join(", ") || "Aucun DLC déclaré")}<br>${missing.length ? "DLC non détectés : " + esc(missing.join(", ")) : ""}</p><code>${esc(m.file)}</code>`;
  $("#detail").showModal();
}
function card(m) {
  const c = document.createElement("article");
  c.className = "card";
  c.innerHTML =
    '<div class="card-media">' +
    (m.image
      ? '<img alt="" src="' + esc(m.image) + '">'
      : '<div class="card-fallback">' + icon("package") + "</div>") +
    '</div><div class="card-body"><div class="card-top"><span class="category">' +
    esc(categories[m.category] || m.category) +
    '</span><span class="pill">' +
    esc(m.source) +
    '</span></div><h3>' +
    esc(m.name) +
    '</h3><p class="muted">' +
    esc(m.version || "Version non renseignée") +
    " · " +
    size(m.size) +
    "<br>" +
    esc((m.description || m.error || "Métadonnées du paquet").slice(0, 90)) +
    '</p><div><span class="badge ' +
    check(m) +
    '">' +
    labels[check(m)] +
    "</span></div></div>";
  const a = document.createElement("div");
  a.className = "card-actions";
  a.append(
    button("Détails", () => detail(m)),
    button("+ Configuration", async () => {
      if (!build()) {
        if (!state.builds.length) {
          state.builds.push({
            id: crypto.randomUUID(),
            name: "Ma configuration",
            ids: [],
          });
        }
        selected = state.builds[0].id;
      }
      if (!build().ids.includes(m.id)) build().ids.push(m.id);
      await save();
      notice("Ajouté à « " + build().name + " ».");
    }),
  );
  c.append(a);
  return c;
}
function render() {
  const content = $("#content");
  content.replaceChildren();
  $("#title").textContent = {
    library: "Mes mods",
    discover: "Découvrir",
    builds: "Mes configurations",
    settings: "Paramètres",
  }[view];
  document.querySelectorAll("[data-view]").forEach((b) => {
    const active = b.dataset.view === view;
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.body.classList.toggle("is-scanning", scanning);
  ({
    library: library,
    discover: discover,
    builds: builds,
    settings: settings,
  })[view](content);
}
function library(c) {
  c.innerHTML = `<div class="summary"><div class="metric"><span class="metric-icon">${icon("package")}</span><div><span class="label">Mods inventoriés</span><strong>${mods.length}</strong></div></div><div class="metric"><span class="metric-icon">${icon("check")}</span><div><span class="label">Déclarés compatibles</span><strong>${mods.filter((m) => check(m) === "compatible").length}</strong></div></div><div class="metric"><span class="metric-icon">${icon("warning")}</span><div><span class="label">À vérifier</span><strong>${mods.filter((m) => check(m) !== "compatible").length}</strong></div></div></div><div class="toolbar"><input id="local-query" placeholder="Rechercher un nom ou un auteur…" value="${esc(query)}"><select id="filter"><option value="">Tous les états</option>${Object.entries(
    labels,
  )
    .map(
      ([k, v]) =>
        `<option value="${k}" ${filter === k ? "selected" : ""}>${v}</option>`,
    )
    .join(
      "",
    )}</select><select id="source"><option value="">Toutes les sources</option><option ${source === "Local" ? "selected" : ""}>Local</option><option ${source === "Workshop" ? "selected" : ""}>Workshop</option></select><span id="scan-actions"></span></div><div id="grid" class="grid"></div>`;
  $("#scan-actions").append(
    button(
      scanning ? "Annuler" : "Actualiser",
      scanning ? () => api.cancel() : scan,
      "",
      scanning ? "" : "refresh",
    ),
    button(
      "Importer",
      async () => {
        notice((await api.import()).join("\n"));
        await scan();
      },
      "primary",
      "import",
    ),
  );
  const update = () => {
    const grid = $("#grid");
    grid.replaceChildren();
    const list = mods.filter(
      (m) =>
        (m.name + " " + (m.author || ""))
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (!filter || check(m) === filter) &&
        (!source || source === m.source),
    );
    if (!list.length) {
      grid.className = "empty";
      grid.innerHTML =
        '<div class="empty-icon">' +
        icon(scanning ? "folder" : "package") +
        "</div><strong>" +
        (scanning ? "Analyse de votre bibliothèque…" : "Aucun mod à afficher") +
        "</strong><p>Choisissez votre dossier dans Paramètres ou importez un paquet .scs / .zip.</p>";
    } else {
      grid.className = "grid";
      list.forEach((m) => grid.append(card(m)));
    }
  };
  $("#local-query").oninput = (e) => {
    query = e.target.value;
    update();
  };
  $("#filter").onchange = (e) => {
    filter = e.target.value;
    update();
  };
  $("#source").onchange = (e) => {
    source = e.target.value;
    update();
  };
  update();
}
function discover(c) {
  c.innerHTML =
    '<p class="muted">Recherchez sur plusieurs sources. Les informations annoncées restent distinctes de l’analyse des fichiers installés.</p><div class="toolbar"><input id="online-query" placeholder="Ex. Scania, météo, carte…" value="' +
    esc(query) +
    '"><span id="online-action"></span></div><div id="results"></div>';
  $("#online-action").append(
    button(
      "Rechercher",
      async () => {
        query = $("#online-query").value;
        if (!query.trim()) return;
        $("#status").textContent = "Recherche sur les sites…";
        searchResults = await api.search(query);
        $("#status").textContent = "Recherche terminée";
        render();
      },
      "primary",
    ),
  );
  $("#online-query").onkeydown = (e) => {
    if (e.key === "Enter") $("#online-action button").click();
  };
  if (!searchResults.length)
    $("#results").innerHTML =
      '<div class="empty"><div class="empty-icon">' +
      icon("discover") +
      '</div><strong>Votre prochain mod commence ici.</strong><p>Steam Workshop · ETS2.lt · TruckyMods · ProMods<br>Résultats intégrés lorsque disponibles, accès au site sinon.</p></div>';
  for (const s of searchResults) {
    const section = document.createElement("section");
    section.className = "source";
    section.innerHTML = `<header><h2>${esc(s.name)}</h2><span class="pill">${s.mode === "integrated" ? "Recherche intégrée" : "Site officiel"}</span></header><p class="muted">${esc(s.message || s.items.length + " résultats · " + new Date(s.checkedAt).toLocaleString("fr-FR"))}</p>`;
    section.append(button("Ouvrir " + s.name, () => api.openUrl(s.url)));
    for (const m of s.items) {
      const r = document.createElement("div");
      r.className = "row";
      r.innerHTML = `<div class="name"><h3>${esc(m.name)}</h3><small>${esc(s.name)} · ${esc(m.author || "Auteur non renseigné")}<br>Version annoncée : ${esc(m.announced?.join(", ") || "Non renseignée")}</small><p class="muted">${esc(m.description?.slice(0, 220) || "Ouvrez la fiche pour consulter les prérequis et les instructions de téléchargement.")}</p></div>`;
      r.append(button("Fiche et téléchargement", () => api.openUrl(m.url)));
      section.append(r);
    }
    $("#results").append(section);
  }
}
function builds(c) {
  c.innerHTML =
    '<p class="muted">L’ordre va de la priorité la plus élevée à la plus faible. Enregistrer ici ne modifie pas votre profil de jeu.</p><div class="build-head"><select id="build-select">' +
    state.builds
      .map(
        (b) =>
          '<option value="' +
          b.id +
          '" ' +
          (b.id === selected ? "selected" : "") +
          ">" +
          esc(b.name) +
          "</option>",
      )
      .join("") +
    '</select><span id="build-actions"></span></div><div id="build-rows" class="rows"></div><hr><div id="profile-area"></div>';
  $("#build-actions").append(
    button("Nouvelle", async () => {
      const name = await askName("Nom de la configuration");
      if (!name?.trim()) return;
      const b = { id: crypto.randomUUID(), name: name.trim(), ids: [] };
      state.builds.push(b);
      selected = b.id;
      await save();
      render();
    }),
  );
  $("#build-select").onchange = (e) => {
    selected = e.target.value;
    render();
  };
  const b = build();
  if (!b) {
    $("#build-rows").innerHTML =
      '<div class="empty"><div class="empty-icon">' +
      icon("builds") +
      '</div><strong>Créez votre première configuration.</strong><p>Ajoutez ensuite vos mods depuis la bibliothèque.</p></div>';
    return;
  }
  $("#build-actions").append(
    button("Renommer", async () => {
      const n = await askName("Nouveau nom", b.name);
      if (n?.trim()) {
        b.name = n.trim();
        await save();
        render();
      }
    }),
    button("Copier", async () => {
      const copy = {
        ...b,
        id: crypto.randomUUID(),
        name: b.name + " (copie)",
        ids: [...b.ids],
      };
      state.builds.push(copy);
      selected = copy.id;
      await save();
      render();
    }),
    button("Supprimer", async () => {
      if (
        !confirm(
          "Supprimer cette configuration ? Les fichiers de mods sont conservés.",
        )
      )
        return;
      state.builds = state.builds.filter((x) => x.id !== b.id);
      selected = state.builds[0]?.id;
      await save();
      render();
    }),
  );
  b.ids.forEach((id, i) => {
    const m = mods.find((m) => m.id === id),
      r = document.createElement("div");
    r.className = "row";
    r.innerHTML =
      '<span class="pill">' +
      (i + 1) +
      '</span><div class="name">' +
      esc(m?.name || id) +
      "<small>" +
      esc(m ? labels[check(m)] : "Paquet absent de la bibliothèque") +
      "</small></div>";
    for (const [label, j] of [
      ["↑", i - 1],
      ["↓", i + 1],
    ])
      r.append(
        button(label, async () => {
          if (j < 0 || j >= b.ids.length) return;
          [b.ids[i], b.ids[j]] = [b.ids[j], b.ids[i]];
          await save();
          render();
        }),
      );
    r.append(
      button("Retirer", async () => {
        b.ids.splice(i, 1);
        await save();
        render();
      }),
    );
    $("#build-rows").append(r);
  });
  const area = $("#profile-area");
  area.innerHTML =
    '<h2>Appliquer à un profil</h2><p class="hint">Fermez le jeu avant application. Une sauvegarde est créée avant écriture. Les profils binaires ou chiffrés sont détectés mais ne sont pas modifiés par cette version.</p><select id="profile">' +
    profileList
      .map(
        (p) =>
          '<option value="' +
          esc(p.file) +
          '" ' +
          (!p.supported ? "disabled" : "") +
          ">" +
          esc(p.name) +
          (p.supported ? "" : " — format non pris en charge") +
          "</option>",
      )
      .join("") +
    "</select> ";
  area.append(
    button(
      "Appliquer avec sauvegarde",
      async () => {
        const p = $("#profile").value;
        if (!p) throw Error("Aucun profil texte pris en charge sélectionné.");
        const backup = await api.apply({ profile: p, ids: b.ids });
        if (backup) notice("Configuration appliquée. Sauvegarde : " + backup);
      },
      "primary",
    ),
    button("Restaurer une sauvegarde", async () => {
      if (await api.restore()) notice("Profil restauré.");
    }),
  );
}
function settings(c) {
  c.innerHTML =
    '<div class="form"><p class="muted">Les chemins sont enregistrés sur cet ordinateur. La version cible sert à l’analyse ; elle ne change pas la version installée du jeu.</p>' +
    [
      ["home", "Données utilisateur ETS 2"],
      ["game", "Installation du jeu"],
      ["mod", "Dossier des mods"],
    ]
      .map(
        ([key, label]) =>
          '<div class="field"><label>' +
          label +
          '</label><div class="field-line"><input id="setting-' +
          key +
          '" value="' +
          esc(state.settings[key]) +
          '"><button data-folder="' +
          key +
          '">Parcourir</button></div></div>',
      )
      .join("") +
    '<div class="field"><label>Dossiers Workshop (un chemin par ligne)</label><input id="setting-workshop" value="' +
    esc((state.settings.workshop || []).join(";")) +
    '"><small class="muted">Séparez plusieurs chemins par un point-virgule.</small></div><div id="settings-actions"></div><p class="hint">Archives lisibles : dossiers et ZIP (.zip ou .scs). Les archives HashFS se lisent à la demande depuis leur fiche, via le Packer officiel SCS (extraction dans un cache local). Recherche intégrée : Steam Workshop et ETS2.lt ; liens officiels : TruckyMods et ProMods.</p></div>';
  document.querySelectorAll("[data-folder]").forEach(
    (b) =>
      (b.onclick = () =>
        run(async () => {
          const p = await api.chooseFolder();
          if (p) $("#setting-" + b.dataset.folder).value = p;
        })),
  );
  $("#settings-actions").append(
    button(
      "Enregistrer et analyser",
      async () => {
        const s = {};
        for (const k of ["home", "game", "mod"])
          s[k] = $("#setting-" + k).value.trim();
        s.workshop = $("#setting-workshop")
          .value.split(";")
          .map((s) => s.trim())
          .filter(Boolean);
        state.settings = await api.saveSettings(s);
        profileList = await api.profiles();
        view = "library";
        await scan();
      },
      "primary",
    ),
  );
}
document.querySelectorAll("[data-view]").forEach(
  (b) =>
    (b.onclick = () => {
      view = b.dataset.view;
      notice();
      render();
    }),
);
$("#close-detail").onclick = () => $("#detail").close();
$("#target").onchange = () =>
  run(async () => {
    const target = $("#target").value.trim();
    if (!/^\d+\.\d+(?:\.\d+)*s?$/.test(target))
      throw Error("Saisis une version numérique, par exemple 1.61.1.9.");
    state.settings = await api.saveSettings({ target });
    await scan();
  });
window.progress.listen(
  (p) =>
    ($("#status").textContent = `Analyse : ${p.done} / ${p.total} paquets`),
);
run(async () => {
  state = await api.init();
  selected = state.builds[0]?.id;
  $("#target").value = state.settings.target;
  profileList = await api.profiles();
  await scan();
});

function askName(title, value = "") {
  return new Promise((resolve) => {
    const d = document.querySelector("#name-dialog");
    document.querySelector("#name-title").textContent = title;
    document.querySelector("#name-input").value = value;
    d.addEventListener(
      "close",
      () =>
        resolve(
          d.returnValue === "ok"
            ? document.querySelector("#name-input").value
            : null,
        ),
      { once: true },
    );
    d.showModal();
    document.querySelector("#name-input").focus();
  });
}
