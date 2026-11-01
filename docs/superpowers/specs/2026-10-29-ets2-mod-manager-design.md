# Gestionnaire de mods ETS 2 — conception de la première version

Date : 29 octobre 2026.
État : périmètre approuvé dans la conversation ; document proposé à la revue avant développement.

## Objectif

Créer une nouvelle application Windows en français pour inventorier les mods ETS 2, expliquer leur compatibilité avec une version cible du jeu, rechercher des mods sur plusieurs sites et gérer des configurations de chargement par profil.

Le gestionnaire Quaaazi actuellement installé et les captures fournies servent de références fonctionnelles. Le projet dispose de son propre code et de ses propres éléments graphiques.

## Décisions validées

- Nouvelle application Windows avec une interface Fluent 2 : fond Mica sur Windows 11, thème clair ou sombre selon Windows et surfaces acryliques.
- Trois espaces : Mes mods, Découvrir, Mes configurations.
- Version cible du jeu toujours visible, détectée ou sélectionnée manuellement.
- Recherche couvrant Steam Workshop, TruckyMods, ETS2.lt et les sites officiels des créateurs, dont ProMods.
- Source indiquée pour chaque résultat, y compris lorsqu'un même mod apparaît sur plusieurs sites.
- Téléchargement guidé par ouverture de la page source, puis import du fichier obtenu par l'utilisateur.
- Configurations enregistrées avec ordre modifiable et sauvegarde avant application à un profil.
- Statistiques de carrière, galerie, radio et édition des sauvegardes ne font pas partie de cette première version.

## Contexte observé

Le journal local consulté indique une version de paquet du jeu 1.61.1.9. Cette valeur sert d'exemple ; l'application la redétectera et ne la considérera pas comme une constante.

Les chemins observés sont :

- Données utilisateur : `C:\Users\rolandedi\Documents\Euro Truck Simulator 2`.
- Mods locaux : `C:\Users\rolandedi\Documents\Euro Truck Simulator 2\mod`.
- Installation du jeu : `F:\Games\Euro Truck Simulator 2`.

Le gestionnaire de référence affiche 63 mods. La fiche de Magic Repair affiche une version du mod v1.0 et aucune version de jeu renseignée. Cette absence devra produire une explication dans notre application, sans affirmation de compatibilité.

## Parcours : Mes mods

Au premier démarrage, l'utilisateur vérifie les chemins détectés et la version cible. Il peut corriger les chemins ou saisir une version cible sans changer celle du jeu installé.

L'application inventorie les dossiers de mods locaux et les contenus Workshop accessibles sur le disque. Elle cherche les bibliothèques Steam dans leurs emplacements configurés. Si elle ne trouve rien, elle permet de choisir un dossier et explique la différence entre une bibliothèque vide et un chemin inaccessible.

La liste ou grille affiche : nom, catégorie, miniature disponible, version du mod, provenance locale ou Workshop, taille et état de compatibilité. La recherche porte sur le nom et l'auteur ; les filtres portent sur la catégorie, la provenance et l'état.

Une fiche présente la description, le nom du paquet, les versions de jeu déclarées, les prérequis, les éléments ayant conduit au résultat d'analyse et les liens sources connus. Une miniature générique est utilisée lorsqu'aucune image n'est disponible.

La lecture couvre les dossiers, ZIP, archives .scs basées sur ZIP et archives HashFS v1/v2. Un paquet non lisible reste visible avec la raison de l'échec ; il n'est pas considéré comme compatible. Les archives de téléchargement RAR/7z ne sont pas analysées comme des mods : l'application explique qu'il faut d'abord en extraire les paquets exploitables.

Le scan travaille en arrière-plan, affiche sa progression et peut être annulé. Une erreur sur un paquet n'interrompt pas le reste du scan. Le cache est invalidé lorsque le fichier change ou que la version de l'analyseur change.

## Compatibilité : règles et explications

### Deux dimensions distinctes

1. Compatibilité de version : déclaré compatible, déclaré incompatible ou indéterminé.
2. Prérequis : satisfaits, manquants ou non vérifiables.

Un mod peut donc être déclaré compatible avec 1.61.x tout en nécessitant un DLC absent. Le résumé présente les deux dimensions et leur détail, sans les écraser dans un unique voyant vert.

### Informations utilisées

- Pour les mods locaux : contraintes `compatible_versions` du manifeste, lorsqu'elles existent.
- Pour le Workshop : sélection de la variante à partir de `versions.sii`, puis lecture de son contenu. Une variante informative sans contenu jouable ne constitue pas un mod utilisable.
- Pour les résultats en ligne : versions annoncées dans les métadonnées et pages sources, avec provenance et date de consultation.
- Pour les DLC : dépendances déclarées et archives installées lisibles. La présence locale ne sera pas présentée comme une preuve de propriété du compte Steam.
- Pour les dépendances entre mods : informations explicitement connues ou renseignées ; les descriptions libres ne constituent pas un mécanisme universel de résolution.

