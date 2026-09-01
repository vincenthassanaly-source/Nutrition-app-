# Ajout d'images sur les tâches + titre complet dans la liste

## Résumé

Le module Tâches permet désormais d'attacher plusieurs images à une tâche (création et édition), avec vignettes dans la liste et agrandissement en plein écran au tap. Le titre d'une tâche s'affiche intégralement dans la liste, sur plusieurs lignes si besoin, sans troncature `…`.

## Phase 1 — État de la base au moment de l'implémentation

Vérifié via `mcp__Supabase__execute_sql` (projet `vsmtkopkqasrdnjceegp`) avant toute migration : aucune colonne image sur `taches`, aucun bucket Storage, pas de table `tache_images` — conforme à ce qui était annoncé dans le prompt. Aucun écart, migration appliquée telle que spécifiée.

## Phase 2 — Implémentation

### Nouvelle dépendance : `sharp`

Ajoutée à `package.json` (`sharp: ^0.35.4`) pour compresser les images côté serveur avant upload dans Storage — redimensionnement (max 1600px sur le plus grand côté, `fit: inside`, pas d'agrandissement) et réencodage JPEG qualité 75. Choisie parce que c'est la librairie de référence pour le traitement d'image côté Node/serveur (rapide, basée sur libvips, déjà pressentie dans le prompt).

### Migration SQL

`scripts/migration-tache-images-2026-09-01.sql` (+ `-revert.sql`) :
- Bucket Storage public `tache-images`.
- Policies permissives sur `storage.objects` scopées à `bucket_id = 'tache-images'` pour `select`/`insert`/`delete` (storage.objects a RLS activée par défaut chez Supabase, contrairement aux tables applicatives de Kilio qui n'en ont pas depuis la suppression de l'auth — cohérent avec le modèle mono-utilisateur).
- Table `public.tache_images` (`id`, `tache_id` → `taches.id` cascade, `url`, `ordre`, `created_at`), pas de RLS, pas de `user_id`, même pattern que `sous_taches`.
- Index sur `(tache_id, ordre)`.

Appliquée via `mcp__Supabase__apply_migration`, puis vérifiée (bucket, colonnes de la table, policies) via `mcp__Supabase__execute_sql`.

### Types Supabase

`src/lib/supabase/types.ts` : ajout manuel du type `tache_images` (Row/Insert/Update/Relationships), en suivant le pattern des tables existantes (pas d'outil de génération configuré dans le repo).

### Server actions (`src/app/actions/taches.ts`)

- `uploadTacheImages(tacheId, formData)` : lit les fichiers sous la clé `images`, compresse chacun avec `sharp` (`.rotate()` pour respecter l'orientation EXIF avant resize, puis resize + JPEG q75), upload dans `tache-images/${tacheId}/${uuid}.jpg`, insère une ligne `tache_images` avec l'URL publique et un `ordre` incrémental (repris après le dernier `ordre` existant, pour rester cohérent en édition). Ne fait rien si aucun fichier n'est fourni. Revalide `/taches`, `/agenda`, `/`.
- `deleteTacheImage(imageId)` : récupère l'URL, en extrait le chemin Storage (`/tache-images/<chemin>`), supprime l'objet puis la ligne, revalide les mêmes chemins.
- `TacheAvecRelations` étendu avec `images: Tables<"tache_images">[]`.
- `getTachesAvecRelations` : jointure `tache_images(id, tache_id, url, ordre, created_at)` triée par `ordre`, comme `sous_taches`.
- `createTache`/`updateTache` : appellent `uploadTacheImages` après la création/mise à jour de la tâche et la synchro des tags, avant le `revalidateTachesPaths()` final ; erreur d'upload remontée dans `TacheFormState.error` comme pour les tags.

### UI — `AddTaskForm.tsx`

- Champ "Images (optionnel)" : bouton rond en pointillés (icône image en SVG dessiné à la main, style cohérent avec `ThemeToggle`/`Modal`) associé à un `<input type="file" id="tache-images" name="images" accept="image/*" multiple className="hidden">`.
- Aperçu des fichiers nouvellement sélectionnés via `URL.createObjectURL`, avec bouton "×" pour retirer un fichier avant envoi — reconstruction du `FileList` de l'input via `DataTransfer` (pattern standard). Les URLs objet sont mémoïsées (`useMemo`) et révoquées en cleanup d'effet (évite l'erreur ESLint `react-hooks/set-state-in-effect` d'un `setState` synchrone dans un effet, et les fuites mémoire).
- En mode édition, les images déjà existantes (`tache.images`) s'affichent à côté des nouvelles, chacune avec un "×" qui appelle `deleteTacheImage(image.id)` immédiatement via `useTransition`, indépendamment de la soumission du formulaire.
- Composant `ImageThumb` factorisé pour les deux cas (image existante / nouvelle sélection).

### UI — `TasksList.tsx`

- **Vignettes** : nouveau composant `TacheImagesRow`, affiché dans la carte de tâche (`TaskCard`) si `tache.images.length > 0` — vignettes carrées 56px (`h-14 w-14`), `object-cover`, coins arrondis cohérents avec `listCard`. Au tap, ouvre `ImageLightbox`.
- **`ImageLightbox`** (`src/components/ImageLightbox.tsx`) : overlay `fixed inset-0` semi-opaque, image centrée `object-contain`, fermeture au tap n'importe où ou sur le bouton "×". Générique (pas de dépendance au module Tâches), réutilisable ailleurs si besoin plus tard.
- **Titre non tronqué** : la classe `nameText` (`text-[14.5px] font-semibold text-ink truncate`) reste inchangée globalement — elle est utilisée telle quelle dans 10+ autres fichiers (Notes, Recettes, Objectifs, Habitudes, Budget, etc.), donc pas touchée. Pour le titre de tâche uniquement, remplacement par des classes locales équivalentes sans `truncate` : `whitespace-normal break-words text-[14.5px] font-semibold text-ink` (même taille/graisse que `nameText`, retour à la ligne complet comme les notes juste en dessous). Le conteneur flex du titre + icône de récurrence `↻` est passé de `items-center` à `items-start` pour que l'icône reste alignée en haut quand le titre passe sur plusieurs lignes.

## Phase 3 — Vérification

- `npx tsc --noEmit` : ✅ aucune erreur (une erreur `Cannot find name 'LayoutProps'` dans `src/app/layout.tsx` apparaît si `tsc` est lancé avant tout build — préexistante, sans rapport avec ce travail, absente une fois `.next/types` généré par `npm run build`).
- `npm run lint` (ESLint) : ✅ aucune erreur ni warning sur l'ensemble du repo. Deux `eslint-disable-next-line @next/next/no-img-element` ajoutés (vignettes/lightbox/aperçus) car les images proviennent soit d'URLs `blob:` locales, soit du bucket Storage — pas d'un domaine unique à déclarer dans `next.config.ts` pour `next/image`, et `next/image` ne gère pas les URLs `blob:`.
- `npm run build` : ✅ build de production réussi, toutes les routes compilent (`/taches` inclus).
- Relecture attentive du code (pas de test manuel en navigateur dans cet environnement) :
  - **Compression** : `sharp(buffer).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 75 })` réduit effectivement le poids des photos de téléphone typiques (souvent 3000-4000px de large, HEIC/JPEG haute qualité) en les ramenant à 1600px max et JPEG q75.
  - **Suppression indépendante** : `deleteTacheImage` est appelée via `startTransition` directement au clic sur "×", sans passer par le `formAction` du formulaire — confirmé en lisant `AddTaskForm.tsx`.
  - **Flux complet** : créer avec images → `createTache` insère la tâche puis appelle `uploadTacheImages` → `getTachesAvecRelations` les remonte triées par `ordre` → `TasksList` les affiche en vignettes → `ImageLightbox` les agrandit → éditer rouvre `AddTaskForm` avec `tache.images` pré-remplies → suppression immédiate via `deleteTacheImage` → sauvegarde du formulaire (`updateTache`) traite d'éventuelles nouvelles images sans toucher aux images déjà supprimées. Cohérent de bout en bout à la lecture.
  - **Titre long** : classes `whitespace-normal break-words` sans `truncate` confirmées en lisant le rendu ; l'icône `↻` reste en haut à droite grâce à `items-start`.

## Fichiers créés

- `scripts/migration-tache-images-2026-09-01.sql`
- `scripts/migration-tache-images-2026-09-01-revert.sql`
- `src/components/ImageLightbox.tsx`
- `reports/2026-09-01-tache-images-titre.md` (ce rapport)

## Fichiers modifiés

- `package.json` / `package-lock.json` (ajout `sharp`)
- `src/lib/supabase/types.ts` (type `tache_images`)
- `src/app/actions/taches.ts` (`uploadTacheImages`, `deleteTacheImage`, `TacheAvecRelations.images`, `getTachesAvecRelations`, câblage dans `createTache`/`updateTache`)
- `src/app/(app)/taches/AddTaskForm.tsx` (champ images, aperçus, suppression d'images existantes)
- `src/app/(app)/taches/TasksList.tsx` (vignettes + lightbox, titre non tronqué)

## Écarts par rapport au prompt

Aucun écart de fond. Deux précisions d'implémentation non explicitement demandées mais nécessaires :
- `.rotate()` ajouté avant le `resize()` de `sharp` pour respecter l'orientation EXIF des photos prises au téléphone (sinon une photo prise en portrait peut ressortir pivotée après compression).
- Aperçus de sélection gérés avec `useMemo` + effet de nettoyage seul (plutôt qu'un `useEffect` qui appelle `setState`), pour respecter la règle ESLint `react-hooks/set-state-in-effect` du projet.

## Fin

Pas de push automatique, conformément aux instructions. En attente de confirmation de Vincent avant de pousser sur `kilio`.
