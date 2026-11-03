# Loteries ATLAS

Prix fixes : quotidienne 50 Éclats (1–20, 21 h Paris), Grande Loterie 150 Éclats (1–50, tous les trois jours à 21 h 30 Paris). Calendrier de la Grande Loterie ancré au 1er novembre 2026. Les dates de clôture sont enregistrées et contrôlées par SQLite lors de la transaction. Les tâches Sites peuvent traiter après la clôture, sans visiteur connecté. Les visites déclenchent aussi le rattrapage. Aucune édition manquée n’est inventée rétroactivement.

Le MCP du Site fournit `lottery_process_due`, réservé au propriétaire, puis `lottery_scheduler_status` pour vérifier les états persistés et le dernier passage. Les tâches Sites liées doivent utiliser ces outils, sans navigateur ni compte joueur. Aucun secret dans les tâches. Aucune republication nécessaire après un tirage. Vérifier `scheduler_at` après un appel et un passage planifié : une tâche enregistrée ne prouve pas son exécution.

Les six tables propres aux loteries imposent l’unicité édition/numéro et édition/joueur. Un reçu idempotent avec CHECK d’état est créé dans le même batch D1 que le débit et la réservation. Un échec annule tout. Les modifications de soldes/inventaires comparent le JSON précédent pour coexister avec le jeu. Attribution et clôture sont atomiques. Pas d’XP d’obtention ; la première complétion d’album suit ses règles habituelles.

Une graine cryptographique est générée avant ouverture ; SHA-256(graine:identifiant) est publié, la graine révélée après tirage. Le numéro utilise SHA-256(graine:identifiant:compteur) avec rejet du biais modulo. Des triggers figent le lot et la graine, et empêchent les modifications d’un résultat clos. Une rareté sans modèle admissible déclenche une anomalie sans redistribuer les probabilités. Le principal peut suspendre/reprendre avec motif historisé, jamais forcer le numéro.

`node tests/lottery.cjs` utilise SQLite isolé : achats, persistance/idempotence, concurrence, clôture, rollback sans perte de ticket, lot/résultats immuables, attribution unique, absence de gagnant, découverte sans XP, probabilités sur 100 000 essais/type, univers, anomalies et changements d’heure. Aucun faux joueur ou tirage dans la base de production.

## Accès autonome HTTP

Si les outils MCP ne sont pas connectés, utiliser POST puis GET `/api/lottery/service` sur l’URL active retournée par Sites `get_site`. Obtenir à chaque exécution le `siwc_bypass_bearer_token` existant auprès de Sites, sans le créer ni le renouveler. L’envoyer uniquement à ce Site dans `OAI-Sites-Authorization: Bearer …` et `X-Atlas-Lottery-Service: …`. Le premier en-tête franchit la barrière Sites ; le second est comparé au secret serveur `ATLAS_LOTTERY_SERVICE_TOKEN`. La route est limitée au traitement des échéances, sans paramètres permettant de modifier les résultats. Ne jamais enregistrer le secret dans le code, les fichiers ou le prompt de la tâche. Après une rotation volontaire de l’accès Sites, reconfigurer ce secret puis vérifier une nouvelle exécution.
