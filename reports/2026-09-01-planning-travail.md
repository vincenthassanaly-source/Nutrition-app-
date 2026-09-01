# Agenda — planning de travail à créneaux multiples (remplace `horaires_travail`)

## Objectif

Remplacer le système "heures de travail" (un créneau unique par jour, table `horaires_travail`,
créé plus tôt dans la journée) par un vrai planning de travail : plusieurs créneaux par jour
(pause déjeuner), un mercredi en alternance une semaine sur deux, une couleur dédiée bien
visible, et suppression de l'interface d'édition dans l'app (planning figé, encodé en base
directement).

## Décisions prises

- **Schéma `horaires_travail_creneaux`** : une ligne par créneau (pas par jour), `id` auto-
  incrémenté en clé primaire (plusieurs créneaux possibles pour un même `jour_semaine`).
  `heure_debut`/`heure_fin` en `not null` (contrairement à `horaires_travail` où elles étaient
  nullables pour représenter "non travaillé") : un jour non travaillé n'a simplement aucune ligne,
  plus besoin de convention `null`/`null`. `heure_fin > heure_debut` vérifié par contrainte
  `check`, comme avant.
- **Fréquence** : colonne `frequence` (`toutes_les_semaines` | `une_semaine_sur_deux`) plutôt que
  deux tables séparées ou une table de récurrence générique — le besoin réel de Vincent est
  binaire (un jour alterne ou non), pas la peine d'anticiper autre chose. `semaine_reference`
  (date quelconque tombant dans une semaine "travaillée") sert uniquement de point d'ancrage pour
  le calcul de parité ; laissée `null` pour les créneaux `toutes_les_semaines`.
- **Calcul de parité (`estSemaineTravaillee`)** : `differenceInCalendarWeeks(date, semaineReference,
  { weekStartsOn: 1 })`, écart pair (`Math.abs(diff) % 2 === 0`) ⇒ semaine travaillée. Comparaison
  par semaine calendaire (lundi à lundi) plutôt que par nombre de jours écoulés, pour éviter tout
  décalage lié à l'heure ou au jour exact de `semaine_reference` dans sa semaine — n'importe quelle
  date de la semaine "travaillée" de référence donne le même résultat.
- **`getCreneauxDuJour`** : filtre d'abord par `jour_semaine === getDay(date)` (convention
  `getDay()` inchangée : 0 = dimanche … 6 = samedi, alignée sur le reste de l'Agenda), puis garde
  toujours les créneaux `toutes_les_semaines` et ne garde les `une_semaine_sur_deux` que si
  `estSemaineTravaillee` est vraie pour ce jour. Placé dans `src/lib/agenda/planning-travail.ts`
  (logique pure, pattern `compute.ts`), réutilisé identiquement par `WeekView` et `DayView`.
