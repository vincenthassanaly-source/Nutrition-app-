# Feedback tactile natif (haptique, pull-to-refresh) + file d'attente offline

> **Mise à jour** : le swipe-to-delete (2.2 du prompt initial) a été
> implémenté puis **retiré** sur retour visuel de Vincent (rendu en usage
> réel non satisfaisant — voir capture fournie : le fond rouge "Supprimer"
> restait visible/mal positionné derrière plusieurs cartes à la fois plutôt
> que de rester caché tant que l'item n'est pas swipé). `SwipeToDelete.tsx`
> a été supprimé et les 4 listes (Tâches, Notes, Courses, Habitudes) sont
> revenues à leurs boutons "Suppr."/"Archiver" explicites uniquement, sans
> geste de swipe. Le reste (haptique, pull-to-refresh, file d'attente
> offline) est inchangé et reste en place.

## Fichiers créés

- **`src/lib/haptics.ts`** : `vibrate(pattern?)`, wrapper de `navigator.vibrate`
  avec check de support (`"vibrate" in navigator`), no-op silencieux sinon
  (try/catch inclus — certains navigateurs lèvent si l'appel n'est pas
  rattaché à un geste utilisateur direct).
- **`src/components/PullToRefresh.tsx`** : détecte un tiré vers le bas
  quand le conteneur scrollable ancêtre (trouvé en remontant les parents
  jusqu'à `overflow-y: auto|scroll`, `main` en pratique) est en haut de
  page (`scrollTop === 0`). Affiche un indicateur circulaire dont la
  hauteur/rotation suit le geste, puis à la fin du geste (si le seuil de
  70px est franchi) : `onRefresh?.()` (optionnel, pour invalider un cache
  React Query local) puis `router.refresh()` systématiquement.
- **`src/lib/offline/db.ts`** : base IndexedDB Dexie (`kilio-offline`),
  table `pending_actions` (`id`, `module`, `action_name`, `payload: unknown[]`,
  `created_at`).
- **`src/lib/offline/queue.ts`** : `enqueueAction(module, actionName, payload)`
  stocke l'action ; `flushQueue()` rejoue les actions en attente dans
  l'ordre via un mapping `module → { actionName → Server Action }`, les
  supprime au fur et à mesure, toast "X action(s) synchronisée(s)" si au
  moins une a réussi ; s'arrête au premier échec (les suivantes restent en
  file pour le prochain flush). `isNetworkError(error)` distingue une
  erreur réseau (`navigator.onLine === false` ou message
  `failed to fetch`/`networkerror`/`load failed`) d'une erreur métier
  serveur (validation…), qui doit continuer à s'afficher normalement.
- **`src/lib/offline/useOnlineSync.ts`** : écoute `online`/`offline`,
  appelle `flushQueue()` au retour en ligne (et une fois au montage si déjà
  en ligne, pour le cas où l'app est rouverte avec une file laissée par une
  session précédente). Expose `isOnline`. Monté une seule fois dans
  `src/app/providers.tsx` (comme `ToastHost`), donc actif sur toute l'app.
- **`src/app/(app)/courses/CoursesView.tsx`** : nouveau composant client
  (le module Courses n'en avait pas) qui assemble `AddCourseToggle` +
  `CoursesList` sous un seul `PullToRefresh`, pour avoir accès à
  `useQueryClient` au bon niveau.

## Fichiers modifiés

**Haptique (2.1)** — `vibrate()` ajouté sur la mutation de cochage dans :
`DashboardTaskItem.tsx`, `TasksList.tsx` (`TaskCard`), `DashboardHabitItem.tsx`,
`HabitudeCard.tsx`. Pas ajouté sur le cochage d'un article de courses ni
d'un item de checklist de note (hors scope explicite du prompt — seuls
tâches et habitudes sont listées). Le `vibrate()` prévu sur la confirmation
de suppression (swipe) n'a plus de point d'appel depuis le retrait du
swipe-to-delete.

**Swipe-to-delete (2.2)** — implémenté puis retiré, voir note en tête de
rapport. `SwipeToDelete.tsx` supprimé ; `TasksList.tsx`, `notes/NoteCard.tsx`,
`courses/CoursesList.tsx`, `habitudes/HabitudeCard.tsx` reviennent à leur
structure d'avant ce prompt (mutations de suppression/haptique/offline
queue conservées, juste le wrapping de swipe retiré).

**Pull-to-refresh (2.3)** — intégré sur les 5 pages demandées :
- `src/app/(app)/page.tsx` (dashboard) : `PullToRefresh` enveloppe
  `DashboardView` à l'intérieur du `HydrationBoundary` existant. Pas de
  `onRefresh` custom : `router.refresh()` seul suffit ici, car il ré-exécute
  le prefetch serveur et réhydrate le cache TanStack Query avec des données
  fraîches (`dataUpdatedAt` plus récent que le cache client).
- `taches/TachesView.tsx`, `notes/NotesGrid.tsx`, `habitudes/HabitudesView.tsx` :
  ces vues n'ont pas de prefetch serveur (fetch 100% client via `useQuery`,
  voir `reports/2026-09-03-dashboard-hydration-tanstack-query.md`) —
  `router.refresh()` seul n'y aurait aucun effet visible. `onRefresh` y
  invalide donc explicitement les `queryKeys` concernés
  (`queryClient.invalidateQueries`) en plus de l'appel à `router.refresh()`
  fait par `PullToRefresh` lui-même.
- `courses/page.tsx` : simplifié pour déléguer à `CoursesView.tsx`, seul
  endroit avec accès à `useQueryClient` pour invalider `queryKeys.courses`.

