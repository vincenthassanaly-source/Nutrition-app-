# Agenda — grille horaire (Semaine + Jour) et heures de travail configurables

## Objectif

Remplacer les vues Semaine (cases avec aperçu texte) et Jour (liste simple) par une vraie
grille horaire type Google Calendar, avec une bande "heures de travail" configurable par
jour de la semaine, et une heure de fin optionnelle sur les tâches pour représenter une durée.

## Décisions prises

- **Convention `jour_semaine`** : alignée sur `date-fns` `getDay()` (0 = dimanche … 6 =
  samedi), pas sur l'ordre d'affichage lundi→dimanche (`weekStartsOn: 1`) déjà utilisé par
  `WeekView`/`MonthView`. `weekStartsOn` ne change que l'ordre d'affichage des jours, pas la
  valeur renvoyée par `getDay()` : les deux conventions cohabitent sans conflit, `WeekView`/
  `DayView` retrouvent l'horaire du jour via `horaires.find(h => h.jour_semaine === getDay(day))`.
  `HorairesForm` affiche les 7 lignes dans l'ordre lundi→dimanche pour rester cohérent avec le
  reste de l'Agenda, mais soumet les champs par `jour_semaine` (valeur `getDay()`).
- **Jour "non travaillé"** : `heure_debut`/`heure_fin` à `null` tous les deux. Dans la grille,
  ça se traduit par l'absence de bande "heures de travail" (option la plus simple, pas de bande
  "fermé" dédiée — à ajuster si Vincent préfère un repère visuel explicite). Dans le formulaire de
  réglage, une case "Non travaillé" par jour masque les deux champs heure et force leur valeur à
  `null` côté serveur (jamais fait confiance aux champs masqués côté client).
- **Hauteur par défaut d'une tâche sans `heure_fin`** : 30 minutes (`DEFAULT_TASK_DURATION_MINUTES`
  dans `TimeGrid.tsx`), cohérent avec les paliers de rappel existants (5/15/30 min). Une tâche
  avec `heure` mais sans `heure_fin` reste donc visible comme un bloc, jamais un simple repère
  ponctuel.