Les versions sont comparées par composants numériques et selon les motifs documentés par SCS, notamment `1.61.*`. Une version de mod comme `2.81` ne sert jamais de version du jeu. Le suffixe d'affichage Steam `s` est normalisé pour comparer une version de jeu.

Une restriction applicable et correspondante produit « Déclaré compatible ». Une restriction explicite qui exclut la version cible produit « Déclaré incompatible ». Une absence de restriction, une lecture impossible ou des informations ambiguës produisent « Indéterminé ».

Une mention trouvée seulement dans un titre ou une description est affichée comme annonce de la source et non comme résultat d'analyse du paquet. Les contradictions sont visibles, sans remplacement silencieux de l'une des informations. Le contrôle de la version cible et celui des prérequis ne prétendent pas garantir le bon fonctionnement en jeu.

Chaque conclusion indique sa raison, son origine, la version cible et la date d'analyse. L'application ne réécrit pas les restrictions des mods pour forcer leur activation.

## Parcours : Découvrir

Une même requête est transmise aux intégrations disponibles pour Steam Workshop, TruckyMods, ETS2.lt et les sites officiels configurés. Les connecteurs ont trois capacités explicites : recherche intégrée, ouverture d'une recherche sur le site, ou accès à une page officielle enregistrée.

Chaque source affiche sa capacité réelle. Le support d'un site ne signifie pas automatiquement que son catalogue peut être interrogé depuis l'application. La faisabilité de chaque connecteur sera vérifiée avant son implémentation, à partir des interfaces disponibles et de leurs conditions d'accès. Aucun résultat simulé ne sera affiché comme un résultat réel.

Un résultat comporte, lorsque la source les fournit : nom, auteur, catégorie, miniature, version du mod, versions du jeu annoncées, date de mise à jour, page d'origine, prérequis et instructions de téléchargement. Les champs absents sont indiqués comme non renseignés.

Le filtre par version distingue les annonces correspondantes des résultats dont la version est inconnue. Les résultats inconnus peuvent être masqués volontairement, mais ne sont pas classés compatibles par défaut.

Une correspondance certaine avec un identifiant Workshop ou une association enregistrée permet d'indiquer « Déjà installé ». Une ressemblance de nom est seulement proposée comme correspondance possible. Les résultats ne sont pas fusionnés sur la seule base du titre ; les sources alternatives restent consultables.

Une source indisponible n'empêche pas les autres de répondre. Les requêtes ont une limite de durée, peuvent être annulées et conservent un cache daté. Les résultats en cache sont explicitement signalés. Les instructions issues des sites sont traitées comme du contenu à présenter, sans exécution automatique.

### Téléchargement guidé et import

1. Consulter la fiche et les versions annoncées.
2. Ouvrir la page source dans le navigateur habituel.
3. Pour Steam, s'abonner via Steam ; pour un fichier local, suivre les instructions du créateur.
4. Choisir ou déposer le fichier téléchargé dans l'application.
5. Vérifier le paquet, afficher le nom de destination et importer dans le dossier des mods.
6. Scanner le contenu importé et afficher le résultat.

Une collision de nom ou un doublon ne provoque pas d'écrasement silencieux. Le lien source d'un import lancé depuis une fiche est conservé. Aucun téléchargement ne déclenche d'activation automatique.

## Parcours : Mes configurations

Une configuration possède un nom, un jeu ETS 2, une version cible, un profil associé facultatif et une liste ordonnée de références vers des mods. Elle peut être créée, renommée, copiée, enregistrée et supprimée sans supprimer les mods eux-mêmes.

L'utilisateur ajoute ou retire des mods et les réordonne par glisser-déposer ou boutons. Le haut de la liste représente la priorité la plus élevée. Les paquets absents restent dans la configuration et sont signalés.

La première version ne prétend pas résoudre automatiquement tous les ordres de cartes. Des alertes connues peuvent être expliquées, mais un partage de chemin entre deux paquets n'est pas, à lui seul, une preuve d'incompatibilité.

### Application au profil

Enregistrer une configuration interne et appliquer une configuration au profil sont deux actions différentes.

Avant application, l'interface présente le profil exact, l'ordre final et les alertes. L'application vérifie que le jeu est fermé, que les paquets sont présents et que le format du profil est pris en charge. Les formats illisibles ne sont jamais modifiés par approximation.

Avant écriture, elle crée une sauvegarde datée et vérifiée du fichier concerné. Elle n'altère que les informations nécessaires à la liste et à l'ordre des mods, préserve les données indépendantes, écrit via un fichier temporaire puis remplace le fichier cible. Une modification concurrente du profil entraîne l'annulation de l'application.

Une restauration permet de revenir à la sauvegarde, après les mêmes vérifications de fermeture du jeu et de modification concurrente. Les contenus Workshop sont gérés dans leur emplacement Steam et ne sont pas recopiés automatiquement dans le dossier local.

