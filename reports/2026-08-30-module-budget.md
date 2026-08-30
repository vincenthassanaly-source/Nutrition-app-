# Ajout du module Budget (finances personnelles) — 2026-08-30

## Constats de la Phase 1

- Le module **Objectifs** (le plus récent avant celui-ci, multi-pages avec CRUD complet) sert de gabarit direct : `src/lib/modules.ts` / `ModulesGrid.tsx` pour la tuile d'accueil, Server Actions `creerX`/`modifierX`/`supprimerX` + `getX` avec `useActionState` côté client, pas de RLS.
- **Pas de RLS ni de `user_id`** confirmé une nouvelle fois : `migration-suppression-auth-2026-08-29.sql` a désactivé la RLS et supprimé `user_id` sur les tables historiques ; tous les modules ajoutés depuis (notes, taches, objectifs, habitudes) suivent ce pattern sans exception. **Écart assumé par rapport au prompt** (qui demandait des policies RLS par `user_id`) : `comptes`, `categories_budget`, `transactions` et `budgets` suivent le même pattern mono-utilisateur que le reste du repo — c'est le pattern réellement en place, confirmé par le code source plutôt que par le prompt générique.
- Aucune notion de devise/formatage monétaire préexistante dans le repo (`grep` sans résultat) : `formatMontant()` (Intl.NumberFormat fr-FR/EUR) créé dans `src/lib/budget/compute.ts`, sur le modèle de `src/lib/nutrition/compute.ts` (fonctions pures séparées des Server Actions, consommées par les pages serveur).
- Aucune table/route `budget`/`comptes`/`transactions` préexistante (vérifié via `mcp__Supabase__list_tables` sur le projet `kilio`, `vsmtkopkqasrdnjceegp`).
- Pattern d'icône libre en emoji repris de `habitudes.icone` (colonne `text` nullable) plutôt qu'un système de couleur par catégorie : évite d'introduire un nouveau concept UI, cohérent avec l'existant.

## Découverte hors périmètre (signalée, non corrigée)

En régénérant `src/lib/supabase/types.ts` via `mcp__Supabase__generate_typescript_types` puis en vérifiant via `mcp__Supabase__execute_sql` sur `information_schema.tables`, les tables **`habitudes` et `habitude_entries` n'existent pas** sur le projet Supabase `kilio` réel, alors que :
- `scripts/migration-habitudes-2026-08-30.sql` existe dans le repo,
- `src/app/actions/habitudes.ts` et `src/app/(app)/habitudes/*` référencent ces tables,
- l'ancien `types.ts` (commit `HEAD` avant cette tâche) les décrivait comme existantes.

Autrement dit, le module Habitudes est actuellement non fonctionnel en production (toute requête sur `habitudes`/`habitude_entries` échouera). **Ceci est hors périmètre de cette tâche** (Budget) et n'a pas été corrigé : j'ai simplement réintégré les définitions `habitudes`/`habitude_entries` dans le `types.ts` régénéré (à l'identique de l'ancien fichier) pour ne pas faire régresser le typecheck de ce module au passage, sans toucher à la migration ni à la base. **À signaler à Vincent séparément** : la migration `migration-habitudes-2026-08-30.sql` semble n'avoir jamais été appliquée sur le projet Supabase `kilio`.

## Limite d'environnement — test fonctionnel navigateur

