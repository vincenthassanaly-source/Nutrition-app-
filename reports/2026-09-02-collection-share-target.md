# Nouveau module Collection (façon Raindrop) + Web Share Target — 2026-09-02

## Résumé

Nouveau module **Collection** : des collections nommées contenant des photos,
affichées en grille façon Pinterest (mosaïque de couverture par collection).
Deux façons d'ajouter une photo : depuis l'app (bouton d'ajout dans la vue
d'une collection) ou depuis le partage natif Android (Web Share Target API) —
Kilio apparaît dans le menu de partage, atterrit sur un écran de sélection de
collection (existante ou créée à la volée), et rattache la photo partagée.

## Base de données

Migration `scripts/migration-collections-2026-09-02.sql` (+ revert associé),
appliquée sur le projet Supabase `vsmtkopkqasrdnjceegp` via `apply_migration` :

- `collections` (`id`, `nom`, `ordre`, `created_at`, `updated_at`)
- `collection_items` (`id`, `collection_id` → `collections` cascade, `url`,
  `titre`, `ordre`, `created_at`, `updated_at`)
- Triggers `trg_collections_updated_at` / `trg_collection_items_updated_at`,
  réutilisant `set_updated_at()` (créée dans
  `migration-aliments-2026-08-27.sql`, pas recréée)
- Pas de RLS, pas de `user_id` — vérifié avant migration via
  `mcp__Supabase__list_tables` que les 29 tables existantes du projet sont
  déjà dans cet état depuis `migration-suppression-auth-2026-08-29.sql` ;
  `collections`/`collection_items` suivent le même pattern (mono-utilisateur)
- Types TypeScript ajoutés manuellement dans `src/lib/supabase/types.ts`
  (le repo n'a pas de script `generate_typescript_types`, les types y sont
  maintenus à la main comme pour toutes les autres tables)

### Storage

Bucket public `collection-images` créé (policies `select`/`insert`/`delete`
scopées au bucket, même pattern que `tache-images` dans
`migration-tache-images-2026-09-01.sql`). Chemin de stockage :
`${crypto.randomUUID()}.jpg` à la racine du bucket — pas de préfixe par id de
collection, car le partage natif uploade la photo *avant* que la collection
de destination soit connue.

Compression identique au pattern `uploadTacheImages`
(`src/app/actions/taches.ts`) : `sharp().rotate().resize(1600, 1600, {fit:
"inside", withoutEnlargement: true}).jpeg({quality: 75})`.

## Fichiers créés

```
scripts/
  migration-collections-2026-09-02.sql
  migration-collections-2026-09-02-revert.sql

src/lib/supabase/types.ts                        (+ tables collections/collection_items)
src/app/globals.css                              (+ --accent-collection, light/dark)
src/lib/modules.ts                                (+ entrée "Collection" dans MODULES)
src/components/BottomNav.tsx                      (+ /collection dans le match de l'onglet Plus)

src/app/actions/collections.ts                    (nouveau — server actions)

src/app/(app)/collection/
  page.tsx                                        (grille des collections)
  AddCollectionToggle.tsx                          (création à la volée)
  CollectionsGrid.tsx                              (grille façon Pinterest, columns-2)
  CollectionMosaic.tsx                             (mosaïque de couverture, 0 à 4 vignettes)
  [id]/page.tsx                                    (vue détail d'une collection)
  [id]/CollectionHeader.tsx                        (renommer / supprimer la collection)
  [id]/AddPhotoButton.tsx                          (input file/caméra, upload immédiat)
  [id]/PhotosGrid.tsx                              (grille de photos, suppression, lightbox)

src/app/collection/partage/
  route.ts                                         (Route Handler POST, cible du Web Share Target)
  choisir/page.tsx                                 (écran d'atterrissage du partage)
  choisir/ChoisirCollectionForm.tsx                 (choix collection existante / nouvelle)

public/manifest.json                               (+ share_target)
```

Les pages du module vivent sous `src/app/(app)/collection/` (groupe de
routes `(app)`, comme tous les autres modules) pour hériter du layout
partagé (`BottomNav`, `ThemeToggle`, paddings safe-area) — le groupe est
transparent pour l'URL, donc `/collection` et `/collection/[id]` restent
inchangés. La route de réception du partage (`/collection/partage` et
`/collection/partage/choisir`) est volontairement **hors** de `(app)` :
c'est un point d'entrée externe (déclenché par le système Android), pas une
page de navigation normale de l'app ; elle n'a donc que le layout racine
(polices, thème, service worker), sans barre de navigation. Une fois la
photo rattachée, `rattacherPhotoACollection` redirige vers `/collection/[id]`
qui, lui, retrouve le layout complet.

## Server actions (`src/app/actions/collections.ts`)

- `getCollectionsAvecApercu()` : une requête avec `collection_items` imbriqué
  (embed PostgREST), tronqué à 4 photos côté JS pour la mosaïque de
  couverture + nombre total de photos
- `getCollectionAvecPhotos(id)`, `getCollections()`
- `createCollection` (piloté par `useActionState`, comme `createNote`/
  `createTache`), `renameCollection`, `deleteCollection` (nettoie aussi les
  objets Storage des photos avant de supprimer la collection — cascade DB
  pour les lignes)
- `uploadCollectionPhotos(collectionId, formData)` : compresse et upload
  chaque fichier du champ `photos`, insère une ligne `collection_items` par
  fichier (même structure que `uploadTacheImages`)
- `deleteCollectionItem(id)` : supprime l'objet Storage puis la ligne
- `uploaderPhotosPartagees(fichiers)` : upload sans rattachement, appelée par
  la Route Handler de partage
- `rattacherPhotoACollection(prevState, formData)` : signature
  `(prevState, formData) => Promise<{error}>` pour rester pilotable par
  `useActionState` comme le reste du repo — crée la collection si besoin,
  insère une ligne `collection_items` par photo partagée, puis appelle
  `redirect()` vers `/collection/[id]` (jamais atteint en cas d'erreur, qui
  retourne `{error}` à la place)

Toutes les actions mutantes appellent `revalidatePath("/collection")` et
`revalidatePath(\`/collection/${id}\`)` quand l'id est connu.

## Web Share Target

`public/manifest.json` déclare :

```json
"share_target": {
  "action": "/collection/partage",
  "method": "POST",
  "enctype": "multipart/form-data",
  "params": { "files": [{ "name": "photos", "accept": ["image/*"] }] }
}
```

Flux testé (curl, en local, cf. Vérifications) : `POST /collection/partage`
avec un `multipart/form-data` → la Route Handler lit `formData.getAll("photos")`,
compresse/uploade chaque fichier via `uploaderPhotosPartagees`, puis répond
`303 See Other` vers `/collection/partage/choisir?photo=<url>` (un paramètre
`photo` répété par photo). `/collection/partage/choisir` lit les urls,
affiche un aperçu, liste les collections existantes (bouton = sélection) et
un champ "nouvelle collection" ; la soumission passe par
`rattacherPhotoACollection` puis redirige vers la collection.

Le Service Worker (`public/sw.js`) n'intercepte que les requêtes `GET`
(`if (request.method !== "GET") return;`), donc le `POST` du partage natif
n'est jamais capté par le cache-first/network-first existant — vérifié en
lisant le fichier, pas de modification nécessaire.

### Limitation iOS (documentée, comportement attendu)

`share_target` n'est pas supporté par Safari/iOS (Web Share Target API est
une extension du Web App Manifest, actuellement Chromium/Android
uniquement). Sur iOS, la clé est silencieusement ignorée par le navigateur
au parsing du manifest — Kilio n'apparaît pas dans la feuille de partage
iOS, mais rien d'autre n'est cassé : le reste du manifest (icônes,
`start_url`, `display: standalone`, etc.) continue de fonctionner
normalement, et l'ajout de photo depuis l'app (bouton dans la vue d'une
collection) reste disponible sur toutes les plateformes.

