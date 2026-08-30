# Budget — périodes hebdomadaires/annuelles pour les budgets cibles — 2026-08-30

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : session déjà synchronisée sur `origin/kilio` (`9e18a19`, transactions récurrentes), aucun rattrapage nécessaire.
- Relecture de `scripts/migration-budget-2026-08-30.sql` (contrainte `budgets_periode_premier_jour` : `periode = date_trunc('month', periode)::date`, clé unique `(categorie_id, periode)`), `src/app/actions/budgets.ts`, `src/lib/budget/compute.ts`, `/budget/page.tsx`, `/budget/categories/page.tsx` + `CategorieProgressCard.tsx`/`CategoriesList.tsx`, `src/lib/supabase/types.ts`.
- Vérification en base (`mcp__Supabase__list_tables` sur `kilio`, `vsmtkopkqasrdnjceegp`) : **`budgets` contient 0 ligne**, confirmé avant migration — pas de migration de données à faire, le `default 'mensuel'` sur la nouvelle colonne suffit comme prévu par le prompt.
- Vérification explicite du comportement de `date_trunc('week', ...)` en Postgres (`execute_sql`) : `date_trunc('week', '2026-08-30'::date)` (un dimanche, `isodow = 7`) renvoie `2026-08-24` avec `isodow = 1` (lundi) — confirme la convention ISO-8601 (semaine calée sur le lundi) demandée par le prompt, sans ambiguïté à trancher.
- Aucun contrôle de navigation prev/next n'existait déjà côté mensuel : `/budget/categories/page.tsx` appelait toujours `premierJourDuMois()` (le mois en cours, non paramétrable) sans aucun contrôle de changement de période dans l'UI. Décision : ajouter des flèches précédent/suivant simples comme prévu par le prompt en absence de pattern existant à réutiliser, plutôt qu'un composant de calendrier plus riche.

## Décisions prises

### Modèle de données

- `type_periode_budget` (enum `hebdomadaire`/`mensuel`/`annuel`) + colonne `budgets.type_periode not null default 'mensuel'`, exactement comme demandé.
- **`periode` selon `type_periode`** : lundi de la semaine ISO (hebdo), premier jour du mois (mensuel, inchangé), 1er janvier (annuel) — une seule colonne `date` réutilisée pour les 3 sémantiques, comme demandé.
- **Contrainte de calage** : `budgets_periode_premier_jour` remplacée par `budgets_periode_calee`, un `case type_periode ... end` sur `date_trunc('week'|'month'|'year', periode)::date` — testée en base (cf. Phase 3) : une `periode` hebdo mal calée (un mardi) est bien rejetée.
- **Clé unique** `budgets_categorie_periode_key` (`categorie_id, periode`) remplacée par `budgets_categorie_periode_type_key` (`categorie_id, periode, type_periode`) : une catégorie peut désormais avoir un budget hebdo **et** mensuel **et** annuel simultanément actifs sur des périodes qui se recouvrent — testé en base (cf. Phase 3).
- Migration en une seule étape (`create type` suivi de son usage immédiat dans le même fichier) : contrairement à `alter type ... add value`, un `create type` fraîchement créé peut être utilisé dans la même transaction — pas de découpage en 2 migrations nécessaire ici, à la différence des migrations "virement" et "recurrence" précédentes.

### Fonctions pures (`src/lib/budget/compute.ts`)