- **Largeur des colonnes Semaine sur mobile** : colonnes à largeur fixe (96px) + gouttière
  d'heures collante à gauche (`sticky left-0`), le tout dans un conteneur `overflow-x-auto`.
  Sur un écran ~380px, 7 colonnes ne peuvent pas rester lisibles en les comprimant : le choix a
  été de garder une largeur minimale lisible (titre + heure visibles) et de laisser défiler
  horizontalement plutôt que de tout tasser. Le clic sur une colonne (en-tête, bande "sans
  heure" ou grille) bascule vers la vue Jour (`onSelectDay`), comportement préexistant conservé.
- **Plage horaire affichée** : 24h pleines avec scroll vertical (pas de découpage arbitraire à la
  Google Calendar "8h-20h"), scroll initial positionné sur l'heure actuelle si le jour
  affiché (Jour) ou l'un des jours de la semaine affichée (Semaine) est aujourd'hui, sinon sur le
  début des heures de travail du jour de référence, avec repli sur 8h si aucun horaire n'est
  configuré (`computeInitialScrollMinutes` dans `TimeGrid.tsx`).
- **Tâches "toute la journée" et tâches sans heure** : pas de pattern existant trouvé dans le
  code (aucune bande dédiée avant ce chantier). Choix : les tâches sans `heure` (qu'elles soient
  "toute la journée" ou simplement sans heure précise) sont regroupées dans une petite bande
  compacte au-dessus de la grille horaire de chaque colonne (Semaine) — la grille ne peut pas les
  positionner verticalement de toute façon.
- **Vue Jour : grille + liste conservées** — la consigne demandait de garder `AddTaskToggle` et
  le fallback "Aucune tâche ce jour-là", sans demander la suppression de la liste `TaskCard`
  existante (check-off, sous-tâches, images, édition...). Pour ne pas perdre ces fonctionnalités,
  la grille horaire a été ajoutée **au-dessus** de la liste existante (aperçu visuel des blocs),
  la liste `TaskCard` complète reste **en dessous**, inchangée. La grille s'affiche même sans
  tâche (bande heures de travail visible, grille vide sinon).

## Fichiers créés

- `scripts/migration-taches-heure-fin-2026-09-01.sql` / `-revert-...sql`
- `scripts/migration-horaires-travail-2026-09-01.sql` / `-revert-...sql`
- `src/app/actions/horaires.ts` — `getHorairesTravail()`, `updateHorairesTravail()`
- `src/app/(app)/agenda/TimeGrid.tsx` — logique/composants partagés de grille horaire
  (`HOUR_HEIGHT`, `GRID_HEIGHT`, `getTacheBlockStyle`, `computeInitialScrollMinutes`,
  `useInitialScroll`, `TimeGutter`, `HourLines`, `WorkHoursBand`)
- `src/app/(app)/agenda/HorairesForm.tsx` — formulaire des 7 jours (heure début/fin + case
  "non travaillé"), affiché dans une `Modal`

## Fichiers modifiés

- `src/lib/supabase/types.ts` — régénéré via `mcp__Supabase__generate_typescript_types`
  (ajout `taches.heure_fin` et table `horaires_travail`)
- `src/app/actions/taches.ts` — `parseTacheInput` accepte `heure_fin` (regex `HH:MM`,
  validation `heure_fin > heure`, forcé à `null` si `toute_la_journee`)
- `src/app/(app)/agenda/date-utils.ts` — ajout `heureToMinutes()`
- `src/app/(app)/agenda/WeekView.tsx` — grille horaire 7 colonnes + gouttière partagée
- `src/app/(app)/agenda/DayView.tsx` — grille horaire 1 colonne au-dessus de la liste existante
- `src/app/(app)/agenda/AgendaView.tsx` — bouton réglages (icône horloge) + `Modal` +
  `HorairesForm`, passe `horaires` aux vues Jour/Semaine
- `src/app/(app)/agenda/page.tsx` — récupère `getHorairesTravail()` en plus des données
  existantes
- `src/app/(app)/taches/AddTaskForm.tsx` — champ "Heure de fin (optionnel)", visible seulement
  si `heure` renseignée et `toute_la_journee` décochée
- `src/app/(app)/taches/TasksList.tsx` — `TaskCard` affiche `HH:MM – HH:MM` quand `heure_fin`
  est présente

## Migrations appliquées

Appliquées sur le projet Supabase `vsmtkopkqasrdnjceegp` via `mcp__Supabase__apply_migration` :
1. `taches_heure_fin_2026_09_01` — ajoute `taches.heure_fin time`
2. `horaires_travail_2026_09_01` — crée la table `horaires_travail`, réutilise la fonction
   `set_updated_at()` existante (vérifiée au préalable, pas recréée), seed des 7 jours à `null`

État de la base vérifié avant migration (`mcp__Supabase__list_tables` + `execute_sql`) :
`taches.heure_fin` et `horaires_travail` n'existaient pas, `set_updated_at()` existait déjà.
Types TypeScript régénérés après application.

## Vérifications (Phase 3)

- `npm install` — le dépôt n'avait pas de `node_modules` au démarrage de la session, installé
  avant toute vérification.
- `npx tsc --noEmit` : ✅ (une première tentative avant tout `next build` échouait sur
  `LayoutProps<"/">` introuvable dans `layout.tsx` — confirmé pré-existant, indépendant de ce
  chantier, en le reproduisant avec les changements Agenda mis de côté (`git stash`) : ce type
  est généré par Next.js dans `.next/types` au premier build/dev)
- `npx eslint .` : ✅ aucune erreur
- `npm run build` : ✅ build de production réussi, 22 routes générées
- `next dev` + `curl /agenda` : `500` — échec Supabase `Host not in allowlist:
  vsmtkopkqasrdnjceegp.supabase.co`, restriction réseau du sandbox (comme anticipé dans le
  prompt). L'erreur survient dès `getListes()` (appel pré-existant, avant même que
  `getHorairesTravail()` ne s'exécute), confirmant que ce n'est pas un problème introduit par ce
  chantier. Les 4 vues n'ont donc pas pu être vérifiées visuellement dans ce sandbox.

## Limitations connues

- Pas de vérification visuelle réelle dans un navigateur (accès Supabase bloqué dans le
  sandbox) : la grille (positionnement des blocs, bande heures de travail, scroll initial,
  overflow horizontal Semaine) n'a été validée que par relecture de code et compilation.
- Jour "non travaillé" : pas de repère visuel dédié ("fermé") dans la grille, juste l'absence
  de bande — à revoir si Vincent veut un signal plus explicite.
- Pas d'indicateur "heure actuelle" (ligne rouge type Google Calendar) dans la grille : hors
  périmètre du prompt, non ajouté.
- `HorairesForm` : pas de bouton "copier sur tous les jours" ni de préréglage rapide — chaque
  jour se configure individuellement.