## Organisation de l'interface

- Navigation latérale courte : Mes mods, Découvrir, Mes configurations, Paramètres.
- En-tête : jeu ETS 2, profil choisi et version cible, en distinguant version installée et version simulée.
- Zone centrale : liste ou grille adaptée à la vue.
- Panneau de détails : description, preuves de compatibilité, prérequis et actions.
- États visibles : chargement, annulation, liste vide, erreur partielle, mode hors connexion.
- Libellés et explications en français ; descriptions originales conservées dans leur langue.
- Les badges utilisent du texte et des icônes, pas uniquement des couleurs.

## Architecture

L'application comporte une interface Windows et un service local qui coordonne cinq composants : découverte du jeu et de Steam, lecture des paquets, évaluation de compatibilité, connecteurs de recherche, configurations et sauvegardes.

Le moteur de compatibilité ne dépend ni de l'interface ni du réseau. Les lecteurs de ZIP, dossiers et HashFS produisent la même représentation de métadonnées et des erreurs explicites. Chaque site possède un connecteur indépendant, sans modifier les règles de compatibilité.

Les paramètres, associations de sources, configurations et index sont stockés localement. Les lecteurs ne modifient pas les paquets. Les métadonnées et aperçus sont lus sans extraction complète systématique des archives volumineuses. Les entrées des archives ne doivent pas permettre d'écrire hors du dossier de travail lors d'un import.

Le choix de framework et des bibliothèques de lecture sera documenté dans le plan de réalisation après vérification des outils disponibles, de la prise en charge des formats et des contraintes de distribution Windows. L'application livrée devra se lancer sans environnement de développement.

## Vérification et critères d'acceptation

### Bibliothèque et analyse

- Lire un dossier, un ZIP, un .scs ZIP et des échantillons HashFS v1/v2.
- Garder visible une archive corrompue et expliquer pourquoi elle est illisible.
- Vérifier qu'un manifeste `1.61.*` accepte 1.61.1.9 et exclut 1.60 et 1.62.
- Vérifier les contraintes multiples et la normalisation du suffixe Steam.
- Ne pas assimiler une version de mod à une version de jeu.
- Produire « Indéterminé » sans contrainte ni information probante.
- Sélectionner la variante Workshop correcte, y compris la variante de repli documentée et le cas d'un paquet informatif.
- Distinguer DLC absent, dépendance inconnue et incompatibilité de version.
- Recalculer les résultats quand la version cible change.

### Recherche et import

- Afficher la source et un lien réel pour chaque résultat.
- Vérifier chaque connecteur sur des pages réelles, puis tester le parsing sur des échantillons stables.
- Distinguer recherche intégrée et simple ouverture d'un site.
- Continuer à afficher les réponses disponibles si une source échoue.
- Signaler les données en cache et les versions inconnues.
- Importer un paquet local sans écraser silencieusement un fichier existant.
- Ne pas exécuter de contenu trouvé dans une description ou une archive.

### Configurations et profils

- Retrouver une configuration et son ordre après redémarrage.
- Préserver les références vers des mods temporairement absents.
- Tester l'application et la restauration uniquement sur des profils de test copiés.
- Vérifier qu'une sauvegarde exploitable existe avant toute modification.
- Préserver les autres informations du profil et relire l'ordre après écriture.
- Refuser l'écriture lorsque le jeu tourne, lorsque le profil change pendant l'opération ou lorsque son format n'est pas pris en charge.

### Livraison

- Fournir une application Windows lançable, accompagnée d'instructions de lancement.
- Réaliser une vérification visuelle des trois espaces et des états d'erreur.
- Documenter les capacités effectives de chaque source et les formats de profils pris en charge.

## Ordre de réalisation

1. Socle Windows, détection des chemins et bibliothèque en lecture seule.
2. Lecture des formats et analyse de compatibilité avec preuves.
3. Recherche par source, instructions et import guidé.
4. Configurations, modification contrôlée d'un profil et restauration.
5. Vérification de l'interface et distribution Windows.

Chaque étape doit fonctionner de bout en bout avant la suivante ; aucune étape de démonstration ne doit être présentée comme la réalisation complète du périmètre.

## Références

- SCS — gestionnaire et manifeste : https://modding.scssoft.com/wiki/Documentation/Engine/Mod_manager
- SCS — variantes Workshop : https://modding.scssoft.com/wiki/Documentation/Tools/SCS_Workshop_Uploader/versions.sii
- SCS — archives HashFS : https://modding.scssoft.com/wiki/Documentation/Tools/Game_Archive_Packer
- Steam Workshop ETS 2 : https://steamcommunity.com/app/227300/workshop/
- TruckyMods : https://truckymods.io/
- ETS2.lt : https://ets2.lt/en/
- ProMods : https://promods.net/
