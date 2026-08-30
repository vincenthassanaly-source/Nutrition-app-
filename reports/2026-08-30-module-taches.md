# Ajout du module Tâches — 2026-08-30

## Constats de la Phase 1

- Le module **Notes** (`553c0d4`, commit le plus récent de `kilio` au démarrage de cette tâche) sert de gabarit direct : architecture indépendante (pas de RLS, pas de `user_id`), server actions `createX`/`updateX`/`deleteX` avec `useActionState`, lecture directe dans la page serveur via `createClient()`, pas de fonction `getX` séparée.
- **Pas de RLS ni de `user_id`** confirmé : `migration-suppression-auth-2026-08-29.sql` a désactivé la RLS et supprimé `user_id` sur les 5 tables historiques ; `notes` (ajoutée après) suit déjà ce pattern sans jamais avoir eu de RLS. `taches` suit la même règle.
- `set_updated_at()` existe déjà en base (créée dans `migration-aliments-2026-08-27.sql`) — réutilisée telle quelle via un nouveau trigger `trg_taches_updated_at`, sans redéfinir la fonction.
- Tokens de style repris de `@/lib/ui` : `card`, `dashedAddButton`, `screenTitle`, `errorText`, `input`, `label`, `primaryButton`, `listCard`, `ghostButton`, `dangerButton`, `metaText`, `nameText` — mêmes classes que Notes, pas de nouveau token créé.
- `src/lib/modules.ts` : `MODULES` piloté par un tableau consommé automatiquement par `BottomNav.tsx` et l'accueil à tuiles (`src/app/(app)/page.tsx`) — confirmé, aucun de ces deux fichiers n'a été modifié directement pour Tâches, conformément à la consigne.
- Variables d'accent disponibles dans `globals.css` : `--accent-kcal` (Nutrition), `--accent-protein` (Notes), `--accent-carbs` (libre), `--accent-fat` (libre), `--accent-alert` (réservée sémantiquement aux dépassements/alertes, écartée). → **`--accent-carbs`** choisi pour Tâches : distinct des deux déjà utilisés, sans détourner la couleur d'alerte.

## Fichiers créés / modifiés

- `scripts/migration-taches-2026-08-30.sql` (créé, **appliqué** sur le projet Supabase `kilio`)
- `src/lib/supabase/types.ts` (régénéré via `mcp__Supabase__generate_typescript_types`, inclut la table `taches` ; diff limité à l'ajout de ce bloc)
- `src/app/actions/taches.ts` (créé) : `createTache`, `updateTache`, `toggleTache(id)`, `deleteTache`
- `src/app/(app)/taches/page.tsx` (créé) : page liste, tri non faites d'abord / échéance croissante (nulls en dernier) / `created_at desc`
- `src/app/(app)/taches/TasksList.tsx` (créé) : liste à checkbox (toggle `fait`), affichage de l'échéance si présente, titre barré + atténué pour les tâches faites, édition inline, suppression
- `src/app/(app)/taches/AddTaskForm.tsx` (créé) : formulaire titre + échéance (`<input type="date">`, optionnel), réutilisé pour créer/éditer
- `src/app/(app)/taches/AddTaskToggle.tsx` (créé) : bouton "+ Ajouter une tâche" → formulaire inline
- `src/lib/modules.ts` (modifié) : ajout de l'entrée `/taches` (label "Tâches", description "Liste de tâches à cocher", icône SVG trait `strokeWidth 1.8` — carré à coche —, `accentVar: var(--accent-carbs)`)

`BottomNav.tsx` et `src/app/(app)/page.tsx` (accueil) : **non modifiés**, ils consomment `MODULES` dynamiquement.

## Schéma de la table

```sql
create table taches (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  echeance date,
  fait boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_taches_echeance on taches(echeance);

create trigger trg_taches_updated_at
  before update on taches
  for each row execute function set_updated_at();
```

- Pas de `user_id`, pas de RLS — cohérent avec `notes` et les 5 tables Nutrition.
- Migration appliquée via `mcp__Supabase__apply_migration` sur le projet `kilio` (`vsmtkopkqasrdnjceegp`).

## Décisions prises

- **Tri de la liste** : non faites d'abord (`fait asc`), puis `echeance asc` avec les valeurs nulles en dernier (`nullsFirst: false`), puis `created_at desc` — implémenté via trois `.order()` chaînés côté PostgREST, exactement comme demandé dans le prompt.
- **`accentVar`** : `var(--accent-carbs)`, seule variable d'accent libre et non réservée (voir Phase 1) parmi celles déjà exposées dans le thème.
- **`toggleTache(id)`** : signature à un seul argument, comme spécifié. Lit d'abord la valeur actuelle de `fait` en base puis écrit l'inverse, plutôt que de faire confiance à une valeur passée par le client — évite tout risque d'état désynchronisé côté UI.
- **Échéance** : champ `date` nullable, saisi via `<input type="date">`, jamais requis à la création ni à l'édition (seul le titre est obligatoire, conformément au prompt).
- **UI CRUD complète** : au-delà du strict "vue liste à cocher" demandé, le formulaire d'ajout/édition et la suppression ont été repris à l'identique du pattern Notes (édition inline, bouton "Suppr.") pour rester cohérent avec le seul autre module CRUD existant plutôt que de livrer une UI plus pauvre.

## Résultat des vérifications

- `npm install` (nécessaire, `node_modules` absent au démarrage de la session).
- `npx tsc --noEmit` : **0 erreur** (avant `next build`, seule l'erreur pré-existante `LayoutProps` dans `src/app/layout.tsx` apparaît, sans rapport avec ce module ; elle disparaît après build, comme documenté dans le rapport Notes).
- `npm run lint` (ESLint) : **0 erreur, 0 warning**.
- `npm run build` : **build complet réussi**, route `/taches` générée (`ƒ /taches`, dynamique comme `/notes` et `/nutrition/journal`).
- `git status` après build : diff limité aux fichiers du module (`node_modules`/`.next` correctement ignorés).

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant le push.
