# Tâches — archivage des tâches cochées dans un menu déroulant — 2026-08-31

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : session synchronisée sur `origin/kilio` (`91834ea`, module Recettes HelloFresh), aucun rattrapage nécessaire.
- Relecture de `TasksList.tsx` (composant `TaskCard` + `TasksList`), `TachesView.tsx` (filtrage par vue/liste, non modifié), `src/lib/ui.ts` (tokens `card`, `listCard`, `nameText`, etc.).
- Vérification de `src/lib/supabase/types.ts` : la table `taches` possède bien une colonne `updated_at: string` (non nullable), gérée par trigger — pas de colonne dédiée type `fait_le` pour la date de complétion. Aucun besoin de migration Supabase, conformément à ce qui était anticipé.

## Comportement implémenté

Dans `TasksList` (`src/app/(app)/taches/TasksList.tsx`) :

- Les tâches reçues en props sont séparées côté client en deux groupes : `actives` (`fait === false`) et `archivees` (`fait === true`), sans toucher à `getTachesAvecRelations` ni à l'ordre de tri SQL existant.
- `actives` s'affiche normalement dans la `<ul>` existante, avec le même `TaskCard`, dans le même ordre que reçu (ordre `ordre` géré côté serveur, inchangé).
- `archivees` est triée côté client par `updated_at` décroissant (la plus récemment modifiée en premier), puis affichée dans un `<details>` natif **fermé par défaut**, positionné après la liste des tâches actives — uniquement si `archivees.length > 0`. Le `<summary>` affiche "Tâches archivées (N)", stylé avec le token `card` (bordure/fond) et `text-ink-2 font-semibold` pour cohérence avec le reste de l'UI. Chaque tâche archivée réutilise le même `TaskCard` sans aucune divergence de rendu individuel.
- Cas vides gérés : `taches.length === 0` conserve le message "Aucune tâche pour l'instant." ; si `actives.length === 0` mais `archivees.length > 0`, ce message n'apparaît plus, seul le menu déroulant s'affiche.
- `toggleTache` (`src/app/actions/taches.ts`) et `SousTachesList` (cochage des sous-tâches, `expanded`) sont inchangés — le regroupement est purement un tri/filtre d'affichage côté client.

## Fichier modifié

- `src/app/(app)/taches/TasksList.tsx` (fonction `TasksList` uniquement).

## Limite connue

Le tri des tâches archivées repose sur `updated_at`, qui est **un proxy imparfait** de la date de cochage : cette colonne change aussi si la tâche est éditée après avoir été cochée (ex. modification du titre, de la priorité ou de l'échéance), ce qui la ferait alors remonter en tête du menu déroulant sans qu'elle ait été re-cochée. Une colonne dédiée type `fait_le` (renseignée uniquement par `toggleTache` au moment du passage à `fait = true`) éliminerait cette ambiguïté, mais n'a pas été ajoutée sans validation, conformément aux instructions — signalé ici plutôt qu'implémenté.

## Vérifications (Phase 3)

- `npx tsc --noEmit` : ✅ aucune erreur (après `npm install` initial ; une première exécution avant `npm run build` affichait une erreur `LayoutProps` non liée à ce changement, due à l'absence du dossier `.next/types` généré par Next.js — résolue après build, sans lien avec le code modifié).
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` : ✅ build de production réussi (Next.js 16.3.3 / Turbopack), toutes les routes compilées y compris `/taches`.
