# Refonte Windows 11

Direction approuvée par Roland le 1er novembre 2026.

## Design retenu

Interface Windows 11 sobre, lisible et adaptée à une bibliothèque de nombreux mods. Fond neutre, Mica discret, accent bleu Fluent réservé aux actions et à la sélection. Navigation compacte sans slogans.

Bibliothèque en lignes : miniature de 40 px, nom et auteur, version et taille, provenance, état de compatibilité et actions. Recherche en premier, filtres et import regroupés. Les compteurs deviennent une synthèse textuelle.

Les détails apparaissent dans un panneau à droite, sans assombrir ni bloquer la bibliothèque. Le panneau se ferme par son bouton ou Échap ; les informations longues restent défilables. À la largeur minimale, les colonnes secondaires se regroupent pour préserver la lisibilité.

Les vues Configurations, Découvrir et Paramètres suivent les mêmes surfaces neutres et la même échelle typographique. Les fonctions existantes restent disponibles.

## Réalisation et validation

1. Remplacer les cartes par une liste sémantique et un panneau de détails non modal.
2. Recomposer la fenêtre et les thèmes, avec zones de défilement et barre d'état fixes.
3. Vérifier les filtres, l'ajout à une configuration, les détails, Échap, la persistance et la largeur minimale dans le test Electron.
4. Inspecter les captures clair/sombre, vérifier les types et tests métier, reconstruire et vérifier la distribution.

Critères : noms lisibles, aucun défilement horizontal de fenêtre à 1050 px, détails consultables en gardant la liste visible, aucun blocage des actions existantes.