- `premierJourDeLaSemaine(date)` / `finDeLaSemaine(periode)`, `premierJourDeLAnnee(date)` / `finDeLAnnee(periode)` : mêmes conventions de calcul (composants année/mois/jour extraits et reconstruits en date **locale**, jamais via `toISOString`) que `calculerProchaineOccurrence` du module récurrence, pour éviter tout décalage d'un jour selon le fuseau du serveur. Vérifiées en Node avec les mêmes valeurs que celles confirmées côté Postgres (2026-08-30 dimanche → lundi 2026-08-24).
- `bornesPeriode(periode, typePeriode)` : centralise le branchement par type (`{debut, fin}` pour une requête `gte/lt`), pour ne pas dupliquer cette logique dans chaque appelant — utilisée par `getSuiviCategories` à la place de l'appel direct à `finDuMois` seul.
- `periodeParDefaut(typePeriode)` et `periodeAdjacente(periode, typePeriode, direction)` : non demandées nommément par le prompt, mais nécessaires pour la navigation par onglets + flèches prev/suivant (calcul de la période "aujourd'hui" au changement d'onglet, et de la période précédente/suivante). Une période calée en entrée (toujours premier jour de semaine/mois/année) reste calée après ±1 unité — pas de risque de calage fin de mois ici, contrairement à `calculerProchaineOccurrence` sur des dates arbitraires.
- `formatPeriode(periode, typePeriode = "mensuel")` généralisée avec un second paramètre optionnel à défaut `"mensuel"`, pour que tous les appels existants (`formatPeriode(periode)`, sans second argument) continuent de fonctionner à l'identique. Formats retenus, conformes aux exemples du prompt : `"Semaine du 25 août 2026"` (hebdo), `"août 2026"` (mensuel, inchangé), `"Année 2026"` (annuel).

### Server Actions (`budgets.ts`)

- `upsertBudget` : accepte et valide désormais `type_periode` (rejeté si absent/invalide). La `periode` reçue du formulaire est **re-calée côté serveur** (jamais fait confiance telle quelle) via `premierJourDeLaSemaine`/`premierJourDuMois`/`premierJourDeLAnnee` selon `type_periode`, avant l'upsert — en pratique ce garde-fou est redondant avec la contrainte `check` en base (qui rejetterait de toute façon une valeur mal calée), mais évite un aller-retour en erreur inutile pour un cas qui ne devrait jamais se produire côté UI (la période est toujours calculée serveur, jamais saisie librement par l'utilisateur).
- `upsertBudget` conserve intégralement la règle "pas de budget sur une sous-catégorie", inchangée et indépendante du type de période, exactement comme demandé.
- `getSuiviCategories(periode, typePeriode = "mensuel")` : signature étendue avec `typePeriode` **optionnel, défaut `"mensuel"`** — un appel `getSuiviCategories(periode)` sans second argument continue de fonctionner exactement comme avant (vérifié : `/budget/page.tsx` n'a nécessité aucune modification). Utilise `bornesPeriode` pour la requête sur `transactions`, et filtre désormais aussi les `budgets` sur `type_periode` en plus de `periode`.

### UI

- **`/budget/page.tsx` (vue d'ensemble) : reste au mois en cours par défaut**, décision documentée comme demandée plutôt qu'imposée silencieusement — aucune modification de cette page n'a été nécessaire (`getSuiviCategories(periode)` défaut `"mensuel"`). Le hebdo/annuel se consulte uniquement depuis `/budget/categories`, qui devient la page pilotée par période. Alternative envisagée et écartée : dupliquer le résumé "catégories en dépassement" pour les 3 types sur la page d'accueil — rejetée pour ne pas complexifier l'écran d'entrée du module, conformément à la piste privilégiée par le prompt lui-même.
- **`/budget/categories`** : nouveau composant `PeriodeSelector.tsx` (onglets "Semaine / Mois / Année", même pattern visuel que les onglets Dépense/Revenu/Virement de `TransactionModeForm`) + flèches ← Précédent / Suivant →, piloté par les search params `type_periode`/`periode` de l'URL (même pattern que `TransactionsFilters.tsx` pour les filtres de `/budget/transactions`). `page.tsx` lit ces search params côté serveur, avec retombée sur `mensuel`/période du jour si absents.
- **Bug évité avant tout test** : `CategorieProgressCard` utilise un input `montant_cible` non contrôlé (`defaultValue`). Sans remonter le composant au changement de période, passer de "Mois" à "Semaine" aurait laissé affichée l'ancienne valeur du budget mensuel dans le champ au lieu de la valeur (ou de l'absence de valeur) du budget hebdo. Corrigé en incluant `type_periode`/`periode` dans la `key` React du composant dans `CategoriesList.tsx`, forçant un remount complet à chaque changement d'onglet ou de navigation — même pattern que `TransactionForm key={mode}` dans `TransactionModeForm.tsx`.
- Un budget par catégorie et par onglet, indépendants les uns des autres : chaque onglet affiche et édite uniquement le budget du `type_periode` actif, conformément à la demande.

## Ce qui a été créé/modifié

**Migration** : `scripts/migration-budget-periodes-hebdo-annuel-2026-08-30.sql` (appliquée via `mcp__Supabase__apply_migration`, nom `budget_periodes_hebdo_annuel`).

**Server Actions** : `src/app/actions/budgets.ts` — `upsertBudget` (validation + calage serveur de `type_periode`/`periode`), `getSuiviCategories` (paramètre `typePeriode` optionnel).

**Fonctions pures** (`src/lib/budget/compute.ts`) : `premierJourDeLaSemaine`, `finDeLaSemaine`, `premierJourDeLAnnee`, `finDeLAnnee`, `bornesPeriode`, `periodeParDefaut`, `periodeAdjacente`, `formatPeriode` généralisée.

**Types** : `src/lib/supabase/types.ts` mis à jour (edits ciblés plutôt que régénération complète, le diff ne portant que sur `budgets.type_periode` et l'enum `type_periode_budget`) — `habitudes`/`habitude_entries` restent absentes de la base réelle (toujours hors périmètre, re-signalé pour mémoire, cf. rapports précédents).

**UI** :
- `src/app/(app)/budget/categories/PeriodeSelector.tsx` (nouveau) : onglets + navigation prev/suivant.
- `src/app/(app)/budget/categories/page.tsx` : lit `type_periode`/`periode` depuis les search params, passe `typePeriode` à `CategoriesList`.
- `src/app/(app)/budget/categories/CategoriesList.tsx` / `CategorieProgressCard.tsx` : `typePeriode` transmis jusqu'au formulaire d'édition du budget cible (champ caché `type_periode`), placeholder adapté ("Budget cible de la semaine/du mois/de l'année"), `key` incluant la période pour forcer le remount au changement d'onglet.
- `src/app/(app)/budget/page.tsx` : **non modifié**.

## Résultat des vérifications (Phase 3)

- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **0 erreur, 0 warning**.
- `npm run build` : **build complet réussi**, les 5 routes `/budget/*` toujours générées en dynamique (`ƒ`).
- Vérification en base (`mcp__Supabase__list_tables`/`list_migrations`) : migration `budget_periodes_hebdo_annuel` enregistrée, colonne `budgets.type_periode` et enum `type_periode_budget` conformes.
- **Tests en base** (créés puis nettoyés) :
  1. Budget hebdo (`periode = 2026-08-24`, un lundi, 100€) **et** budget annuel (`periode = 2026-01-01`, 5000€) insérés simultanément sur la même catégorie ("Logement"), périodes qui se recouvrent forcément → **les deux insertions réussissent** grâce à la nouvelle clé unique à 3 colonnes.
  2. Insertion d'un budget hebdo avec une `periode` mal calée (`2026-08-25`, un mardi) → **rejetée** par `budgets_periode_calee`.
  3. `premierJourDeLaSemaine`/`finDeLaSemaine` (implémentation JS réelle, exécutée via Node) donnent exactement les mêmes dates que `date_trunc('week', ...)` côté Postgres pour la même date de référence (2026-08-30 → lundi 2026-08-24), et sont idempotentes sur un lundi déjà calé.
  4. Toutes les données de test supprimées ensuite ; compteur final `budgets` = 0, identique au compteur de départ.

## Limite d'environnement — test fonctionnel navigateur

Comme dans tous les rapports précédents du module, cette session sandbox n'a pas d'accès réseau direct à `vsmtkopkqasrdnjceegp.supabase.co` (`curl` : timeout/`000`) — seul l'outil MCP Supabase peut atteindre le projet. Impossible donc de lancer `next dev` et de cliquer dans les onglets Semaine/Mois/Année, les flèches de navigation, ou de vérifier visuellement que le champ de budget cible se vide/se remplit correctement au changement d'onglet (le fix de `key` React a été vérifié par lecture du code, pas par un clic réel). **Ce point reste à vérifier par Vincent en conditions réelles** avant de considérer l'UI définitivement validée.

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant le push.
