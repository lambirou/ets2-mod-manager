# Plan de réalisation

Conception approuvée le 29 octobre 2026.

Application Electron avec interface locale isolée, TypeScript, modules métier testables et stockage JSON atomique. Le processus principal est compilé par TypeScript ; le rendu React utilise Fluent UI React v9 et est assemblé par Vite. Aucun service distant ni compte requis. Electron permet une distribution Windows autonome avec les outils Node déjà disponibles sur cette machine.

1. Tests des versions SCS et de la lecture de manifestes ; moteur indépendant de l'interface.
2. Inventaire local et Workshop, découverte des chemins Steam, états d'erreur par fichier.
3. Interface React avec Fluent UI React v9 (Mica, thème système), version cible, recherche et filtres, détail explicatif.
4. Connecteurs de recherche avec capacités explicites, liens de repli, import sans écrasement.
5. Configurations persistantes, ordre, sauvegarde et application aux seuls profils texte vérifiables.
6. Tests sur fichiers temporaires, scan local en lecture seule, vérification visuelle et exécutable autonome.

Les formats non encore lisibles seront signalés explicitement dans la livraison et ne seront pas assimilés à des formats compatibles. Les limites restant après la première livraison seront consignées dans README.md.