## Vérifications

- `npx tsc --noEmit` : OK (`npm install` nécessaire au préalable,
  `node_modules` absent au démarrage de la session)
- `npm run lint` (ESLint) : OK, aucun warning
- `npm run build` (`next build`, Turbopack) : OK — toutes les routes
  compilent, y compris les 4 nouvelles (`/collection`, `/collection/[id]`,
  `/collection/partage`, `/collection/partage/choisir`), toutes en rendu
  dynamique (`ƒ`)
- `npm run dev` + `curl -X POST /collection/partage` (sans fichier) : réponse
  `303` avec `Location: /collection/partage/choisir` — confirme que la Route
  Handler et la redirection fonctionnent indépendamment de Supabase
- **Non testé en navigateur réel** : le bac à sable de cette session n'a pas
  d'accès réseau sortant vers `vsmtkopkqasrdnjceegp.supabase.co` (seul l'outil
  MCP Supabase, utilisé pour appliquer la migration, y a accès) — toute page
  du serveur de dev qui interroge Supabase renvoie 500 dans ce bac à sable,
  y compris des pages préexistantes comme `/notes` (vérifié, même erreur
  `Host not in allowlist`). Ce n'est pas spécifique au code ajouté. À tester
  en conditions réelles (Vercel + téléphone Android) avant de considérer le
  flux de partage validé de bout en bout.

## Points d'attention pour la suite

- Pas de réordonnancement (drag & drop ni flèches) des collections ni des
  photos dans une collection — la colonne `ordre` existe et est respectée à
  l'affichage/à l'insertion (append en fin de liste), mais aucune UI ne
  permet de la modifier, cohérent avec le fait que ce n'était pas demandé
  dans le prompt (contrairement aux tâches/listes qui ont des flèches
  haut/bas)
- La mosaïque de couverture (`CollectionMosaic`) gère 0, 1, 2, 3 et 4+ photos
  avec des mises en page dédiées ; au-delà de 4 photos, seules les 4
  premières (par `ordre`) sont utilisées
- `deleteCollection` supprime les objets Storage des photos avant de
  supprimer la collection (la suppression des lignes `collection_items` est
  gérée par le `on delete cascade` de la contrainte, mais Postgres ne
  supprime pas les objets Storage correspondants — nettoyage explicite côté
  serveur, même logique que `deleteTacheImage`)
- Le champ `titre` de `collection_items` (prévu par le schéma demandé) n'est
  pas encore exposé dans l'UI — aucune saisie de titre par photo n'était
  demandée pour ce module, la colonne existe pour un usage futur
