# Agenda — pinch-to-zoom tactile sur la grille horaire (Semaine + Jour)

## Objectif

Ajouter un geste pinch-to-zoom à 2 doigts sur la grille horaire partagée par les vues Semaine et
Jour, qui compresse/étend simultanément et proportionnellement la hauteur des heures et la
largeur des colonnes de jours (zoom combiné). Le niveau de zoom est mémorisé en `localStorage` et
partagé entre les deux vues.

## Ce qui a été fait

- Nouveau hook `useAgendaZoom()` qui gère l'état de zoom, la persistance `localStorage`
  (clé `kilio-agenda-zoom`) et les handlers de pinch tactile (`onTouchStart`/`onTouchMove`/
  `onTouchEnd`) à spreader sur le conteneur scrollable de la grille.
- `TimeGrid.tsx` : toutes les dimensions fixes (`HOUR_HEIGHT`, `GRID_HEIGHT`) sont devenues des
  fonctions dépendant du zoom (`hourHeight(zoom)`, `gridHeight(zoom)`, `minutesToPx(minutes, zoom)`,
  `getTacheBlockStyle(tache, zoom)`), et les composants partagés (`TimeGutter`, `HourLines`,
  `WorkHoursBand`) acceptent désormais une prop `zoom`.
- `WeekView.tsx` et `DayView.tsx` appellent chacun `useAgendaZoom()` (état partagé via la même
  clé `localStorage`, pas de remontée en props), calculent `dayColumnWidth = BASE_DAY_COLUMN_WIDTH
  * zoom`, bindent les `touchHandlers` sur leur conteneur `overflow-auto`, et passent `zoom` aux
  composants de grille.
- Aucune librairie de gestes tierce ajoutée : pinch géré en JS natif via `TouchEvent`
  (`e.touches[0]`/`e.touches[1]`, distance euclidienne entre les deux points).
