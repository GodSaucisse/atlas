# ATLAS — Atelier privé, V1

Administration du catalogue ATLAS : cartes, illustrations, raretés, albums officiels, accès et historique. Aucun joueur, booster, marché, échange, encyclopédie publique ou album personnel n’est ouvert dans cette version.

## Décisions reprises au 22 octobre 2026

- Neuf univers : Géopolitique, Géographie, Histoire, Militaire, Aviation, Maritime, Plats, Fromages, Chrétienté. La catégorie de Chrétienté est exclusivement Catholicisme.
- Six niveaux : Courante, Inhabituelle, Rare, Précieuse, Légendaire, Suprême. Les « 12 raretés Aviation » désignent les douze attributions validées, et non douze niveaux.
- Les douze attributions exactes figurent dans `app/model.ts` ; les codes AVI-001 à trois chiffres ont été conservés.
- Huit albums Aviation conservés : Aviation ; Avions de chasse ; Avions de ligne ; Bombardiers ; Avions français ; Hélicoptères ; Avions américains ; Avions soviétiques et russes.
- Deux albums reportés : Avions britanniques ; Avions de la Seconde Guerre mondiale.
- Les cinq albums écartés ne sont pas initialisés.
- Une carte peut appartenir à plusieurs albums indépendants. L’univers n’apparaît pas sur son recto.
- Mathis est administrateur principal. Le second compte est éditeur : cartes et albums, sans modification de rareté, import/export, gestion des comptes ni corbeille.

## État initial volontairement incomplet

Seuls les douze noms/codes/raretés effectivement récupérés du cahier des charges sont initialisés. Le reste du lot de cent cartes n’a pas été reconstitué. Leurs catégories, descriptions et illustrations restent à compléter ; elles sont toutes en brouillon. Seule l’appartenance au général Aviation est préremplie. Les classements spécialisés restent à composer dans l’interface. Cela évite de présenter du contenu inventé comme validé.

Une carte doit posséder nom, numéro, catégorie, description, rareté et fichier image existant pour être marquée prête. Cet état ne donne aucun accès à des joueurs. Les palettes de l’interface sont des choix de présentation de cette V1, modifiables ensuite.

## Persistance

D1 conserve les documents de cartes et d’albums, les comptes, la révision du catalogue et le journal intégral avant/après. Les images sont déposées dans R2 et restent disponibles pour l’historique. Aucun enregistrement métier n’est stocké seulement dans le navigateur.

Chaque mutation est atomique avec son entrée d’audit. Une révision globale et un jeton de mutation empêchent les écrasements concurrents. La corbeille est réversible depuis les fiches ; les enregistrements ne sont pas supprimés définitivement. Le catalogue est initialisé une seule fois, sans réécrire les modifications à chaque déploiement.

L’import JSON est limité à 100 nouvelles cartes par lot et refuse tous les doublons sans import partiel. Il ne restaure pas les exports ni ne remplace les anciennes cartes. Les images s’ajoutent après import. L’export JSON conserve les fiches, les références d’images, les albums et l’historique intégral ; il ne contient pas les fichiers image binaires.

## Accès

La politique d’accès Sites reste privée et limitée au propriétaire. Les API exigent l’identité ChatGPT injectée par la plateforme et une autorisation en base. `ATLAS_OWNER_EMAIL`, défini dans les variables de production Sites, lie le premier compte principal à son identifiant stable de visiteur. Il n’existe aucun mot de passe local ni inscription.

Le second compte doit être autorisé à deux niveaux :
1. Enregistrer son adresse de compte ChatGPT dans « Accès & rôles » (seul le principal peut le faire).
2. Accorder à cette même adresse l’accès privé au Site par les outils ou contrôles de partage Sites.

Un rôle de visiteur du Site suffit : l’autorisation éditoriale est gérée par ATLAS. Il n’est pas nécessaire de donner accès au code source. Le formulaire ATLAS ne prétend pas envoyer une invitation. Retirer l’autorisation éditoriale coupe toutes les API, même si l’accès de partage existe encore.

