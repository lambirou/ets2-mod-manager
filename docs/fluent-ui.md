# Interface Fluent 2 — Mica et verre brossé

Date : 1er novembre 2026.
État : appliqué à l'application 0.1.

## Intention

Remplacer l'ancien habillage sombre par le langage visuel Fluent 2 de Windows : fond Mica, surfaces acryliques translucides, typographie Segoe UI Variable, contrôles à 4 px de rayon et accent ambre conservé comme couleur de marque.

L'interface reste en HTML/CSS/JS sans build. Le paquet Fluent UI React ou Web Components n'est pas ajouté : l'application n'a ni bundler ni étape de compilation, et le système de design est repris directement en jetons CSS. Cela évite une dépendance lourde et garde la distribution Electron inchangée.

## Fenêtre et Mica

- `src/main.cjs` active `backgroundMaterial: "mica"` sur Windows 11 (build 22000 ou plus) et utilise `#00000000` comme fond de fenêtre.
- `nativeTheme.themeSource = "system"` suit le thème clair ou sombre de Windows.
- Sur Windows 10, ou si Mica n'est pas disponible, le fond de fenêtre devient `#1b1b1b` ; les surfaces CSS gardent le rendu verre.
- Vérifié sur Windows 11 : `DWMWA_SYSTEMBACKDROP_TYPE = 2` (Mica) et mode immersif sombre actif.

## Couches visuelles

- Voile Mica : `--mica-scrim`, translucide, avec deux halos radiaux discrets.
- Navigation : panneau acrylique `--nav-bg` avec `backdrop-filter`.
- Cartes et panneaux : surfaces `--surface` translucides, bord de 1 px, ombre courte. Le flou par carte est volontairement absent pour garder le défilement fluide avec plusieurs dizaines de mods.
- Verre brossé : fine trame diagonale via `--brush`, appliquée au fond et à la navigation, avec des bordures claires.
- Accent : ambre (`#f2be6b` en sombre, `#8a5905` en clair) pour les actions, la marque et les états actifs.
- États : vert compatible, rouge incompatible, ambre indéterminé, avec un point et un libellé, jamais seulement une couleur.

## Typographie et contrôles

- `Segoe UI Variable Display` pour les titres, `Segoe UI Variable Text` pour le texte, `Cascadia Code` pour les chemins.
- Boutons, champs et sélecteurs sur 36 px, rayon 4 px, focus visible de 2 px, survol et pression discrets.
- Icônes SVG intégrées dans le document, sans police d'icônes ni ressource distante.
- `prefers-reduced-motion` réduit les animations.

## Fichiers

- `src/main.cjs` : Mica, thème système, repli Windows 10.
- `src/ui/index.html` : structure Fluent, jeu d'icônes SVG, barre latérale.
- `src/ui/style.css` : jetons clair/sombre, surfaces, cartes, dialogues.
- `src/ui/app.js` : icônes des indicateurs et des états vides, `aria-current`, état d'analyse.
- `scripts/ui-smoke.cjs` : capture en thème sombre et attente de fin d'animation.

## Vérification

- `npm test` : 9 tests métier passent.
- `node scripts/ui-smoke.cjs` : scan, fiche, ajout, création et persistance passent sans erreur JavaScript.
- Captures : `artifacts/library.png`, `artifacts/detail.png`, `artifacts/builds.png`, `artifacts/settings.png`, `artifacts/discover.png`, `artifacts/library-light.png`, `artifacts/mica.png`.
- Le mode clair a été contrôlé dans Playwright ; le mode sombre correspond au thème Windows de la machine.

## Limites

- Mica dépend de Windows 11 et des effets de transparence activés. Le repli reste opaque.
- Les captures Playwright ne montrent pas le Mica de la fenêtre ; `mica.png` est une capture du bureau.
- La texture brossée est décorative et très légère ; elle ne doit pas dégrader la lisibilité.
