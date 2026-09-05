# Créneaux de travail ponctuels (exceptions au planning récurrent)

## Objectif

Permettre d'ajouter un créneau de travail ponctuel, sur une date précise (non
récurrent), qui s'affiche exactement comme le planning récurrent existant
(même couleur `--accent-planning-travail`), sans toucher à la table
`horaires_travail_creneaux`.

## Constats préalables (phase d'exploration)

- Vérification de la base réelle (`vsmtkopkqasrdnjceegp`) via
  `mcp__Supabase__list_tables` / `execute_sql` : le schéma de
  `horaires_travail_creneaux` en base correspond **exactement** au repo
  (`scripts/migration-planning-travail-2026-09-01.sql`) — aucun décalage
  repo/DB cette fois, contrairement à ce qui avait été observé sur d'autres
  modules par le passé.
- La fonction `set_updated_at()` existe déjà en base (créée dans
  `migration-aliments-2026-08-27.sql`, corrigée dans
  `fix_set_updated_at_search_path`) : réutilisée telle quelle, non recréée.
- Aucun pattern existant de Server Action « créer un créneau » dans le repo
  pour `horaires_travail_creneaux` (le skill `kilio-planning-travail` écrit
  directement en base via Supabase MCP, hors app). Le style retenu pour les
  nouvelles actions s'inspire de `src/app/actions/courses.ts` (arguments
  simples, `throw new Error(...)` pour la validation, pas de `FormData`).

## Décisions prises

1. **Table séparée plutôt que réutiliser `horaires_travail_creneaux`** :
   conforme à la consigne (« sans toucher à `horaires_travail_creneaux` »).
   Schéma minimal, sans `jour_semaine`/`frequence`/`semaine_reference`
   (non pertinents pour un créneau ponctuel) mais avec une colonne `date`.
2. **Fusion dans `getCreneauxDuJour`** plutôt qu'une fonction séparée : la
   fonction existante est le point d'entrée unique déjà utilisé par les 4
   vues (Day/Week/Month + calcul du scroll initial), la modifier évite de
   dupliquer la logique de filtrage dans chaque vue. Le paramètre
   `exceptions` est optionnel (défaut `[]`) pour ne pas casser un éventuel
   appel externe non mis à jour.
3. **Type de retour `CreneauDuJour`** (`{ id, heure_debut, heure_fin }`) :
   les deux tables sources ont des formes différentes (`jour_semaine`,
   `frequence`… n'existent pas sur les exceptions), mais tous les
   consommateurs (`WorkHoursBand`, `computeInitialScrollMinutes`) n'utilisent
   que `id`/`heure_debut`/`heure_fin`. Un type structurel minimal évite un
   union type inutilement complexe.
4. **Validation basique dans la Server Action** (`heure_fin > heure_debut`,
   comparaison lexicale sur `"HH:MM"`) plutôt qu'un schéma de validation
   dédié, cohérent avec le niveau de validation des autres actions simples
   du repo (`courses.ts`, `check` SQL en base en filet de sécurité final).

## Schéma de la table

```sql
create table horaires_travail_exceptions (
  id bigint generated always as identity primary key,
  date date not null,
  heure_debut time not null,
  heure_fin time not null check (heure_fin > heure_debut),
  updated_at timestamptz not null default now()
);

create trigger horaires_travail_exceptions_set_updated_at
  before update on horaires_travail_exceptions
  for each row execute function set_updated_at();
```

Pas de RLS, pas de `user_id` — conforme aux conventions du repo (app
mono-utilisateur, cf. `suppression_auth_2026_08_29`).

Migration appliquée en base via `mcp__Supabase__apply_migration`
(`horaires_travail_exceptions_2026_09_05`), fichiers correspondants :
- `scripts/migration-horaires-travail-exceptions-2026-09-05.sql`
- `scripts/migration-horaires-travail-exceptions-revert-2026-09-05.sql`

## Fichiers modifiés

- **`src/lib/agenda/planning-travail.ts`** : nouveau type `CreneauDuJour`,
  `getCreneauxDuJour` accepte désormais un 3e paramètre optionnel
  `exceptions: Tables<"horaires_travail_exceptions">[]` et retourne la
  fusion créneaux récurrents applicables au jour + exceptions dont `date`
  correspond exactement à la date demandée.
- **`src/app/actions/planning-travail.ts`** : ajout de
  `getPlanningTravailExceptions()` (lecture, triée par date/heure) et
  `ajouterExceptionPlanningTravail(date, heure_debut, heure_fin)` (validation
  `heure_fin > heure_debut`, insert, `revalidatePath("/agenda")`).
- **`src/app/(app)/agenda/page.tsx`** : récupère aussi
  `getPlanningTravailExceptions()` en parallèle et passe `exceptions` à
  `AgendaView`.
- **`AgendaView.tsx`** : accepte `exceptions` et le transmet à `DayView`,
  `WeekView`, `MonthView`.
- **`DayView.tsx` / `WeekView.tsx` / `MonthView.tsx`** : acceptent
  `exceptions: Tables<"horaires_travail_exceptions">[]` et le passent en 3e
  argument à `getCreneauxDuJour`.
- **`TimeGrid.tsx`** : `WorkHoursBand` et `computeInitialScrollMinutes`
  typés sur `CreneauDuJour` (importé depuis `lib/agenda/planning-travail`)
  au lieu de `Tables<"horaires_travail_creneaux">` directement, puisqu'ils
  reçoivent maintenant le résultat fusionné de `getCreneauxDuJour`.
- **`src/lib/supabase/types.ts`** : régénéré via
  `mcp__Supabase__generate_typescript_types` — seul ajout constaté par
  rapport à la version précédente : le bloc `horaires_travail_exceptions`
  (vérifié par `diff`, aucun autre changement).

## Données insérées pour Vincent

Deux créneaux ponctuels insérés directement via `mcp__Supabase__execute_sql`
(aucune date en dur dans le code applicatif, dates calculées au moment de
l'exécution — aujourd'hui = samedi 5 septembre 2026) :

| id | date       | jour   | heure_debut | heure_fin |
|----|------------|--------|-------------|-----------|
| 1  | 2026-09-07 | lundi  | 17:30       | 19:30     |
| 2  | 2026-09-08 | mardi  | 16:30       | 19:30     |

## Vérifications (Phase 3)

- `npx tsc --noEmit` : OK (aucune erreur). Une erreur initiale
  (`Cannot find name 'LayoutProps'`) provenait de types Next.js non encore
  générés (`node_modules` fraîchement installés, aucun build précédent) —
  résolue après `npm run build`, sans lien avec ce changement.
- `npx eslint .` : OK (aucun avertissement/erreur).
- `npm run build` : OK, build de production complet, toutes les routes
  compilées (dont `/agenda`).

## Limitation connue / suite possible

Aucune UI n'a été ajoutée pour créer une exception depuis l'app (non demandé
par la tâche) : `ajouterExceptionPlanningTravail` est utilisable dès
maintenant par un futur formulaire ou par le skill `kilio-planning-travail`
si son périmètre est étendu aux exceptions ponctuelles.
