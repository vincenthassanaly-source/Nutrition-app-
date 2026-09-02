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

## Suite (retours après premier test sur téléphone)

Trois correctifs demandés après un premier essai réel :

1. **Vue Jour : la ligne de minuit était coupée en haut de la grille** (bug indépendant du
   zoom). Cause : `TimeGutter`/`HourLines` positionnent le libellé de chaque heure centré sur le
   trait (`-translate-y-1/2`), donc la toute première heure affichée déborde d'environ 6px
   au-dessus du bord haut de la zone de scroll — bord qui coïncide exactement avec `top: 0` en
   l'absence d'espace au-dessus (contrairement à la vue Semaine, qui a déjà un en-tête de 44px
   au-dessus de la grille). Corrigé en ajoutant `pt-2` (8px) au conteneur flex qui enveloppe
   `TimeGutter` + la grille dans `DayView.tsx`, ce qui laisse la place nécessaire à l'étiquette de
   la première heure. Générique : reste valable quelle que soit l'heure de début affichée.
2. **Vue Semaine : zoom minimal fixé dynamiquement à "les 7 jours remplissent exactement
   l'écran"**. Le plancher fixe (`MIN_ZOOM = 0.35`) laissait un vide à droite sur l'écran de
   Vincent (visible sur sa capture). Remplacé par un calcul dynamique
   (`computeMinZoomForWeekWidth` dans `useAgendaZoom.ts`) : `WeekView` mesure la largeur réelle
   visible de son conteneur scrollable via `ResizeObserver` (réagit aussi à une rotation
   d'écran/redimensionnement), et en déduit le zoom exact où `34px (gouttière) + 7 ×
   dayColumnWidth = largeur du conteneur`. Ce zoom devient le nouveau plancher — impossible de
   dézoomer davantage, quel que soit l'appareil. Le plafond de zoom (`MAX_ZOOM = 2`) n'a pas été
   modifié (non demandé). `useAgendaZoom()` accepte maintenant un `minZoom` optionnel ;
   `DayView` ne le fournit pas et garde le plancher par défaut (`MIN_ZOOM_FALLBACK = 0.35`),
   utilisé aussi comme repli avant la première mesure du conteneur Semaine.
3. **Masquage des heures 00h-06h dans les deux vues**. `TimeGrid.tsx` affiche désormais 18h
   (06h-24h) au lieu de 24h : `HOURS` démarre à `GRID_START_HOUR = 6`, `gridHeight`/`minutesToPx`
   sont recalées sur ce début (une tâche avec une heure avant 6h — cas non prévu par Vincent —
   obtiendrait un `top` négatif et resterait hors-écran, sans plantage). Ce changement réduit
   mécaniquement la hauteur totale de la grille à tous les niveaux de zoom, dans les deux vues.

### Fichiers modifiés (suite)

- `src/app/(app)/agenda/useAgendaZoom.ts` — `minZoom` paramétrable, `computeMinZoomForWeekWidth`,
  `GUTTER_WIDTH`/`WEEK_DAYS_COUNT` exportés, renommage `MIN_ZOOM` → `MIN_ZOOM_FALLBACK`
- `src/app/(app)/agenda/TimeGrid.tsx` — grille recalée sur `GRID_START_HOUR = 6`
- `src/app/(app)/agenda/WeekView.tsx` — mesure de largeur (`ResizeObserver`) + `minZoom` dynamique
- `src/app/(app)/agenda/DayView.tsx` — `pt-2` pour corriger le rognage de la première heure

### Vérifications (suite)

`npx tsc --noEmit`, `npx eslint "src/app/(app)/agenda/**/*.tsx" "src/app/(app)/agenda/**/*.ts"` et
`npx next build` : ✅ tous passés sans erreur après ces changements. Pas de nouvelle vérification
visuelle sur appareil réel dans ce sandbox (même limitation qu'en première partie) — Vincent
devra retester sur son téléphone.

## Fin

Ces correctifs sont committés localement ; en attente de confirmation de Vincent avant de
pousser sur `kilio`.