- **Couleur dédiée `--accent-planning-travail`** : vert foncé/désaturé, dérivé de la même teinte
  (`150`) que `--accent-reglages` mais en plus sombre et moins saturé (`oklch(0.38 0.09 150)` clair
  / `oklch(0.5 0.1 150)` sombre, contre `oklch(0.55 0.14 150)` / `oklch(0.72 0.13 150)` pour
  `--accent-reglages`) — reste distinct de `--accent-agenda` (teinte `230`, bleu) et
  `--accent-kcal` (teinte `165`, vert-bleu). Appliquée à `opacity: 0.3` (contre `0.1` pour
  l'ancienne bande) pour rester bien visible comme demandé.
- **`WorkHoursBand`** : accepte désormais un tableau de créneaux et rend un `<div>` positionné par
  créneau (au lieu d'un seul), avec sa propre `key={creneau.id}` — la pause déjeuner apparaît donc
  comme deux bandes disjointes dans la grille plutôt qu'une seule bande continue.
- **Suppression de l'édition en app** : `getPlanningTravail()` reste la seule fonction exportée par
  `src/app/actions/planning-travail.ts` (lecture seule, `order by jour_semaine, heure_debut`).
  `updateHorairesTravail` et `HoraireFormState` supprimés sans remplacement, `HorairesForm.tsx`
  supprimé, bouton horloge + `Modal` "Heures de travail" retirés d'`AgendaView.tsx`. Le planning
  est désormais figé côté base ; toute évolution future passera par une nouvelle migration SQL.
- **Renommage `horaires` → `creneaux`** dans les props de `WeekView`/`DayView`/`AgendaView`, pour
  refléter que ce ne sont plus des horaires par jour mais des créneaux (potentiellement plusieurs
  par jour, filtrés côté vue via `getCreneauxDuJour`).

## Fichiers créés

- `scripts/migration-planning-travail-2026-09-01.sql` / `-revert.sql`
- `src/lib/agenda/planning-travail.ts` — `estSemaineTravaillee()`, `getCreneauxDuJour()`
- `src/app/actions/planning-travail.ts` — `getPlanningTravail()` (remplace `horaires.ts`)

## Fichiers modifiés

- `src/lib/supabase/types.ts` — régénéré via `mcp__Supabase__generate_typescript_types` (table
  `horaires_travail_creneaux` à la place de `horaires_travail`)
- `src/app/globals.css` — `--accent-planning-travail` (clair + sombre) et son mapping
  `--color-planning-travail` dans `@theme inline`
- `src/app/(app)/agenda/TimeGrid.tsx` — `WorkHoursBand` accepte `creneaux: Tables<"horaires_travail_creneaux">[]`
  (un `<div>` par créneau, `--accent-planning-travail` à `opacity: 0.3`) ; `computeInitialScrollMinutes`
  prend `creneaux` et retient le créneau le plus tôt du jour (repli 8h si aucun)
- `src/app/(app)/agenda/WeekView.tsx` — prop `creneaux`, `getCreneauxDuJour(creneaux, day)` par
  colonne, passé à `WorkHoursBand` et `computeInitialScrollMinutes` ; import `getDay` retiré (plus
  utilisé directement, délégué à `getCreneauxDuJour`)
- `src/app/(app)/agenda/DayView.tsx` — même changement pour la vue Jour
- `src/app/(app)/agenda/AgendaView.tsx` — bouton horloge, `Modal` "Heures de travail" et import de
  `HorairesForm` supprimés ; prop `horaires` renommée `creneaux`, transmise à `DayView`/`WeekView`
- `src/app/(app)/agenda/page.tsx` — `getHorairesTravail()` → `getPlanningTravail()`, `creneaux`
  passé à `AgendaView`

## Fichiers supprimés

- `src/app/actions/horaires.ts`
- `src/app/(app)/agenda/HorairesForm.tsx`

## Migrations appliquées

Appliquée sur le projet Supabase `vsmtkopkqasrdnjceegp` via `mcp__Supabase__apply_migration` :
`planning_travail_2026_09_01` — `drop table horaires_travail`, création de
`horaires_travail_creneaux` (+ trigger `set_updated_at`, réutilise la fonction existante), seed des
7 créneaux du planning de Vincent (mercredi matin/après-midi en alternance à partir du mercredi
2 septembre 2026, jeudi/vendredi matin/après-midi toutes les semaines, samedi journée continue
toutes les semaines).

État de la base vérifié avant migration (`mcp__Supabase__execute_sql`) : les 7 lignes de
`horaires_travail` avaient bien `heure_debut`/`heure_fin` à `null` (aucune donnée saisie par
Vincent), conforme à l'attendu — suppression effectuée sans perte de données réelles. Types
TypeScript régénérés après application et données relues pour confirmation.

## Vérifications (Phase 3)

- `npm install` — le dépôt n'avait pas de `node_modules` au démarrage de la session (nouvel
  environnement), installé avant toute vérification (un premier essai a échoué sur une coupure
  réseau `ECONNRESET`, retenté avec succès).
- `npx tsc --noEmit` : une seule erreur, `src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'`
  — pré-existante et déjà documentée dans `reports/2026-09-01-agenda-grille-horaire.md` (type
  généré par Next.js dans `.next/types` au premier `build`/`dev`, absent d'un `tsc --noEmit` isolé).
  Non liée à ce chantier, non corrigée.
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` : ✅ build de production réussi (Next.js 16.3.3, Turbopack), 22 routes générées,
  y compris `/agenda`. La vérification TypeScript intégrée au build passe sans l'erreur
  `LayoutProps` (générée avant coup par le build lui-même).

## Limitations connues

- Pas de vérification visuelle dans un navigateur : comme lors du chantier précédent sur cette
  même Agenda, l'accès réseau au projet Supabase (`vsmtkopkqasrdnjceegp.supabase.co`) est bloqué
  dans ce sandbox pour un `next dev`. Le rendu des bandes multiples (pause déjeuner), la couleur
  `--accent-planning-travail` et l'alternance du mercredi n'ont été validés que par relecture de
  code, compilation et lecture directe des données en base (Supabase MCP).
- Plus aucune interface d'édition du planning dans l'app (retirée volontairement, comme demandé) :
  toute correction ou évolution du planning de Vincent nécessitera une nouvelle migration SQL
  manuelle, pas un formulaire.
- `getCreneauxDuJour` ignore silencieusement un créneau `une_semaine_sur_deux` dont
  `semaine_reference` serait `null` (cas qui ne devrait pas se produire vu la contrainte
  applicative, mais la base ne l'interdit pas au niveau SQL) — pas de contrainte `check` ajoutée
  en base pour rester au plus près du schéma fourni dans la demande.