## Vérifications

- `node node_modules/typescript/bin/tsc --noEmit`
- `node tests/catalog.mjs` : tests isolés du code métier contre D1/R2 locaux ; identités de test fournies uniquement dans le harnais, aucune porte dérobée dans l’application.
- Build par le helper Sites.
- Contrôle visuel navigateur non réalisé : l’aperçu géré a été bloqué par la politique du navigateur de l’environnement. Aucun autre navigateur ou contournement utilisé.

Le schéma et les migrations se trouvent dans `db/` et `drizzle/`. Les migrations ne contiennent pas de données d’initialisation. Les ressources de production sont provisionnées et migrées par Sites.

## Enrichissement Concorde du 22 octobre 2026

Opération ponctuelle portant uniquement sur AVI-027 : catégorie, description et photographie historique British Airways (G-BOAC), collection Miles Blaine / SDASM Archives, récupérée depuis Wikimedia Commons. Source de la description : Airbus Heritage (premier vol, coopération franco-britannique) et Air France (mise en service, Mach 2). Rareté, statut et appartenances existantes sont conservés.

La route de maintenance fixe `/api/maintenance/concorde` n’accepte aucun contenu libre. Elle exige un secret de production indépendant `ATLAS_CONCORDE_UPDATE_KEY`, refuse tout champ déjà rempli, passe par l’enregistrement atomique et son audit et ne peut être rejouée après succès. Le secret est retiré après vérification dans la base. Cette route ne simule aucune identité de visiteur et ne change pas les politiques d’accès.

## Direction graphique des cartes

Le recto est désormais produit par un composant SVG natif (`app/components/card-face.tsx`) : format de carte 5:7, papier sombre, photographie réelle, double filet fin teinté par la rareté, indice romain I–VI et hiérarchie typographique compacte. Le visuel de référence fourni par Mathis est repris dans sa structure, en supprimant les halos, les effets fissurés, les textures et le lettrage généré. L’univers reste absent du recto et les six niveaux validés sont conservés.

La fenêtre photographique reprend les proportions du cliché du Concorde, sans bandes ajoutées. Galerie et aperçu d’édition utilisent exactement le même composant. Des rendus de contrôle du SVG peuvent être produits par `node scripts/render-card-preview.mjs` avec un exemple local `concorde.json` dans `.sites-runtime/card-preview/`. Ce rendu vérifie le composant graphique lui-même ; il ne remplace pas une vérification complète du navigateur.

## Raretés officielles, validation et réversibilité

Les six couleurs exactes demandées sont centralisées dans `app/config/rarities.ts`. Badges, cadres SVG, filtres, récapitulatifs d’albums, catalogue et tableau d’administration utilisent ce même module. La dorure des Légendaires et l’irisation rubis des Suprêmes sont des reflets métalliques dans le cadre, sans halos. La révélation Suprême ne se joue qu’à l’ouverture d’un aperçu. Les préférences « Selon le système », « Réduites » et « Désactivées » sont stockées par compte en D1 ; `prefers-reduced-motion` est également respecté.

Chaque modèle porte une rareté actuelle, un statut de validation, une proposition indépendante et les auteurs/dates de proposition et de validation. L’éditeur peut proposer ; le principal valide, modifie des décisions déjà validées, rejette et restaure des décisions. Une proposition ne remplace pas la rareté validée utilisée par le catalogue et les albums. Les nouveaux modèles importés sont à valider, même si le JSON demande frauduleusement un statut validé.

La gestion des raretés comporte recherche, filtres par univers/catégorie/rareté/statut, menus par ligne, sélection et opérations groupées. L’historique permet au principal de restaurer les seules propriétés de rareté d’une opération, en préservant les contenus et associations d’albums plus récents. La révision globale protège toutes ces opérations contre les écrasements concurrents. La limite technique de 200 éléments par requête n’est pas un quota de modèles par rareté.

