# Fluidité de navigation — loading states, View Transitions, swipe entre onglets

Date : 2026-09-04

Trois chantiers indépendants livrés ensemble : (A) `loading.tsx` manquants, (B) crossfade via View Transitions API sur la navigation principale, (C) swipe horizontal entre les 4 onglets principaux.

## A. `loading.tsx` manquants

Fichiers créés, tous réutilisant exclusivement les composants de `src/components/skeletons/` (aucun nouveau système de skeleton) :

- `src/app/(app)/taches/loading.tsx` — titre + segmented control (3 boutons) + rangée de puces filtres (liste + "Toutes les listes") + zone d'ajout + `ListItemSkeletonGroup` (5), reproduisant `TachesView.tsx`.
- `src/app/(app)/habitudes/loading.tsx` — titre + segmented control (2 vues) + zone d'ajout + `ListItemSkeletonGroup` (3, `withSubtitle`), reproduisant `HabitudesView.tsx`.
- `src/app/(app)/notes/loading.tsx` — titre + barre de recherche + `GridSkeleton` (masonry 2 colonnes), reproduisant `NotesGrid.tsx`.
- `src/app/(app)/courses/loading.tsx` — titre + zone d'ajout + `ListItemSkeletonGroup` (5), reproduisant `CoursesView.tsx`/`CoursesList.tsx` (qui utilise déjà `ListItemSkeletonGroup` pour son propre `isLoading`).
- `src/app/(app)/plus/loading.tsx` — titre + grille `grid-cols-2` de 8 cartes (icône 40×40 + deux lignes de texte), calée sur `ModulesGrid.tsx` (8 entrées dans `MODULES`) et le style `card` de `src/lib/ui.ts`.
- `src/app/(app)/reglages/loading.tsx` — titre + carte à 4 lignes (Apparence / Notifications / Profil / Version) avec séparateurs, reproduisant la structure statique de `ReglagesPage`.

## B. View Transitions API

- `src/hooks/useViewTransitionNavigate.ts` : hook client exposant `navigate(href)`. Si `document.startViewTransition` existe (feature detection via `"startViewTransition" in document`), l'appel à `router.push(href)` est enrobé dans le callback ; sinon fallback silencieux direct sur `router.push(href)` — aucune erreur sur Safari/Firefox.
- `src/components/BottomNav.tsx` : chaque `<Link>` reçoit un `onClick` qui appelle `navigate(item.href)`. `e.preventDefault()` n'est appliqué **que** si `startViewTransition` est disponible ; sinon le `<Link>` natif de Next.js garde la main (prefetch et navigation par défaut intacts).
- `src/app/globals.css` : ajout des règles `::view-transition-old(root)` (fondu sortant, 180ms) / `::view-transition-new(root)` (fondu entrant, 200ms), cohérentes en durée avec les `agenda-glisse-*` existantes (220ms). Le bloc `@media (prefers-reduced-motion: reduce)` déjà présent pour `agenda-glisse-*` a été **étendu** (pas dupliqué) pour désactiver aussi l'animation des `view-transition-*`.
- Portée volontairement limitée à un crossfade global de la racine (`root`), aucun shared-element/morphing nommé. Les `<Link>` internes à Agenda et Journal Nutrition (qui gèrent déjà leur propre animation `agenda-glisse-*`) n'ont pas été touchés, pour éviter un double effet de transition superposé.

## C. Swipe horizontal entre les 4 onglets principaux