- Pas de `CSS transform: scale()` : toutes les dimensions sont recalculées en px réels (cohérent
  avec l'architecture existante en constantes JS/inline styles), donc le scroll et le
  positionnement des blocs de tâches restent exacts à tous les niveaux de zoom.
- Zoom par défaut (1) : reproduit exactement le rendu actuel, aucune régression visuelle si
  l'utilisateur ne pince jamais (dimensions identiques aux constantes `HOUR_HEIGHT`/
  `DAY_COLUMN_WIDTH` d'origine).
- `style={{ touchAction: "pan-x pan-y" }}` ajouté sur les conteneurs scrollables : désactive le
  pinch-zoom natif du navigateur (qui zoomerait la page entière au lieu de la grille) tout en
  gardant le scroll tactile normal (vertical pour Jour, horizontal+vertical pour Semaine).

## Fichiers créés

- `src/app/(app)/agenda/useAgendaZoom.ts`

## Fichiers modifiés

- `src/app/(app)/agenda/TimeGrid.tsx`
- `src/app/(app)/agenda/WeekView.tsx`
- `src/app/(app)/agenda/DayView.tsx`

`date-utils.ts` n'a pas eu besoin d'être modifié (aucune dépendance aux dimensions de grille).

## Bornes de zoom retenues

- `DEFAULT_ZOOM = 1`, `BASE_HOUR_HEIGHT = 56`, `BASE_DAY_COLUMN_WIDTH = 96` (valeurs actuelles,
  inchangées).
- `MIN_ZOOM = 0.35` : à ce niveau, `dayColumnWidth ≈ 33.6px` → largeur totale de la grille Semaine
  (gouttière 34px + 7 colonnes) ≈ 269px, confortablement sous les ~380px d'un écran mobile
  standard sans scroll horizontal. Côté Jour, `hourHeight ≈ 19.6px` → grille 24h ≈ 470px de haut,
  dans la fourchette ~500-600px de grille visible visée sans double scroll.
- `MAX_ZOOM = 2` : `hourHeight = 112px`, `dayColumnWidth = 192px` — zoom supérieur au rendu par
  défaut pour le confort de lecture fine (titres de tâches longs, chevauchement d'horaires serrés).
- Ces bornes sont des estimations calculées à partir des dimensions cibles données dans la
  consigne (~380px de large, ~500-600px de grille visible) ; elles n'ont pas pu être validées sur
  un vrai appareil tactile (voir Limitations).

## Comportement de la persistance localStorage

- Clé `kilio-agenda-zoom`, valeur = nombre (zoom) sérialisé en string.
- Lecture via `useSyncExternalStore` (et non `useEffect` + `setState`, qui aurait déclenché la
  règle ESLint `react-hooks/set-state-in-effect` — rendu en cascade au montage) : le rendu serveur
  et le tout premier rendu client utilisent `DEFAULT_ZOOM` (pas de mismatch d'hydratation), puis
  React se resynchronise automatiquement sur la vraie valeur `localStorage` dans un rendu suivant.
  Une resynchronisation `storage` (changement dans un autre onglet) est aussi écoutée.
- Écriture : uniquement à la fin d'un geste de pinch (`onTouchEnd`, quand il ne reste plus que 0
  ou 1 doigt), jamais à chaque `onTouchMove` — évite d'écrire en boucle dans `localStorage`
  pendant le geste. Pendant le pinch, le zoom affiché est un état React local ("live"), mis à
  jour au maximum une fois par frame (`requestAnimationFrame`) pour rester fluide.

## Limitations connues

- **Pas de support pinch souris/trackpad** : uniquement des `TouchEvent`, donc uniquement les
  écrans tactiles (mobile/tablette). Un utilisateur desktop n'a aucun moyen de changer le zoom
  (ni molette+Ctrl, ni double-clic) — hors périmètre de la consigne, qui demandait explicitement
  un geste pinch à 2 doigts en JS natif.
- **Positionnement du scroll initial pour un zoom mémorisé non-défaut** : le scroll initial
  (heure actuelle ou début des heures de travail) est calculé une seule fois au montage, avec le
  zoom disponible à cet instant. Comme la vraie valeur `localStorage` n'est appliquée qu'après le
  tout premier rendu (pour éviter le mismatch d'hydratation, voir ci-dessus), un utilisateur
  revenant avec un zoom mémorisé différent de 1 peut voir un positionnement de scroll initial
  légèrement imprécis (décalage proportionnel à l'écart de zoom) avant que la grille ne se
  redimensionne à la bonne échelle. Le scroll ne se recale pas ensuite (choix volontaire, pour ne
  jamais écraser un scroll manuel de l'utilisateur), donc l'imprécision n'est pas auto-corrigée.
  Impact mineur : pas de crash, la grille reste utilisable, juste un cadrage vertical initial
  potentiellement pas parfaitement centré sur l'heure cible pour ce cas précis.
- **Pas de vérification visuelle réelle sur appareil tactile** : `tsc --noEmit`, `eslint` et
  `next build` sont passés sans erreur (voir Vérifications), mais le geste de pinch lui-même
  (fluidité, seuils de zoom, comportement de `touch-action`) n'a pas pu être testé sur un vrai
  écran tactile dans ce sandbox — validé par relecture de code uniquement.
- Pas de bouton zoom +/- ni d'indicateur du niveau de zoom actuel dans l'UI — hors périmètre de
  la consigne (geste pinch uniquement).

## Vérifications (Phase 3)

- `npm install` : dépôt sans `node_modules` au démarrage de la session, installé avant toute
  vérification.
- `npx tsc --noEmit` : ✅ (seule erreur restante : `LayoutProps` introuvable dans
  `src/app/layout.tsx`, confirmée pré-existante et indépendante de ce chantier en la reproduisant
  avec les changements Agenda mis de côté via `git stash` — ce type est régénéré par Next.js au
  premier `next dev`/`next build`).
- `npx eslint "src/app/(app)/agenda/**/*.tsx" "src/app/(app)/agenda/**/*.ts"` : ✅ aucune erreur
  (une première version du hook utilisait `useEffect` + `setState` pour charger la valeur
  `localStorage` au montage, ce que la règle `react-hooks/set-state-in-effect` interdit désormais
  — corrigé en passant par `useSyncExternalStore`, voir section persistance ci-dessus).
- `npx next build` : ✅ build de production réussi, toutes les routes générées dont `/agenda`.
- Recherche `HOUR_HEIGHT|GRID_HEIGHT|DAY_COLUMN_WIDTH` dans `src/` : confirmé qu'aucun fichier en
  dehors de `TimeGrid.tsx`/`WeekView.tsx`/`DayView.tsx` ne dépendait de ces exports avant le
  changement de signature.

## Fin

Rien n'a été poussé sur la branche `kilio` — en attente de confirmation de Vincent.
