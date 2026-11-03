# Roues de la fortune

Deux roues ajoutées à l’espace joueurs, près de Loterie. Statistiques en lecture seule dans Atelier → Roues, accessibles au principal uniquement.

- Éclats : 30 Éclats, 12 secteurs égaux. Cinq vides ; 10, 20, 30, 50, 100 Éclats ; 3 Relais ; une carte Rare (80 %) ou Précieuse (20 %).
- Destin : 100 Éclats, 20 secteurs égaux. Douze vides ; 10, 25, 50, 75, 100, 300, 500 Éclats ; un coffre (70 % : 1 Épique ; 25 % : 3 Épiques ; 5 % : 5 thématiques).

## Enregistrement

`WheelService` crée uniquement ses tables et index avec `IF NOT EXISTS`. Aucun reset ou changement du catalogue, des comptes ou du réglage des boosters. Le portefeuille partagé reste dans `settings`, comme pour les boosters, le marché et les loteries.

Le serveur utilise `crypto.getRandomValues` avec rejet des valeurs hors d’un multiple exact. Un batch D1 atomique vérifie l’ancienne valeur complète du portefeuille, enregistre un reçu permanent, débite, attribue et sauvegarde le résultat. Une erreur annule tout le batch. Les reçus sont propres au joueur et ne sont pas tronqués. Le résultat d’un lancer est immuable en base. La sélection du thème constitue une attribution unique séparée, également atomique et sans débit.

Un intervalle technique de 1,5 seconde entre lancers validés bloque les rafales concurrentes. Il ne limite pas le nombre quotidien ; l’animation normale dure 6,6 secondes. Les reprises du même identifiant ne sont pas bloquées par cet intervalle.

Les cartes surprises doivent être prêtes, de rareté validée, sans proposition en attente, illustrées et hors univers Éditions spéciales. Aucun événement d’XP d’obtention n’est émis. Les découvertes et les récompenses normales de complétion d’album gardent leur fonctionnement existant. Les boosters gagnés passent par l’ouverture et l’XP normales.

Les Relais gagnés portent `source: 'wheel'`, apparaissent sous « Relais gagnés » dans Mes boosters et ne participent ni au plafond ni au minuteur des Relais gratuits. Les autres packs conservent leur type actuel.

Le coffre thématique conserve les trois noms issus de la rotation quotidienne existante lors du gain. Le choix peut être fait après changement de journée. Le batch vérifie le coffre encore non attribué et son propriétaire, puis ajoute cinq packs dans le thème choisi et clôt le coffre. Aucune ouverture automatique.

## Interface et reprise

Le SVG a un viewBox carré indépendant de la largeur de l’écran. Le résultat serveur porte l’indice du secteur. Le client aligne le centre de ce secteur sous le pointeur fixe, après six tours et une décélération. L’historique et le résultat sont relus sur le serveur ; la clé de reprise du navigateur sert uniquement à réutiliser un identifiant après perte de réponse. L’état conservé par une ancienne requête ne peut pas effacer une clé de reprise plus récente.

Le mode de mouvement réduit passe directement au résultat. Le dialogue des thèmes retient le focus, se ferme sans perdre le coffre et reste défilable sur petit écran.

## Validation

- `node tests/wheels.cjs` : toutes les cases, limites 80/20 et 70/25/5, fréquences du générateur sécurisé, attribution et persistance, concurrence, rollback après débit, manque de fonds/média, indépendance des Relais, coffre après changement de journée, historique paginé, statistiques et portefeuille concurrent avec la loterie.
- `node tests/wheels-ui.cjs` : React DOM réel, API avec base SQLite isolée, double clic, réponse perdue, reprise après démontage de l’animation, thèmes et attribution unique, authentification et accès principal, structure SVG 320/390/768/1440, règles responsive et mouvement réduit.
- Régressions : loteries, achats de boosters, marché/échanges, albums et continuité des animations existantes.
- TypeScript et build de production.

Le navigateur cloud n’atteint pas l’aperçu `terminal.local` (connexion refusée). Les tests DOM ne valident donc pas le rendu pixel ou les performances sur un véritable iPhone/Safari.
