# Raccourcis PWA (App Shortcuts) : Tâches, Courses, Notes

## Résumé

Ajout de trois raccourcis natifs (`shortcuts` dans `public/manifest.json`), accessibles en appui long sur l'icône Kilio une fois l'app installée : Tâches (formulaire d'ajout déjà ouvert), Courses (liste), Notes (formulaire de nouvelle note déjà ouvert). Les deux formulaires concernés s'ouvrent via un paramètre d'URL `?action=new`, lu côté serveur et transmis en `defaultOpen` jusqu'au composant client qui gère l'état d'ouverture.

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `public/manifest.json` | Ajout du champ `shortcuts` (3 entrées : Tâches → `/taches?action=new`, Courses → `/courses`, Notes → `/notes?action=new`), réutilisant `icon-192.png`. |
| `src/app/(app)/taches/page.tsx` | Lit `searchParams` (`Promise<{ action?: string }>`), calcule `defaultOpen = action === "new"`, le passe à `TachesView`. |
| `src/app/(app)/taches/TachesView.tsx` | Nouvelle prop optionnelle `defaultOpen?: boolean`, relayée à `AddTaskToggle` (le toggle n'est pas rendu directement par `page.tsx` mais par cette vue cliente intermédiaire). |
| `src/app/(app)/taches/AddTaskToggle.tsx` | Nouvelle prop `defaultOpen?: boolean` (défaut `false`), `useState(defaultOpen)` au lieu de `useState(false)`. |
| `src/app/(app)/notes/page.tsx` | Lit `searchParams`, calcule `defaultOpen = action === "new"`, le passe à `AddNoteToggle`. |
| `src/app/(app)/notes/AddNoteToggle.tsx` | Nouvelle prop `defaultOpen?: boolean` (défaut `false`), `useState(defaultOpen)`. `useBackClose(open, ...)` conservé tel quel — fonctionne normalement avec `open` initialisé à `true`. |
| `src/app/(app)/courses/page.tsx` | Aucune modification — le raccourci pointe vers `/courses` tel quel. |

Aucune migration Supabase (pas de changement de schéma).

## Comportement des 3 raccourcis

1. **Tâches** — appui long → « Ajouter une tâche » → ouvre `/taches?action=new`, le formulaire d'ajout de tâche est déjà déplié à l'arrivée.
2. **Courses** — appui long → « Courses » → ouvre `/courses`, aucun changement de comportement.
3. **Notes** — appui long → « Nouvelle note » → ouvre `/notes?action=new`, le formulaire de nouvelle note est déjà déplié, avec la fermeture par bouton retour Android (`useBackClose`) opérationnelle dès l'ouverture.

## Limitation connue

Les App Shortcuts PWA (`manifest.json` → `shortcuts`) ne sont supportés que sur Android/Chrome pour l'app installée (déclenchés par appui long sur l'icône). **iOS Safari ne les supporte pas** : sur iPhone, l'appui long sur l'icône Kilio ajoutée à l'écran d'accueil n'affichera pas ces raccourcis.

## Vérification (Phase 3)

- `npx tsc --noEmit` : aucune erreur (après `npm install` puis `npm run build`, nécessaires pour générer les types Next.js absents avant la première installation des dépendances dans cette session).
- `npx eslint .` : aucune erreur ni warning.
- `npm run build` : build de production réussi, 21 routes générées (dont `/taches`, `/notes`, `/courses` en dynamique `ƒ`, cohérent avec la lecture de `searchParams`).

## Étape manuelle de test (à faire par Vincent)

Les App Shortcuts ne sont pris en compte qu'après réinstallation ou mise à jour du service worker/manifest de la PWA installée :
1. Sur Android/Chrome, désinstaller puis réinstaller la PWA Kilio (ou attendre/forcer la mise à jour du manifest si déjà installée).
2. Appui long sur l'icône Kilio depuis l'écran d'accueil.
3. Vérifier l'apparition des 3 raccourcis (Ajouter une tâche / Courses / Nouvelle note) et que chacun ouvre bien l'écran attendu, formulaire déplié pour Tâches et Notes.

## Non fait

Push non effectué, conformément à la consigne — en attente de confirmation de Vincent avant de pousser sur `kilio`.