Les 12 décisions Aviation et les 4 décisions nominatives explicitement transmises sont inscrites dans une opération ponctuelle idempotente (`app/policy.ts`). Elle ne crée aucun modèle absent et ne modifie aucun album. Elle est historisée avec l’identité du principal et ne se rejoue jamais pour écraser des décisions ultérieures. Une route de maintenance restreinte à ce seul traitement exige un secret de production indépendant, révoqué après l’application et la vérification. La seule migration de schéma ajoute `settings` ; aucun ancien schéma ou enregistrement n’est supprimé.

Les paramètres de boosters sont représentés par des entiers au millième de pourcent dans `app/config/boosters.ts`, puis conservés en base et consultables en lecture seule. Chaque colonne somme exactement à 100 %. Ils ne dépendent jamais du nombre de modèles par rareté. L’export inclut ces paramètres. Les exemplaires futurs devront référencer leur modèle, et résoudre leur rareté par `resolveModelRarity` ; ils ne devront pas dupliquer une rareté figée.

À cette livraison, seuls les modules administratifs existent. Les inventaires de joueurs, l’encyclopédie, les ouvertures réelles de boosters, le marché, les enchères, les échanges et les dons ne sont pas encore implémentés ni ouverts. Le système partagé est prêt à être réutilisé par ces futurs modules, mais aucune vérification de leurs écrans inexistants n’est revendiquée.

Vérifications : 42 contrôles d’intégration D1/R2 isolés (dont 88 modèles Suprêmes simultanés, propositions/validations des deux rôles, restauration et reconnexion), compilation TypeScript, contrôle des menus et droits dans le rendu des deux rôles, rendus du composant SVG pour les six raretés, puis compilation de production. Le contrôle interactif complet en navigateur reste indisponible dans cet environnement.

## Finitions premium et comparateur (octobre 2026)

Le recto partagé est `app/components/card-face.tsx`. Les six matériaux, leurs ombres et reflets sont définis dans `app/config/rarities.ts` ; les animations et les vues du studio sont dans `app/components/card-finishes.css`. `card-visual.tsx` gère le suivi du pointeur et le toucher avec des valeurs bornées, un seul frame en attente et aucune modification de données. Les photographies sont peintes au-dessus des couches holographiques, sans filtre. Les listes compactes n’exécutent pas d’animations au repos. Les préférences globales « Réduites », « Désactivées » et `prefers-reduced-motion` priment sur le studio.

L’entrée administrative **Finitions** (`/#finitions`) compare les six matériaux avec une illustration existante, en modes fixe, animé, survol, mobile et grand format. Le lien `/#finitions/supreme` ouvre directement la Suprême en grand. Les variantes sont des copies locales de présentation ; le studio ne possède ni formulaire de sauvegarde ni appel de mutation. Le bouton « Rejouer la révélation » démontre l’effet partagé, sans ouvrir de boosters ni de nouvelles fonctionnalités joueurs.

Vérifications : `npx tsc --noEmit`, `node scripts/render-card-preview.mjs` (rendus des composants réels, 6 SVG à identifiants indépendants, catalogue gelé inchangé, 5 modes et bornes du suivi de lumière), `node scripts/render-finish-motion.mjs` (échantillonnage des images vectorielles d’après les keyframes CSS réelles, évolution des couleurs et invariance pixel à pixel de la photographie), puis compilation de production. L’animation vectorielle de contrôle n’est pas une capture navigateur. L’interaction réelle souris/tactile, les préférences système dans un navigateur et les performances sur appareils physiques restent à vérifier : l’infrastructure navigateur de cette session était indisponible. Aucune route API, migration, probabilité, rôle ni donnée de catalogue n’a changé lors de cette refonte.

## Enrichissement des onze fiches Aviation

