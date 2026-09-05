# Suppression du swipe entre onglets

Date : 2026-09-05

## Contexte

Suite au fix de `2026-09-05-swipe-onglets-dynamique.md` (faire suivre au swipe l'ordre réel de `modulesBarreBasse`), Vincent a signalé que le swipe pour changer de jour/semaine dans Agenda ne fonctionnait plus.

## Cause

`TabSwipeWrapper` attachait ses propres handlers `useSwipeHorizontal` sur le `<main>` commun dès que le `pathname` correspondait exactement à une des routes de `modulesBarreBasse`. Depuis que `/agenda` est épinglé en barre du bas, ce `pathname` s'y trouve désormais, donc les handlers de swipe "changement d'onglet" étaient attachés sur `<main>`, ancêtre direct du conteneur `onTouchStart/onTouchMove/onTouchEnd` propre à `AgendaView.tsx` qui gère le swipe jour/semaine. Les deux systèmes de détection de geste horizontal entraient en conflit sur les mêmes événements tactiles, cassant le swipe de navigation temporelle d'Agenda.

Avant ce fix, `/agenda` n'apparaissait jamais dans l'ancien tableau codé en dur `ONGLETS_ORDRE`, donc le conflit n'existait pas — mais tout module pinnable en barre du bas était structurellement exposé au même risque dès qu'un utilisateur épingle une route qui gère déjà son propre swipe interne (Agenda, Journal Nutrition).

## Décision

Suppression complète du mécanisme de swipe entre onglets, plutôt qu'un correctif ciblé (ex. exclure `/agenda` de la liste) : Vincent a choisi de retirer la fonctionnalité.

## Changements

- Suppression de `src/components/TabSwipeWrapper.tsx`.
- `src/app/(app)/layout.tsx` : le `<main>` (classes, paddings, `overscrollBehaviorY`) est réintégré directement dans `AppLayout`, sans wrapper client ni handlers de swipe. `AppLayout` reste un Server Component (aucun state React nécessaire pour ce `<main>`).
- `useSwipeHorizontal` (le hook générique) n'est pas touché : toujours utilisé par `JournalSwipeWrapper.tsx` (Journal Nutrition) et `HistoriqueView.tsx` (Habitudes), qui ne sont pas concernés par ce conflit.
- `useViewTransitionNavigate` reste utilisé par `BottomNav.tsx` (crossfade lors d'un tap sur un onglet), donc conservé tel quel.

## Vérifications

- `npx eslint .` : ✅ aucune erreur, aucune référence résiduelle à `TabSwipeWrapper`.
- `npm run build` (`next build`) : ✅ build de production réussi, 22 routes générées, TypeScript vérifié en interne par Next.js sans erreur.

## Comportement résultant

Naviguer entre les onglets de la barre du bas se fait uniquement par tap (comme avant l'introduction du swipe). Le swipe horizontal pour changer de jour/semaine dans Agenda, et pour naviguer entre dates dans le Journal Nutrition, n'est plus perturbé.
