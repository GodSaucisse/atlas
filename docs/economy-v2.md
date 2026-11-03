# ATLAS — Économie V2 (31 octobre 2026)

Le tarif Épique passe du prix réel de 250 à 400 Éclats. Les distributions standard,
le cinquième emplacement et les adaptations événementielles restent inchangés.

- 5 défis quotidiens : 25/35/45/60/85, soit 250 Éclats.
- 5 défis hebdomadaires : 250/300/350/400 et 450 ou un Épique. Le choix peut
  encore être effectué après le lundi suivant ; il ne peut être changé après attribution.
- Connexion : 50, 75, 100, 150, Classique, 200, puis 300 + Épique. Dates civiles
  Europe/Paris, cycles répétables, interruption => jour 1, aucun XP ni rétroactivité.
- Courbe arrondie passage par passage : 19 620 XP au niveau 50, maximum 50.
  Toute l'XP effectivement enregistrée est conservée, y compris celle de l'ancienne
  migration vers la courbe plus lente. 75 Éclats par nouveau niveau, automatiques.
  Les récompenses déjà payées à 35 reçoivent une compensation unique de 40.
  Les récompenses de 35 encore en attente passent à 75 sans double versement.
  Les bonus de palier, cadres, titres, boosters et anciens historiques sont conservés.
- Recyclage : 3/6/15/30/60/150/200. Un identifiant persistant est attribué à chaque
  exemplaire ; verrouillage accessible depuis la fiche de la carte.
- Nouvelles loteries : 15/40 numéros ; Grande 80/15/5, Éditions spéciales admissibles.
  Les éditions antérieures sans snapshot conservent 20/50 et 80/20. Aucune édition
  ouverte n'est réécrite. Plage et probabilités sont figées sur chaque nouvelle édition.
  Calendrier ancré au 1er novembre 2026, tous les 3 jours, 21 h 30 Paris, inchangé.

Les opérations utilisent le même enregistrement de partie et le même contrôle CAS
que le marché, les roues et les loteries. Les reçus de défis, de connexion et de
niveaux sont permanents. Une migration hors connexion ne constitue pas une visite.

## Vérifications exécutées

- `node tests/economy-v2.cjs` : seuils, compensations, tous défis, cycles/DST,
  recyclages/verrouillages, 12 connexions simultanées, SQL transactionnel, véritables
  handlers HTTP avec base isolée, achat 400, reprise, choix concurrent, ancien/nouveau
  règlement de loterie, aucun gagnant forcé.
- `node tests/economy-v2-ui.cjs` : React/DOM, choix exclusif, double clic, calendrier
  avant les défis, 10 défis, illustrations, structure responsive et mouvement réduit.
- `node tests/epic-slot.cjs` : seuils exhaustifs des tirages et James Bond.
- `node tests/booster-purchase.cjs`, `node tests/player-hub.mjs` : achats, marché,
  échanges, dons, annulations et séquestres.
- `node tests/lottery.cjs`, `node tests/wheels.cjs`, `node tests/wheels-ui.cjs` :
  tirages, persistance, doubles requêtes, transactions, animations, reprise et coffres.
- `node tests/card-animation-continuity.cjs` : 107 modèles, 10 mises à jour,
  aucune recréation des calques.
- `node node_modules/typescript/bin/tsc --noEmit` et compilation de production.

Le rendu pixel réel desktop/mobile et Safari n'a pas été vérifié : l'ouverture de
l'aperçu a été refusée par le contrôle automatique du navigateur. Aucun contournement.
Les anciens scénarios qui codent en dur l'économie précédente ne constituent pas
les critères V2 ; le scénario `economy-v2.cjs` couvre les nouvelles exigences.

## Correction demandée : annulation des niveaux V2

Le niveau utilise à nouveau les seuils de la version 143 : coût par passage
250 + 60*(N-1) + 6*(N-1)^2. Toute l’XP cumulée est conservée.
Les futures récompenses de niveau retrouvent 35 Éclats à réclamer, avec les bonus
de palier originaux. Aucune compensation de 40 supplémentaire n’est attribuée.

Les reçus créés par V2 et les compensations effectivement versées sont repris
une seule fois. Les anciens gains légitimes et les récompenses de connexion,
défis, recyclages, loteries et roues sont conservés. Les cartes et boosters restent
intacts. Un booster de palier conservé ne sera pas attribué une deuxième fois
lorsque le joueur atteindra réellement ce palier avec les anciens seuils.
Si le supplément a déjà été dépensé, le solde est ramené à zéro et le reliquat
est repris sur les prochains gains, sans solde négatif ni saisie de cartes.

`tests/levels-rollback.cjs` vérifie la courbe originale, les compensations payées
ou en attente, les sommes exactes, l’idempotence et la récupération différée.
Les sections de tests V2 qui exigeaient 75 Éclats et la courbe courte sont remplacées
par ces contrôles de restauration.
