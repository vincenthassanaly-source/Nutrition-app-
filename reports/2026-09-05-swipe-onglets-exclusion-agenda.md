# Swipe entre onglets : réactivation avec exclusion d'Agenda

Date : 2026-09-05

## Contexte

Après la suppression complète du swipe entre onglets (`2026-09-05-suppression-swipe-onglets.md`, suite à un conflit avec le swipe jour/semaine d'Agenda), Vincent a demandé de remettre la fonctionnalité en place, mais en la faisant cohabiter correctement avec Agenda.

## Cause exacte du conflit (confirmée)

`useSwipeHorizontal` (`src/hooks/useSwipeHorizontal.ts`) s'appuie sur les événements React `onTouchStart` / `onTouchMove` / `onTouchEnd`, qui **bubblent** dans l'arbre React comme leurs équivalents DOM. `AgendaView.tsx` attache ces mêmes handlers sur un conteneur interne à la page `/agenda` pour son swipe jour/semaine ; `TabSwipeWrapper` les attachait sur `<main>`, ancêtre direct de ce conteneur. Résultat : un seul geste tactile sur `/agenda` déclenchait **les deux** détections (le swipe interne d'Agenda ET le swipe de changement d'onglet), sans qu'aucun des deux composants n'appelle `stopPropagation`.

## Fix appliqué

Plutôt que de supprimer la fonctionnalité, `TabSwipeWrapper.tsx` exclut désormais explicitement les routes qui gèrent leur propre swipe horizontal interne :

```ts
const ROUTES_SWIPE_INTERNE = ["/agenda"];
```

`actif` (qui contrôle à la fois si les handlers sont attachés sur `<main>` et si `handleSwipe` peut naviguer) devient :

```ts
const actif = indexOngletActif !== -1 && !ROUTES_SWIPE_INTERNE.includes(pathname);
```

Effet :
- Sur `/agenda`, aucun handler de swipe entre onglets n'est attaché sur `<main>` : le swipe jour/semaine d'Agenda fonctionne seul, sans concurrence.
- Depuis un onglet voisin (ex. Accueil), on peut toujours **arriver** sur Agenda par swipe si Agenda est épinglé en barre du bas — seule la détection *sur* `/agenda` lui-même est désactivée, pas la possibilité d'y naviguer.
- Le reste du comportement (ordre dynamique via `modulesBarreBasse`, pas de wrap-around, "Plus" toujours exclu, swipe inactif sur les sous-routes) est inchangé par rapport au fix du 2026-09-05 précédent.

## Point de vigilance non traité (hors périmètre demandé)

`src/app/(app)/habitudes/HistoriqueView.tsx` utilise le même `useSwipeHorizontal` sur la vue "Historique" de la page `/habitudes` — potentiellement exposée au même conflit de bubbling si `/habitudes` est épinglé en barre du bas et que l'onglet "Historique" est actif. Ce cas existait déjà avant cette session (l'ancien tableau codé en dur `ONGLETS_ORDRE` incluait `/habitudes`) et n'a pas été signalé comme problématique par Vincent ; non modifié ici pour rester dans le périmètre demandé (uniquement Agenda). À surveiller si un comportement similaire est un jour rapporté sur Habitudes.

## Vérifications

- `npx eslint .` : ✅ aucune erreur.
- `npm run build` (`next build`) : ✅ build de production réussi, 22 routes générées, TypeScript vérifié en interne par Next.js sans erreur.
