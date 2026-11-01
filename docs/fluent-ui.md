# Interface React et Fluent UI v9

Date : 1er novembre 2026.
État : appliqué à l'application 0.2.

## Intention

Remplacer l'interface HTML/CSS/JavaScript sans build par React et les composants officiels [Fluent UI](https://github.com/microsoft/fluentui), tout en conservant le langage visuel Windows : fond Mica, surfaces translucides, typographie Segoe UI et accent bleu Fluent. La direction Windows 11 sobre a été approuvée le 1er novembre 2026 après le rejet du premier rendu.

Les composants Fluent assurent les contrôles, les états, les dialogues, les cartes et l'accessibilité clavier. La mise en page de l'application (navigation, en-tête, liste de mods) reste en CSS, avec les jetons Fluent exposés par `FluentProvider`.

## Dépendances et compilation

- `@fluentui/react-components` 9.x : `FluentProvider`, `Button`, `Input`, `Select`, `Field`, `Card`, `Badge`, `Dialog`, `MessageBar`, `Spinner`, `Divider`.
- `@fluentui/react-icons` : icônes SVG locales.
- `react` et `react-dom` 19.
- `vite` et `@vitejs/plugin-react` : assemblage du rendu dans `dist/renderer`.
- `typescript` : vérification et compilation du processus principal, du preload, du rendu et des tests.

Les dépendances du rendu sont regroupées par Vite dans un seul fichier local. Aucune ressource n'est chargée depuis un CDN.

## Fenêtre et thème

- `src/main/main.ts` active `backgroundMaterial: "mica"` sur Windows 11 (build 22000 ou plus) et `#00000000` comme fond de fenêtre.
- `nativeTheme.themeSource = "system"`.
- Le rendu écoute `prefers-color-scheme` et choisit `webLightTheme` ou `webDarkTheme`, avec leur accent bleu natif dans `src/renderer/theme.ts`.
- Sur Windows 10, le fond de fenêtre devient `#1b1b1b` ; les surfaces CSS gardent le rendu verre.

## Contenu de sécurité

La politique CSP de `src/renderer/index.html` autorise uniquement les scripts et feuilles locales, les images `self` et `data:`, et les styles inline nécessaires à Griffel, le moteur de styles de Fluent UI. Les styles de composants sont injectés à l'exécution ; `style-src 'unsafe-inline'` est donc requis. Aucun script inline n'est autorisé.

## Couches visuelles

- Fond neutre clair ou sombre, sans halos ; Mica discret dans la navigation.
- Navigation compacte avec `backdrop-filter`, bordures de 1 px et surfaces neutres.
- Bibliothèque en tableau sémantique avec miniature de 40 px, nom/auteur, version/taille, source, compatibilité et actions. Compteurs textuels discrets.
- Accent bleu Fluent pour les actions principales et la sélection. Panneau de détails non modal à droite, fermeture par bouton ou Échap et retour du focus au déclencheur.
- États de compatibilité avec badge, libellé et couleur : vert compatible, rouge incompatible, ambre indéterminé.

## Fichiers

- `src/main/main.ts`, `src/main/preload.ts` : fenêtre, Mica, thème système et pont IPC.
- `src/shared/types.ts` : contrats typés de l'API exposée au rendu.
- `src/renderer/App.tsx` : `FluentProvider`, navigation, en-tête, messages et orchestration.
- `src/renderer/views/` : bibliothèque, découverte, configurations et paramètres.
- `src/renderer/components/` : panneau de détails, dialogue de nom et état vide.
- `src/renderer/theme.ts` : thèmes Fluent clair et sombre avec l'accent bleu natif.
- `src/renderer/styles.css` : mise en page et surfaces, adossées aux jetons Fluent.

## Vérification

- `npm run typecheck` : processus principal et rendu sans erreur TypeScript.
- `npm test` : 9 tests métier compilés passent, dont l'extraction réelle HashFS v2.
- `npm run ui-smoke` : lance Electron, vérifie le scan, la fiche, l'ajout à une configuration, la création et la persistance, puis capture les vues Bibliothèque, Détails, Configurations, Découvrir, Paramètres et le thème clair. Le même parcours passe sur l'exécutable packagé. Le test couvre aussi la recherche sans résultat, la fermeture par Échap, les actions accessibles avec le panneau ouvert et la largeur minimale de 1050 px.
- Captures : `artifacts/library.png`, `artifacts/detail.png`, `artifacts/builds.png`, `artifacts/discover.png`, `artifacts/settings.png`, `artifacts/library-light.png`, `artifacts/library-compact.png`.
- Vérification en lecture seule sur la bibliothèque locale : 47 mods ; captures `artifacts/library-real.png` et `artifacts/detail-real.png`.

## Limites

- Mica dépend de Windows 11 et des effets de transparence activés. Le repli reste opaque.
- Les captures Playwright ne montrent pas le Mica de la fenêtre.
- Griffel impose des styles inline ; la CSP les autorise tout en gardant les scripts locaux.
