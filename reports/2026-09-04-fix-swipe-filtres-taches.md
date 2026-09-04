# Fix : swipe horizontal sur la liste de filtres de la page Tâches déclenche la navigation vers Habitudes

Date : 2026-09-04

## Bug

Sur `/taches`, essayer de scroller horizontalement la rangée de filtres de listes (bouton "Toutes" + listes, en haut de la page) déclenchait à la place une navigation vers l'onglet Habitudes.

## Diagnostic

- `/taches` est enveloppée par `TabSwipeWrapper`, qui branche `useSwipeHorizontal` (`src/hooks/useSwipeHorizontal.ts`) sur `<main>` pour naviguer entre les 4 onglets principaux (`/`, `/nutrition`, `/taches`, `/habitudes`) au swipe.
- `useSwipeHorizontal` ignore normalement un geste s'il a défilé un élément marqué `data-swipe-ignore` sous le doigt (voir `onTouchStart`/`onTouchEnd`, `src/hooks/useSwipeHorizontal.ts:44-87`), pattern déjà utilisé sur la grille de `WeekView.tsx` (`src/app/(app)/agenda/WeekView.tsx:142`).
- La rangée de filtres de `TachesView.tsx` (`<div className="flex items-center gap-2 overflow-x-auto pb-1">`, ligne 90) est scrollable horizontalement mais n'avait pas cet attribut. Le swipe sur cette rangée était donc traité comme un swipe d'onglet plutôt qu'un scroll local, et un swipe vers la gauche (deltaX < 0, "suivant") atterrissait sur Habitudes (onglet suivant après Tâches dans l'ordre `/`, `/nutrition`, `/taches`, `/habitudes`).

## Fix appliqué

Ajout de l'attribut `data-swipe-ignore` sur le `<div>` de la rangée de filtres, à l'identique du pattern de `WeekView.tsx` :

`src/app/(app)/taches/TachesView.tsx:90`
```diff
-      <div className="flex items-center gap-2 overflow-x-auto pb-1">
+      <div className="flex items-center gap-2 overflow-x-auto pb-1" data-swipe-ignore>
```

Seul ce fichier a été modifié. `useSwipeHorizontal.ts` et `TabSwipeWrapper.tsx` n'ont pas été touchés.

## Autres rangées scrollables repérées en Phase 1

Recherche de `overflow-x-auto` / `overflow-x-scroll` dans tout le module Tâches (`src/app/(app)/taches/**`, y compris `listes/ListesManager.tsx`) : aucune autre occurrence trouvée. `ListesManager.tsx` n'a pas de rangée horizontale scrollable (liste verticale de listes). Rien d'autre à corriger dans le périmètre de ce fix.

## Vérifications (Phase 3)

- **tsc** (`npx tsc --noEmit`) : après `npm install` (dépendances absentes au départ), une seule erreur pré-existante et non liée au fix (`src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'`, un type généré par Next.js normalement produit par `next build`, absent lors d'une passe `tsc` isolée). Aucune nouvelle erreur introduite par le changement.
- **ESLint** (`npm run lint`) : aucune erreur ni warning.
- **Build** (`npm run build`, Next.js 16.3.3 / Turbopack) : compilation réussie, y compris la passe TypeScript interne au build (qui génère les types manquants, dont `LayoutProps`) — 0 erreur.
- **Vérification visuelle** : `data-swipe-ignore` est posé sur le `<div>` conteneur scrollable (celui portant `overflow-x-auto`), pas sur les `<button>`/`<Link>` enfants — conforme au pattern de référence `WeekView.tsx:142`.