La politique réseau de cette session sandbox bloque tout accès sortant direct vers `vsmtkopkqasrdnjceegp.supabase.co` (`curl` direct et `next dev` renvoient `403`/« Host not in allowlist » — seul l'outil MCP Supabase peut atteindre le projet). Impossible donc de lancer l'app en navigateur et de cliquer dans les pages `/budget/*` pour un test bout-en-bout réel. Vérifications faites à la place :
- `npx tsc --noEmit`, `npm run lint`, `npm run build` : tous verts (cf. Phase 5 ci-dessous).
- Les requêtes Supabase des Server Actions suivent exactement le même pattern d'embedding PostgREST (`compte:comptes(id, nom)`, `categorie:categories_budget(...)`) que celui déjà en production dans `journal_repas` (`aliment:aliments(*)`, `recette:recettes(...)`), qui fonctionne.
- Schéma et contraintes (FK, `unique`, `check`) vérifiés directement en base via `mcp__Supabase__execute_sql`/`list_tables` après application de la migration.

**Ce point reste à vérifier par Vincent en conditions réelles** (ou par une session avec accès réseau complet) avant de considérer l'UI définitivement validée.

## Tables créées (migration appliquée sur `kilio`, `vsmtkopkqasrdnjceegp`)

`scripts/migration-budget-2026-08-30.sql`, appliquée via `mcp__Supabase__apply_migration`.

- `type_compte` (enum) : `courant` / `epargne` / `autre`
- `type_mouvement` (enum, partagé catégories + transactions) : `depense` / `revenu`
- **`comptes`** : `nom`, `type`, `solde_initial`, `created_at`, `updated_at`
- **`categories_budget`** : `nom`, `type`, `icone` (emoji, nullable), `is_predefinie`, `created_at`, `updated_at` — 11 catégories prédéfinies seedées (9 dépenses : Logement, Alimentation, Transport, Loisirs, Santé, Abonnements, Restaurants, Shopping, Autres dépenses ; 2 revenus : Salaire, Autres revenus)
- **`transactions`** : `compte_id` (FK → comptes, `on delete cascade`), `categorie_id` (FK → categories_budget), `montant` (`numeric(12,2)`, `check > 0`), `type`, `date_operation`, `libelle`, `created_at`, `updated_at`
- **`budgets`** : `categorie_id` (FK → categories_budget, `on delete cascade`), `montant_cible` (`check >= 0`), `periode` (date, `check` = premier jour du mois), `created_at`, `updated_at` — `unique(categorie_id, periode)`, upsert sur ce couple

Pas de RLS, pas de `user_id` (cf. Constats Phase 1). `updated_at` + trigger `set_updated_at()` (déjà défini par `migration-aliments-2026-08-27.sql`) ajoutés sur les 4 tables — au-delà du strict minimum listé dans le prompt — car les 4 sont modifiables depuis l'UI (comptes/transactions renommables ou éditables, budgets upsertés), cohérent avec le pattern des autres tables éditables du repo (`taches`, `objectifs`, `habitudes`).

`src/lib/supabase/types.ts` régénéré via `mcp__Supabase__generate_typescript_types` puis réintégration manuelle des types `habitudes`/`habitude_entries` (cf. section précédente).

## Server Actions créées

- **`src/app/actions/comptes.ts`** : `creerCompte`, `modifierCompte`, `supprimerCompte`, `getComptesAvecSolde` (solde = `solde_initial` + somme des transactions liées au compte, calculé à la volée — jamais stocké, cf. décision ci-dessous)
- **`src/app/actions/categories-budget.ts`** : `creerCategorie`, `modifierCategorie`, `supprimerCategorie` (refuse la suppression si `is_predefinie = true`), `getCategories`
- **`src/app/actions/transactions.ts`** : `creerTransaction`, `modifierTransaction`, `supprimerTransaction`, `getTransactions` (filtres optionnels `compteId`/`categorieId`/`mois`), `getResumeMois` (totaux dépenses/revenus d'une période)
- **`src/app/actions/budgets.ts`** : `upsertBudget` (upsert par `categorie_id, periode`), `supprimerBudget`, `getSuiviCategories` (agrégat demandé en Phase 3 : pour chaque catégorie de dépense de la période, somme des transactions vs `montant_cible`, avec `statut` ok/proche/dépassé)
- **`src/lib/budget/compute.ts`** (fonctions pures, sur le modèle de `src/lib/nutrition/compute.ts`) : `statutBudget`, `formatMontant`, `premierJourDuMois`, `finDuMois`, `formatPeriode`

## Pages créées

- `src/app/(app)/budget/page.tsx` — vue d'ensemble : solde total tous comptes confondus, résumé du mois (revenus/dépenses/solde), catégories en dépassement (badge + barre rouge/orange) avec liens vers les sous-pages
- `src/app/(app)/budget/comptes/page.tsx` — liste des comptes avec solde calculé, CRUD complet (ajout/édition/suppression inline, sur le pattern `taches`)
- `src/app/(app)/budget/transactions/page.tsx` — historique filtrable par compte/catégorie/mois (query params, filtres client via `useRouter`), CRUD complet (ajout rapide + édition/suppression inline)
- `src/app/(app)/budget/categories/page.tsx` — catégories de dépense avec barre de progression (vert `--accent-kcal` / orange `--accent-carbs` / rouge `--accent-alert` selon le seuil), édition inline du budget cible du mois ; catégories de revenu listées séparément ; ajout de catégorie perso, suppression réservée aux catégories non prédéfinies

`src/lib/modules.ts` : ajout de l'entrée `/budget` (label "Budget", icône portefeuille, `accentVar: var(--accent-budget)`). `src/app/globals.css` : nouvelle variable `--accent-budget: oklch(0.6 0.16 65)` (hue ambre/or, libre dans la palette existante, évocateur d'argent) + mapping `--color-budget` dans `@theme inline`.

`BottomNav.tsx` et les pages Accueil/Plus : **non modifiés**, ils consomment `MODULES` dynamiquement (confirmé comme pour Tâches).

## Décisions prises

- **Solde calculé dynamiquement** (`solde_initial` + somme des transactions), jamais stocké, conformément au prompt — aucun pattern de solde pré-calculé/stocké trouvé ailleurs dans le repo pour un cas similaire.
- **Pas de RLS/`user_id`** : suit le pattern réel du repo (mono-utilisateur depuis fin août), pas celui décrit dans le prompt générique — voir Constats Phase 1.
- **`type` de transaction dérivé serveur, jamais du formulaire** : `creerTransaction`/`modifierTransaction` relisent le `type` de la catégorie choisie en base plutôt que de faire confiance à un champ cliente, pour garantir l'invariant `transaction.type === categorie.type` sans dépendre du JS du formulaire.
- **Seuils du statut budget** : `ok` si consommé < 80 % de la cible, `proche` entre 80 % et 100 %, `dépassé` au-delà de 100 % — ou dès la première dépense si aucun budget cible n'est défini pour la catégorie (`cible <= 0`), pour éviter qu'une catégorie sans budget reste indéfiniment "verte".
- **Catégories** : un seul champ `icone` (emoji libre), pas de champ `couleur` séparé — reprend le pattern déjà en place sur `habitudes.icone` plutôt que d'introduire un nouveau concept.
- **UI au-delà du strict minimum** (le prompt priorisait la lecture, avec CRUD simple "si rapide à faire") : ajout/édition/suppression complets sur comptes et transactions, ajout de catégories personnalisées — repris à l'identique du pattern CRUD déjà standard dans le repo (Tâches, Objectifs) plutôt que de livrer une UI plus pauvre à ces endroits, coût marginal nul par réutilisation des composants `@/lib/ui`.

## Résultat des vérifications (Phase 5)

- `npm install` (node_modules absent au démarrage de la session).
- `npx tsc --noEmit` : **0 erreur** liée au module Budget (seule l'erreur pré-existante `LayoutProps` dans `src/app/layout.tsx` apparaît, sans rapport, disparaît après `next build` — comportement déjà documenté dans les rapports précédents).
- `npm run lint` (ESLint) : **0 erreur, 0 warning**.
- `npm run build` : **build complet réussi**, les 4 routes `/budget`, `/budget/comptes`, `/budget/transactions`, `/budget/categories` générées en dynamique (`ƒ`), comme les autres modules à données utilisateur.
- Test fonctionnel navigateur : **non réalisable dans cette session** (accès réseau direct au projet Supabase bloqué par la politique d'egress du sandbox) — cf. section dédiée ci-dessus.
- `git status` après build : diff limité aux fichiers du module Budget + `modules.ts`/`globals.css`/`types.ts` (`node_modules`/`.next` correctement ignorés).

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant le push.