- `src/components/TabSwipeWrapper.tsx` (nouveau composant client) : enrobe le `<main>` précédemment inline dans `src/app/(app)/layout.tsx`. `AppLayout` reste un **Server Component** sans state — c'est ce wrapper dédié qui porte le `"use client"`, la lecture de `usePathname()` et le state de geste.
- Ordre fixe : `["/", "/nutrition", "/taches", "/habitudes"]` ("Plus" exclu, pas d'ordre linéaire).
- Les handlers de `useSwipeHorizontal` ne sont **spread sur `<main>` que si `pathname` correspond exactement à une des 4 routes** (`{...(actif ? swipeHandlers : {})}`) : sur toute sous-route (`/agenda`, `/nutrition/journal`, `/nutrition/recettes`, etc.), aucun handler n'est attaché au niveau du wrapper, donc **aucun risque de conflit** avec le swipe dates/semaines déjà en place sur ces écrans (ceux-ci restent gérés uniquement par leur propre composant, ex. `AgendaView.tsx`, `JournalSwipeWrapper.tsx`).
- Swipe à gauche → onglet suivant (`sens === "suivant"`), swipe à droite → onglet précédent, sans wrap-around (borne vérifiée avant `navigate`, no-op silencieux hors bornes).
- Le changement de route passe par `useViewTransitionNavigate` (chantier B), donc le swipe bénéficie aussi du crossfade.

**Décision d'implémentation** : `useSwipeHorizontal` a été réutilisé **tel quel**, sans adaptation. Sa sémantique "suivant"/"precedent" (générique, pas orientée dates malgré le nom des classes CSS associées `agenda-glisse-*`) correspondait directement au besoin "onglet suivant/précédent dans l'ordre" — seul le mapping vers l'index dans `ONGLETS_ORDRE` a été écrit dans `TabSwipeWrapper.tsx`. Aucune modification du hook n'était nécessaire.

## Vérifications (Phase 3)

- `npx tsc --noEmit` : ✅ aucune erreur (après génération des types Next.js via `next build`, requise pour `LayoutProps` dans `src/app/layout.tsx` — non lié à ce chantier).
- `npx eslint .` : ✅ aucune erreur.
- `npx next build` : ✅ build de production réussi (22 routes générées, aucune régression de compilation).
- Vérification manuelle (via Playwright + Chromium headless en mode mobile, `next start` en local, sans base de données réelle — pas de credentials Supabase dans ce sandbox, donc les appels serveur aux données renvoient 500, sans rapport avec ce chantier) :
  - `document.startViewTransition` est bien détecté ; clic sur un onglet de la bottom nav déclenche `preventDefault` + `navigate`, la navigation aboutit normalement (`/` → `/nutrition`).
  - Swipe gauche sur `/nutrition` (route exacte) → navigation vers `/taches` (onglet suivant). Chaîne complète testée `/` → `/nutrition` → `/taches` → `/habitudes` via swipes successifs.
  - Swipe droite sur `/` (Accueil) : aucun changement de route (pas de wrap-around).
  - Swipe gauche sur `/habitudes` : aucun changement de route (pas de wrap-around en bout de chaîne).
  - Swipe gauche sur `/nutrition/journal` (sous-route à swipe propre) : **aucune navigation d'onglet déclenchée** — confirme que le wrapper n'attache aucun handler sur cette route, donc aucun conflit avec le swipe dates du Journal Nutrition. Le comportement équivalent pour `/agenda` n'a pas pu être vérifié dynamiquement dans ce sandbox (l'absence de credentials Supabase fait planter le rendu client de la page avant que le geste ne soit testable), mais la même garde de code (`pathname` hors de `ONGLETS_ORDRE`) s'applique identiquement à `/agenda`, revue par lecture de `TabSwipeWrapper.tsx`.
  - Règle CSS `::view-transition-old(root)` bien présente dans la feuille de style compilée, durée 180ms confirmée.
  - Fallback sans `startViewTransition` : couvert par la garde `"startViewTransition" in document` dans `useViewTransitionNavigate.ts` et `BottomNav.tsx` — aucun appel conditionnel ne peut lever d'erreur sur un navigateur qui ne l'expose pas ; le `<Link>` natif reprend la main normalement (pas testé en conditions réelles Safari/Firefox faute d'un tel moteur dans ce sandbox, mais la garde est identique à celle validée côté détection positive).

## Fichiers créés/modifiés

**A** : `src/app/(app)/taches/loading.tsx`, `habitudes/loading.tsx`, `notes/loading.tsx`, `courses/loading.tsx`, `plus/loading.tsx`, `reglages/loading.tsx` (créés).

**B** : `src/hooks/useViewTransitionNavigate.ts` (créé), `src/components/BottomNav.tsx` (modifié), `src/app/globals.css` (modifié).

**C** : `src/components/TabSwipeWrapper.tsx` (créé), `src/app/(app)/layout.tsx` (modifié).
