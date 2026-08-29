# Ajout du module Notes — 2026-08-29

## Constats de la Phase 1

- **Routes App Router** : `src/app/(app)/journal/`, `src/app/(app)/recettes/` (+ `[id]/`), sous un layout commun `src/app/(app)/layout.tsx` qui rend `<BottomNav />`.
- **Bottom nav** : `src/components/BottomNav.tsx` — tableau `ITEMS` (`href`, `label`, `icon(color)` en SVG inline 22×22, `strokeWidth 1.8`).
- **Server Actions** : `src/app/actions/<domaine>.ts`, `"use server"`. Deux conventions coexistent dans le repo :
  - `journal.ts` (plus ancien) : `addJournalEntry` / `removeJournalEntry`.
  - `recettes.ts` (plus récent, plus complet) : `createRecette` / `updateRecette` / `deleteRecette`, avec `useActionState`, parsing dédié, `revalidatePath`.
  - → Le module Notes reprend la convention `recettes.ts` (`createNote` / `updateNote` / `deleteNote`), la plus aboutie et la plus récente. Pas de fonction `getNotes` séparée : comme pour `/recettes`, la lecture se fait directement dans la page via `createClient()`.
- **Pas de dossier `supabase/migrations/`** dans ce repo (contrairement à l'hypothèse initiale du prompt). Les migrations sont des fichiers `scripts/migration-<sujet>-<date>.sql`, appliqués via `mcp__Supabase__apply_migration` sur le projet Supabase `kilio` (confirmé connecté, actif), puis les types régénérés via `mcp__Supabase__generate_typescript_types`.
- **⚠️ RLS — écart important avec le prompt** : le tout dernier commit avant cette tâche (`39b2587`, *"Supprime toute l'authentification (app mono-utilisateur)"*) a **désactivé la RLS sur les 5 tables existantes** et supprimé leurs colonnes `user_id`. Confirmé en base via `mcp__Supabase__list_tables` (`rls_enabled: false` partout). Le pattern de policy `auth.uid() = user_id` que le prompt demandait de reproduire pour Journal **n'existe donc plus** — le suivre littéralement aurait réintroduit l'architecture (auth + RLS) que le dernier commit vient précisément de retirer.
  - **Décision validée avec Vincent** (question posée avant tout code) : la table `notes` suit l'état actuel réel du schéma — **pas de RLS, pas de `user_id`** — plutôt que le pattern obsolète décrit dans le prompt.
- **Historique Git / collision de nommage** : aucun module Notes n'a jamais existé dans l'historique. Les seules occurrences de "note" dans le repo concernent un champ `note` (confiance IA) sur le journal repas, fonctionnalité déjà entièrement retirée — aucun risque de collision.
- **Date éditable ou non** : le prompt contient une instruction contradictoire (une ligne de contexte dit "date éditable", la Phase 2 dit "non éditable sauf besoin identifié en Phase 1"). Aucun élément de la Phase 1 ne justifiant une date éditable, la règle par défaut de la Phase 2 a été appliquée : la date affichée est `created_at`, en lecture seule, non modifiable via le formulaire.

## Fichiers créés / modifiés

- `scripts/migration-notes-2026-08-29.sql` (créé, **appliqué** sur le projet Supabase `kilio`)
- `src/lib/supabase/types.ts` (régénéré via `mcp__Supabase__generate_typescript_types`, inclut la table `notes`)
- `src/app/actions/notes.ts` (créé) : `createNote`, `updateNote`, `deleteNote`
- `src/app/(app)/notes/page.tsx` (créé) : page liste, tri par `created_at` décroissant
- `src/app/(app)/notes/NotesList.tsx` (créé) : liste des notes (titre, date, aperçu du contenu tronqué), édition inline, suppression
- `src/app/(app)/notes/NoteForm.tsx` (créé) : formulaire titre + contenu, réutilisé pour créer/éditer
- `src/app/(app)/notes/AddNoteToggle.tsx` (créé) : bouton "+ Ajouter une note" → formulaire inline (même pattern que `AddRecetteToggle`)
- `src/components/BottomNav.tsx` (modifié) : ajout de l'entrée "Notes" (même style d'icône SVG que Journal/Recettes)

## Migration SQL appliquée

Fichier : `scripts/migration-notes-2026-08-29.sql`, appliquée via `mcp__Supabase__apply_migration` sur le projet `kilio` (`vsmtkopkqasrdnjceegp`).

```sql
create table notes (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_created_at on notes(created_at desc);

create trigger trg_notes_updated_at
  before update on notes
  for each row execute function set_updated_at();
```

- Pas de `user_id`, pas de RLS — cohérent avec l'état actuel des 5 autres tables (RLS désactivée partout depuis `migration-suppression-auth-2026-08-29.sql`).
- `updated_at` mis à jour automatiquement via la fonction `set_updated_at()` déjà existante en base (réutilisée telle quelle, même pattern que `recettes`/`aliments`).

## Résultat des vérifications

- `npx tsc --noEmit` : **0 erreur** (la seule erreur rencontrée, `LayoutProps` dans `src/app/layout.tsx`, est pré-existante et sans rapport avec ce module — elle disparaît après `next build`, qui génère les types de routes Next.js 16).
- `npx eslint .` : **0 erreur, 0 warning**.
- `npx next build` : **build complet réussi**, route `/notes` bien générée (`ƒ /notes`, dynamique comme `/journal` et `/recettes`).

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — la confirmation explicite de Vincent est requise avant le push.
