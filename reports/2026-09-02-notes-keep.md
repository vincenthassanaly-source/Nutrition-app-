# Refonte du module Notes façon Google Keep — 2026-09-02

## Résumé

Le module Notes est passé d'une liste verticale simple (titre + contenu texte)
à une grille mosaïque façon Google Keep : notes texte **ou** checklist,
couleur pastel, épinglage, tags (table `tags` existante, réutilisée), et
recherche/filtrage 100 % côté client.

## Base de données

Migration `scripts/migration-notes-keep-2026-09-02.sql` (revert associé) :

- `create type note_type as enum ('texte', 'checklist')`
- `notes` : ajout de `type note_type not null default 'texte'`, `couleur text`,
  `epingle boolean not null default false`
- `note_items` (checklist) : `note_id`, `libelle`, `coche`, `position`,
  timestamps + trigger `set_updated_at()` (réutilisé, pas recréé)
- `notes_tags` : jonction `note_id` / `tag_id` vers la table `tags`
  existante (créée par `migration-taches-ticktick-2026-08-30.sql`) — pas de
  nouvelle table de tags dédiée aux notes
- Pas de RLS, pas de `user_id`, conforme au reste du projet (mono-utilisateur)

Migration appliquée sur le projet Supabase `vsmtkopkqasrdnjceegp` via
`apply_migration`, types TypeScript régénérés dans
`src/lib/supabase/types.ts` via `generate_typescript_types`.

La couleur des notes est une clé de palette (`sauge`, `peche`, `lavande`,
`ciel`, `rose`, `citron`, `menthe`, `argile`), stockée en `text` libre plutôt
qu'en enum Postgres — palette définie en TypeScript
(`src/lib/notes/palette.ts`), rendue via des variables CSS `--note-<clé>`
ajoutées à `globals.css` (paires light/dark, même pattern que les tokens
`--accent-*` existants).

## Fichiers modifiés / créés

```
scripts/
  migration-notes-keep-2026-09-02.sql          (nouveau)
  migration-notes-keep-2026-09-02-revert.sql   (nouveau)

src/lib/
  supabase/types.ts                            (régénéré)
  notes/palette.ts                             (nouveau)

src/app/globals.css                            (+ 8 couleurs pastel light/dark)

src/app/actions/notes.ts                       (étendu : type/couleur, épinglage,
                                                 items checklist, tags sur note)

src/app/(app)/notes/
  page.tsx                                     (fetch getNotesAvecRelations + getTags)
  NotesGrid.tsx                                 (nouveau — recherche, filtre tags,
                                                 sections Épinglées/Autres)
  NoteCard.tsx                                  (nouveau — carte mosaïque)
  NoteForm.tsx                                  (réécrit — type/couleur/checklist/tags)
  AddNoteToggle.tsx                             (adapté — passe les tags)
  NotesList.tsx                                 (supprimé, remplacé par NotesGrid + NoteCard)

src/app/(app)/QuickAddFab.tsx                  (passe `tags` à NoteForm, requis désormais)
```

## Server actions ajoutées (`src/app/actions/notes.ts`)

- `createNote` / `updateNote` : gèrent désormais `type`, `couleur`, la sync
  des tags (`tag_ids` + `nouveaux_tags`, même pattern que
  `createTache`/`updateTache`), et l'insertion groupée des items à la
  création d'une checklist
- `toggleEpingle(id, epingle)`
- Checklist : `addNoteItem`, `toggleNoteItem`, `updateNoteItemLibelle`,
  `deleteNoteItem`, `reorderNoteItems` — actions granulaires persistées en
  direct (pas via le bouton "Enregistrer"), même pattern que les
  sous-tâches (`SousTachesList` dans `TasksList.tsx`)
- Tags sur note : `attachTagToNote`, `detachTagFromNote` (complètent la sync
  faite dans create/updateNote)
- `getNotesAvecRelations()` : lecture avec items + tags, triée
  épinglées d'abord

Toutes les actions font `revalidatePath("/notes")`.

## UI

- **Grille mosaïque** : `columns-2 gap-3` + `break-inside-avoid` sur chaque
  carte, hauteur variable selon le contenu
- **Carte** : fond teinté (`noteBackgroundStyle`), titre, aperçu tronqué
  (texte `line-clamp-6`) ou items de checklist avec case à cocher inline
  (`CheckToggle`, composant déjà utilisé pour les tâches) + barre de
  progression, chips de tags, icône épingle togglable directement sur la
  carte
- **Sections** "Épinglées" / "Autres", masquées si vides
- **Recherche** client (titre + contenu + libellés d'items + noms de tags)
  et **chips de tags cumulables** pour filtrer, même pattern que
  `RecettesList.tsx`
- **Formulaire** : toggle texte/checklist à la création uniquement (le type
  n'est pas modifiable en édition), ajout dynamique d'items (local avant
  sauvegarde ; granulaire — persisté immédiatement — en édition), 8
  pastilles de couleur, sélecteur de tags existants + création à la volée
  (`nouveaux_tags`)

## Vérifications

- `npx tsc --noEmit` : OK (après `npm ci`, node_modules n'était pas installé)
- `npm run lint` (ESLint) : OK, aucun warning
- `npm run build` (`next build`) : OK, toutes les routes compilent, `/notes`
  en rendu dynamique (`ƒ`)

## Points d'attention pour la suite

- **Pas de drag-and-drop** de réordonnancement des cartes dans la grille
  (Keep permet de glisser-déposer les notes) — non traité ici, cohérent
  avec le reste du codebase qui n'a pas de drag & drop (réordonnancement
  par flèches haut/bas partout ailleurs)
- Le réordonnancement des **items de checklist** existe côté serveur
  (`reorderNoteItems`) et dans l'éditeur d'édition (flèches ↑/↓), mais pas
  directement depuis la carte de la grille (seul le toggle coché/décoché y
  est disponible)
- La couleur des notes est limitée à la palette fixe de 8 clés (validée
  côté serveur par `estCouleurValide`) — une note dont `couleur` ne
  correspondrait à aucune clé connue (donnée legacy/manuelle) s'affiche
  simplement sans fond teinté
- Pas de recherche full-text Postgres (choix assumé du prompt vu le volume
  mono-utilisateur) : le filtrage est entièrement côté client, donc son
  coût grandira linéairement avec le nombre de notes si le volume change un
  jour significativement