**CSS** — `src/app/(app)/layout.tsx` : `overscrollBehaviorY: "contain"`
ajouté sur `<main>` (conteneur scrollable global de l'app), pour désactiver
le pull-to-refresh natif du navigateur et éviter le conflit visuel avec
l'indicateur custom.

**File d'attente offline (2.4)** :
- `package.json` : ajout de `dexie` (`^4.0.10`).
- `src/app/providers.tsx` : `useOnlineSync()` monté au niveau racine.
- Wrapping try/catch + `enqueueAction` sur les écritures les plus
  fréquentes des 4 modules du scope, côté appelant (dans les
  `mutationFn`/`startTransition` des composants, pas dans les Server
  Actions elles-mêmes) :
  - **Tâches** : `toggleTache`, `deleteTache` (`DashboardTaskItem.tsx`,
    `TasksList.tsx`).
  - **Notes** : `toggleNoteItem`, `deleteNote` (`NoteCard.tsx`).
  - **Courses** : `createCourseItem` (`AddCourseForm.tsx`),
    `toggleCourseItem`, `deleteCourseItem` (`CoursesList.tsx`).
  - **Habitudes** : `enregistrerEntreeHabitude`, `supprimerHabitude`
    (`DashboardHabitItem.tsx`, `HabitudeCard.tsx`).
  - Dans chaque cas : succès réseau → comportement inchangé ; échec réseau
    (`isNetworkError`) → `enqueueAction(...)` + toast "Enregistré, sera
    synchronisé à la reconnexion", la mutation résout normalement (pas de
    rollback de la mise à jour optimiste, puisque l'action *sera* rejouée) ;
    échec non réseau (erreur métier serveur) → propagé tel quel, le rollback
    + toast d'erreur existants s'appliquent normalement.

## Limitations connues

- **Modules non couverts** : Budget et Recettes n'ont ni haptique, ni
  swipe-to-delete, ni pull-to-refresh, ni file d'attente offline — hors
  scope volontaire du prompt.
- **Offline queue partielle** : seules les écritures les plus fréquentes de
  chaque module sont couvertes (cochage/suppression/ajout d'article). Les
  formulaires plus lourds (création/édition complète d'une tâche avec
  images, d'une note avec checklist, etc., qui passent par
  `useActionState`) ne sont pas mis en file s'ils échouent hors ligne —
  l'utilisateur revoit l'erreur habituelle du formulaire. Étendre la file
  à ces cas demanderait de sérialiser un `FormData` (dont des `File` pour
  les images de tâches), plus complexe qu'un tableau d'arguments JSON.
- **Reorder (`reordonnerTaches`, etc.), sous-tâches, tags** : non mis en
  file non plus (actions secondaires, pas listées comme "les plus
  utilisées").
- **Vérification interactive limitée dans cette session** : l'environnement
  d'exécution bloque l'accès réseau sortant vers le projet Supabase
  (`Host not in allowlist`), donc aucune liste réelle (tâches/notes/
  courses/habitudes) n'a pu être chargée pour tester le pull-to-refresh en
  conditions réelles dans le navigateur headless de cette session. `tsc`,
  `eslint` et `next build` passent tous sans erreur, et les 5 pages se
  chargent sans erreur JS ; la simulation de gestes tactiles via CDP s'est
  montrée peu fiable dans ce sandbox headless (touchstart atteint parfois
  les handlers React, touchmove non observé de façon reproductible). C'est
  d'ailleurs ce qui a empêché de repérer le problème visuel du swipe avant
  le retour de Vincent sur mobile réel — un test manuel sur un vrai
  appareil reste recommandé pour le pull-to-refresh également.

## Points de vigilance pour la suite

- **Conflit action en attente / donnée supprimée entretemps** : si une
  action en attente (ex. `toggleTache(id)`) référence une ligne supprimée
  entre l'enregistrement en file et le flush (ex. la tâche a été supprimée
  depuis un autre appareil), `flushQueue()` interprète toute erreur
  serveur comme "probablement encore hors ligne" et **arrête le flush**,
  laissant cette action bloquer indéfiniment les suivantes de la file tant
  qu'elle échoue. Un raffinement possible : distinguer une erreur réseau
  (on s'arrête, on retentera) d'une erreur applicative franche du type
  "ligne introuvable" (on purge silencieusement cette action précise et on
  continue avec les suivantes) — non fait ici pour rester dans le scope
  "purement front + queue simple" demandé.
- **Ordre de rejeu vs. dépendances entre actions** : `flushQueue()` rejoue
  dans l'ordre `created_at`, ce qui est correct pour deux actions sur la
  même ligne (ex. toggle puis delete de la même tâche), mais aucune
  détection de doublon/no-op n'existe (ex. toggle → toggle → toggle hors
  ligne rejoue 3 appels au lieu d'un état final équivalent en 1 appel).
  Sans impact fonctionnel ici (les actions couvertes sont idempotentes ou
  sans effet cumulatif), mais à garder en tête si la file est étendue à
  des actions non idempotentes.
- **Dexie et `output: "export"` / SSR** : `db.ts`/`queue.ts` sont chargés
  uniquement côté client (`"use client"`, appelés depuis des gestionnaires
  d'événements ou `useEffect`) — pas de risque d'exécution côté serveur,
  mais à surveiller si un jour un de ces modules est importé depuis un
  Server Component par erreur (Dexie accède à `indexedDB`, absent côté
  serveur).

## Vérifications effectuées

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint .` : aucune erreur ni warning.
- `npm run build` : build de production réussi, toutes les routes
  générées normalement (`/`, `/taches`, `/notes`, `/courses`, `/habitudes`
  inclus).
