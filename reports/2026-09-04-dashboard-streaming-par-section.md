# Streaming par section pour la page Accueil (Dashboard) — 2026-09-04

## Contexte / problème

Depuis le 2026-09-03 (`reports/2026-09-03-dashboard-hydration-tanstack-query.md`), `src/app/(app)/page.tsx` préchargeait 5 requêtes (`getTachesAvecRelations`, `getHabitudesDuJour`, `getResumeNutritionJour`, `getListes`, `getTags`) via un seul `Promise.all` **awaité** avant de retourner son JSX, puis hydratait un unique `<HydrationBoundary>` englobant tout `<DashboardView>`.

Ce changement corrigeait un problème de cold start serverless (données déjà en cache au premier rendu, pas de flash de chargement), mais introduisait une lenteur perçue au clic sur "Accueil" : la navigation bloquait tant que les 5 requêtes n'étaient pas toutes résolues, contrairement aux autres onglets de la bottom nav qui affichent leur shell instantanément.

## Solution appliquée

Le `Promise.all` unique et le `HydrationBoundary` global ont été découpés en 3 Server Components `async` indépendants, chacun préchargeant uniquement sa/ses propre(s) query(ies) et hydratant un `<HydrationBoundary>` local autour de son fragment client, wrappé dans son propre `<Suspense>` avec le skeleton déjà existant en fallback :

| Section | Query préchargée | Server Component (prefetch + hydrate) | Fragment client (`useQuery` + mutations) | Fallback `<Suspense>` |
|---|---|---|---|---|
| Nutrition | `objectifNutritionnel("repos")` | `DashboardNutritionCard.tsx` | `DashboardNutritionSection.tsx` | `<CardSkeleton />` |
| Aujourd'hui + Prochain événement | `taches` (une seule query, partagée) | `DashboardTachesCard.tsx` | `DashboardTachesSection.tsx` | `TachesCardsSkeleton` (local à `DashboardView.tsx`, réutilise `CardSkeleton`/`ListItemSkeletonGroup`/`Skeleton`) |
| Habitudes | `habitudes(today)` | `DashboardHabitudesCard.tsx` | `DashboardHabitudesSection.tsx` | `HabitudesSkeleton` (local à `DashboardView.tsx`, réutilise `Skeleton`) |

Tâches et Prochain événement ont été regroupés dans une seule section car les deux dérivent de la même query `taches` — un seul `useQuery`/prefetch évite un double fetch.

`page.tsx` ne contient plus aucun `await` avant son retour JSX : le header (date, greeting) et `<GlobalSearchBar>` restent synchrones et s'affichent immédiatement. `DashboardView.tsx` (désormais un Server Component, plus `"use client"`) compose les 3 `<Suspense>` et affiche `<QuickAddFab />`.

`getListes`/`getTags` (utilisés uniquement par `QuickAddFab` à l'ouverture d'un formulaire) ne sont plus préchargés côté serveur : `QuickAddFab` fait désormais son propre `useQuery` client (comme avant l'introduction du prefetch serveur du 2026-08-31), avec des valeurs par défaut `[]`. Choix retenu car le plus simple : ces données ne sont utilisées qu'à l'ouverture d'une modale (déjà lazy-loadée via `next/dynamic`), donc un fetch client pur ne retarde jamais l'affichage des cartes principales, sans complexité de Suspense supplémentaire pour un besoin non visuel.

Les mutations optimistes de `DashboardTaskItem.tsx` et `DashboardHabitItem.tsx` n'ont pas été touchées : elles ciblent toujours les mêmes `queryKeys.taches`/`queryKeys.habitudes(date)`, désormais peuplées par `DashboardTachesCard`/`DashboardHabitudesCard` au lieu de `page.tsx`, mais dans le même cache TanStack Query côté navigateur (`browserQueryClient` de `providers.tsx`, staleTime 30s inchangé).

### Fichiers créés

- `src/app/(app)/DashboardNutritionCard.tsx` — Server Component async, prefetch nutrition
- `src/app/(app)/DashboardNutritionSection.tsx` — fragment client (carte Nutrition)
- `src/app/(app)/DashboardTachesCard.tsx` — Server Component async, prefetch `taches`
- `src/app/(app)/DashboardTachesSection.tsx` — fragment client (cartes Aujourd'hui + Prochain événement)
- `src/app/(app)/DashboardHabitudesCard.tsx` — Server Component async, prefetch habitudes
- `src/app/(app)/DashboardHabitudesSection.tsx` — fragment client (rangée Habitudes)

### Fichiers modifiés

- `src/app/(app)/page.tsx` — retrait du `Promise.all`/`HydrationBoundary` global, plus aucun `await` avant le retour JSX
- `src/app/(app)/DashboardView.tsx` — n'est plus un Client Component ; compose les 3 `<Suspense>` (avec fallbacks locaux `TachesCardsSkeleton`/`HabitudesSkeleton` réutilisant les skeletons existants) + `<QuickAddFab />`
- `src/app/(app)/QuickAddFab.tsx` — fetch `listes`/`tags` en interne via `useQuery` (au lieu de props reçues du parent), retire la dépendance à un prefetch serveur

## Vérifications effectuées

- `npx tsc --noEmit` : aucune erreur sur les fichiers touchés (une erreur préexistante et non liée sur `src/app/layout.tsx` — `Cannot find name 'LayoutProps'` — disparaît après `next build`, qui génère les types de routes ; confirmé identique avant/après ce changement via `git stash`).
- `npx eslint` sur les 9 fichiers créés/modifiés : aucune erreur ni warning.
- `npx next build` : build réussi, `/` reste marqué `ƒ` (server-rendered à la demande, pas de régression vers du statique).

## Modules restants avec un pattern similaire

Recherche de `HydrationBoundary`/`prefetchQuery` dans les autres `page.tsx` du repo : aucune autre route n'utilise ce pattern de prefetch+hydratation. Le Dashboard était le seul module concerné par ce blocage global ; rien d'autre à traiter dans ce périmètre.
