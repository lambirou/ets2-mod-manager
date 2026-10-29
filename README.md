# ETS2 Mod Manager — version 0.1

Application Windows en français. Code et documents dans ce dossier ; paramètres et sauvegardes dans le dossier utilisateur de l'application (AppData/Roaming/ets2-mod-manager).

## Lancement

Ouvrir `dist/ETS2-Mod-Manager-win32-x64/ETS2-Mod-Manager.exe`. Garder tout le dossier de distribution : l'exécutable dépend des fichiers qui l'accompagnent. Aucun Node.js à installer pour cette distribution.

Développement : `npm ci`, puis `npm start`. Tests métier : `npm test`. Vérification de l'interface : `node scripts/ui-smoke.cjs`. Distribution : `npm run package`.

## Fonctions disponibles

- Détection du dossier utilisateur, de la version depuis le journal, de l'installation et des bibliothèques Steam usuelles ; chemins corrigeables.
- Lecture des dossiers et ZIP/.scs ZIP, manifeste, miniature et description ; recherche par nom/auteur et filtres d'état/provenance.
- HashFS : ouvrir la fiche du paquet et choisir « Analyser une archive HashFS ». Le Packer officiel extrait dans un cache local avant lecture. Une extraction peut être volumineuse et longue. La même archive réutilise ensuite son extraction tant que sa taille/date restent identiques. Le scan rapide signale le format comme non lu tant que cette analyse à la demande n'est pas lancée. Le Packer annonce la lecture de HashFS v1/v2 ; un test réel vérifie le parcours v2.
- Compatibilité déclarée par motifs numériques et version cible ; information absente distincte de compatible ; DLC déclarés comparés aux archives installées.
- Variantes Workshop sous forme de dossiers référencés par versions.sii. Les variantes contenues dans des ZIP imbriqués ne sont pas encore lues.
- Recherche réelle Steam Workshop (jusqu'à 20 résultats) et tentative de recherche ETS2.lt avec repli navigateur si refus. Lors de la vérification du 29 octobre, Steam renvoyait des résultats et ETS2.lt répondait HTTP 403.
- TruckyMods et ProMods : accès aux catalogues officiels, sans agrégation de leurs résultats. Les capacités sont indiquées dans l'interface.
- Import manuel de fichiers .scs/.zip sans écrasement des fichiers existants.
- Configurations enregistrées, copie, renommage, suppression, ajout/retrait de mods et ordre modifiable par boutons.
- Application à un profil SII **texte** avec sauvegarde vérifiée et restauration. Les profils binaires/chiffrés restent en lecture limitée ; aucun déchiffrement ni modification des sauvegardes de carrière. Fermer le jeu avant application. Une confirmation native présente le profil et l'ordre.

## Limites restantes par rapport au cahier des charges

Cette version est une première livraison utilisable, pas encore l'intégralité du cahier des charges. Restent : indexation intégrée TruckyMods/ProMods, recherche annulable et cache réseau, association des pages sources aux paquets installés, détection fiable « déjà installé », résolution des dépendances entre mods, import de dossiers et glisser-déposer, cache d'indexation, profils binaires et variantes Workshop en ZIP imbriqué. Les imports ne sont pas automatiquement activés. Le contrôleur de compatibilité n'analyse pas tous les objets internes ni les interactions de cartes.

L'ordre peut être modifié par boutons ; le glisser-déposer et la sélection du profil dans l'en-tête restent à ajouter. La détection Steam utilise les emplacements usuels ; un emplacement non trouvé se renseigne dans Paramètres. Aucun fichier de profil réel n'a été modifié pendant le développement : les tests de modification utilisent des dossiers temporaires.

## Outil SCS

Le binaire local `tools/scs_packer.exe` a été téléchargé depuis la source officielle : https://download.eurotrucksimulator2.com/scs_packer_1_55.zip . Documentation : https://modding.scssoft.com/wiki/Documentation/Tools/Game_Archive_Packer . Il appartient à SCS Software ; le gestionnaire est un projet indépendant. Examiner les droits de redistribution de cet outil avant une publication publique.

## Validation

Tests automatisés : versions, commentaires SII, métadonnées absentes, dossier de mod, archive corrompue, modification/restauration de profil, refus d'une restauration après modification concurrente et extraction réelle HashFS v2. Le test d'interface utilise un environnement temporaire et vérifie le scan, les détails, l'ajout à une configuration, la création et la persistance.