`aviation-content.ts` et son manifeste fixe ajoutent les catégories, descriptions courtes et photographies documentaires aux onze modèles incomplets. Le Concorde est exclu. Les photographies Wikimedia Commons sont conservées sans retouche avec auteur, licence et lien source. Les références factuelles sont conservées dans le marqueur éditorial en base. Aucun statut, classement, modèle, rôle ou paramètre de rareté n’est modifié.

L’opération exige une clé indépendante temporaire, refuse d’écraser un champ renseigné, stocke d’abord les images dans R2 et applique les onze fiches en une seule révision atomique avec historique complet avant/après. Un marqueur persistant empêche le rejeu. La clé est retirée et la version redéployée après vérification. `node tests/aviation-content.mjs` contrôle les refus d’accès, les conflits, la persistance des octets, l’audit, l’usage unique et la conservation du Concorde, des raretés, albums, comptes et probabilités dans une base D1/R2 isolée.

## Import JSON avec illustrations intégrées

L’import existant accepte toujours les lots classiques, et accepte désormais une racine `{cards:[...]}` avec `illustration:{mimeType,base64,sha256}` sur chaque carte. Les champs supplémentaires de documentation (auteur, licence, source factuelle) peuvent rester dans le fichier ; `imageCredit` et `imageSource` sont conservés dans la fiche. Limite : 100 modèles et 40 Mo par fichier, 8 Mo par image. `app/import-format.ts` vérifie le format, les numéros, les albums et les octets des images. `card-import.tsx` vérifie les empreintes, transfère les images vers l’API média authentifiée, puis envoie uniquement les métadonnées et les clés obtenues à l’import atomique existant. Le bouton principal reste réservé au propriétaire. Les images déjà transférées sont réutilisées en cas de nouvelle tentative dans la même fenêtre. Une erreur avant l’enregistrement final ne crée aucune fiche partielle ; des objets média non référencés peuvent rester si l’utilisateur abandonne un transfert. Le téléchargement du modèle d’import est conservé.

Le serveur refuse toute clé image absente du stockage. Il conserve les protections contre les doublons et l’écrasement des modèles, la révision concurrente, les brouillons, la validation humaine des raretés et l’historique du lot. `node tests/import-images.mjs <fichier-json>` valide le fichier réel dans une base D1/R2 isolée : 88 illustrations décodées et contrôlées, passage de 12 à 100 modèles sans toucher aux 12 originaux, refus d’une image absente, refus de l’éditeur, persistance partagée, audit et impossibilité de rejouer le lot.

## Complétion directe du catalogue Aviation à 100 modèles

`aviation-completion.ts` consomme sept lots fixes du JSON préparé, chacun sous 2 Mo. Le manifeste serveur épingle les 88 numéros, contenus, crédits et empreintes SHA-256 des photographies ; aucune image lourde n’est incorporée au déploiement. La route ne consomme du lot que les photographies correspondant exactement à ces empreintes. Une clé indépendante temporaire est nécessaire et sera révoquée après l’opération. Chaque lot possède un marqueur d’usage unique et un audit complet, et passe par le mécanisme transactionnel existant.

Les modèles existants sont retrouvés par numéro et complétés, jamais recréés. Leurs contenus non vides, albums, états, raretés validées et propositions éditoriales existantes sont conservés. Les 63 modèles manquants sont créés en brouillon. Les raretés proposées par la délégation de Mathis restent en attente de validation finale, sans quota ni modification des probabilités. Les 12 modèles initialement complets ne font pas partie du manifeste et restent strictement inchangés. `node tests/aviation-completion.mjs` reproduit l’état réel à 37 modèles dans une base D1/R2 isolée et vérifie les sept lots, les photographies, la conservation des choix et l’aboutissement à 100 fiches complètes.

## Public source export

Personal administrator addresses and private hosting identity are excluded. Before deploying this source, configure `ATLAS_OWNER_EMAIL` and comma-separated `ATLAS_WORKSHOP_EMAILS` in Sites runtime settings and restore the existing Site identity in the hosting manifest. Existing administrator roles are still required in the database. No player data is included.
