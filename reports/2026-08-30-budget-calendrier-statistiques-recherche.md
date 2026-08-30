# Budget — calendrier, statistiques graphiques, recherche — 2026-08-30

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : session déjà synchronisée sur `origin/kilio` (`5615095`, budgets hebdo/annuel), aucun rattrapage nécessaire.
- Relecture de `src/app/actions/transactions.ts`, `budgets.ts`, `comptes.ts`, `src/lib/budget/compute.ts` en entier, `ObjectifSuiviValeur.tsx`/`EvolutionChart`, les pages `/budget/*` et `src/lib/ui.ts`.
- `grep -ri "recharts|chart.js|chartjs|d3" package.json` : **aucun résultat** — confirmé qu'aucune dépendance de graphiques n'existe, aucune ajoutée dans cette tâche.
- Vérification en base (`mcp__Supabase__list_tables` sur `kilio`, `vsmtkopkqasrdnjceegp`) : 117 transactions, 12 catégories, 2 comptes, 0 budget, 0 récurrence — état inchangé depuis le rapport précédent. **Aucune migration nécessaire pour cette tâche** : calendrier/statistiques/recherche ne sont que de nouvelles lectures (Server Actions) et pages, aucune colonne ni table nouvelle.
- `src/app/globals.css` inspecté pour confirmer les noms exacts des variables CSS utilisables telles quelles en SVG (`var(--accent-alert)`, `var(--accent-kcal)`, `var(--ink-2)`, `var(--line)`), au-delà des classes Tailwind (`text-alert`, `bg-kcal`, etc.) qui les enveloppent.

## Décisions prises

### Pattern des graphiques — interprétation de la contrainte "suivre `EvolutionChart`"

`EvolutionChart` est une courbe SVG à la main (`<polyline>` + `var(--accent-*)`). Le module Budget contient déjà, de son côté, un motif différent mais tout aussi établi pour les **barres de proportion simples** : des `<div>` CSS à largeur en `%` (`CategorieProgressCard`, la liste "Catégories en dépassement" de `/budget`). Décision : réserver le SVG à la main aux données réellement multi-séries/continues (la tendance dépenses/revenus dans le temps), et garder les barres CSS déjà en place pour les répartitions proportionnelles simples (catégories, comptes) — cohérent avec le code existant du module, sans réinventer en SVG ce qui est déjà élégamment résolu en CSS ailleurs dans ce même module. Documenté explicitement dans les composants concernés (`RepartitionCategories.tsx`, `RepartitionComptes.tsx`) pour que ce choix d'interprétation soit visible et discutable.

### Vue calendrier (`/budget/calendrier`)

- Nouvelle fonction pure `grilleCalendrierMois(periode)` (`compute.ts`) : semaines complètes (lundi en premier), avec jours de padding hors mois (`horsMois: true`, grisés en CSS). Vérifiée en Node avant intégration : août 2026 (1er août = samedi) donne bien 6 semaines de 7 jours, premières colonnes `27 28 29 30 31 01 02` (lundi 27 juillet → dimanche 2 août).
- `getTransactionsParJour(periode)` (nouvelle fonction, `transactions.ts`) : **une seule requête** sur le mois entier (`type in ('depense','revenu')`, virements exclus — cohérent avec `getResumeMois`), agrégée en JS par `date_operation`. Testée en base avec des transactions de test sur plusieurs jours du même mois (cf. Phase 3) : les totaux par jour correspondent exactement aux sommes attendues.
- **Clic sur un jour → lien vers `/budget/transactions?date=YYYY-MM-DD`**, option retenue plutôt qu'un panneau inline sous le calendrier. Justification : `getTransactions`/`TransactionsFilters`/`TransactionsList` gèrent déjà tout l'affichage, l'édition et la suppression d'une liste de transactions filtrée — dupliquer cet affichage dans un panneau inline aurait signifié soit réutiliser ces mêmes composants (revenant au même résultat avec plus de code), soit construire une seconde liste plus pauvre (pas d'édition/suppression). Le lien réutilise directement l'existant, avec un seul filtre `date` ajouté à `getTransactions`. Un bandeau "Transactions du [date] · Effacer ✕" a été ajouté sur `/budget/transactions` pour rendre ce filtre visible et réversible (l'effacement préserve les autres filtres éventuellement actifs — compte/catégorie/mois/recherche — et ne retire que `date`).
- Navigation mois précédent/suivant : liens simples (`periodeAdjacente`/`?periode=...`), pas de nouveau composant client — la page reste un Server Component pur, cohérent avec la simplicité déjà en place pour ce genre de navigation.

### Statistiques graphiques (`/budget/statistiques`)

- **Répartition par catégorie** : réutilise directement `getSuiviCategories(periode)`, qui agrège déjà les sous-catégories dans le total de leur catégorie principale — aucune nouvelle fonction nécessaire pour cette partie, juste un nouveau composant d'affichage (`RepartitionCategories.tsx`, barres CSS proportionnelles + pourcentage du total du mois).
- **Tendance** : nouvelle fonction `getResumeMoisPlage(periodeFin, nbMois)` — **une seule requête large** sur toute la plage de mois (`gte`/`lt` sur les bornes extrêmes), agrégée en JS par mois via une `Map` pré-remplie (pour que les mois sans transaction apparaissent à 0, pas absents du graphique). **6 mois choisis plutôt que 12** : le graphique est un SVG de largeur fixe 320 (même largeur que `EvolutionChart`, pensée pour l'écran mobile visé par ce module) — 12 barres groupées dépenses+revenus y seraient illisibles. Rendu en `TendanceChart.tsx`, un vrai graphique SVG à la main (barres groupées rouge/vert par mois + étiquette de mois), seul composant de cette tâche qui suit littéralement le motif `EvolutionChart`.
- **Répartition par compte** : réutilise `getComptesAvecSolde()` tel quel — **décision documentée** : affiche le **solde actuel** par compte (barres proportionnelles à `|solde|`), pas l'activité dépenses/revenus de la période. `getComptesAvecSolde` renvoie un solde cumulé depuis l'origine (`solde_initial` + tous les mouvements), pas une métrique bornée dans le temps ; le prompt proposait explicitement "solde OU activité" et demandait de réutiliser cette fonction précise — l'activité par compte et par période aurait nécessité une nouvelle agrégation non listée dans les fonctions à créer. Un compte au solde négatif est distingué en rouge (`--accent-alert`).
- Navigation mois précédent/suivant identique au calendrier (même `periodeAdjacente`), la répartition par catégorie et la fin de la plage de tendance suivant toutes les deux le mois affiché.

### Recherche

- `getTransactions` étendu avec `recherche?: string` : `ilike` sur `libelle`. Vérifié en base (cf. Phase 3) qu'`ilike` sur une colonne `NULL` ne matche jamais en SQL — une transaction sans libellé est donc naturellement, silencieusement exclue d'une recherche non vide, sans code de garde supplémentaire nécessaire. Recherche insensible à la casse vérifiée explicitement (`RECHERCHE unique` matche `Test Recherche Unique XYZ`).
- Champ de recherche ajouté **dans `TransactionsFilters.tsx`** (pas un nouveau composant séparé) : réutilise exactement le même `updateParam`/`useSearchParams`/`useRouter` déjà en place pour compte/catégorie/mois, paramètre d'URL `?q=...`. Pas de debounce ajouté (chaque frappe déclenche une navigation, comme le fait déjà le sélecteur de mois) — cohérent avec le pattern existant, non demandé explicitement ; à surveiller en usage réel si la frappe s'avère saccadée (volume actuel de 117 transactions, requête large donc rapide).

### Navigation (`/budget/page.tsx`)

- Décision : **liste simple de liens** dans une nouvelle carte "Autres vues" (récurrentes/calendrier/statistiques), plutôt qu'un sous-menu dédié. Avec 6 sous-pages au total, les 3 principales (comptes, transactions, catégories) restent mises en avant contextuellement comme avant (liens dans les cartes solde/résumé/dépassements) ; les 3 vues plus secondaires sont regroupées visuellement sans complexifier la page d'accueil avec un nouveau composant de navigation.

## Ce qui a été créé/modifié

**Aucune migration** (pas de changement de schéma pour cette tâche).

**Server Actions** (`src/app/actions/transactions.ts`) :
- `getTransactions` : + filtres `date` (égalité exacte) et `recherche` (`ilike` sur `libelle`).
- `getTransactionsParJour(periode)` (nouveau) : totaux dépenses/revenus par jour sur un mois, une seule requête.
- `getResumeMoisPlage(periodeFin, nbMois)` (nouveau) : résumé dépenses/revenus par mois sur une plage de `nbMois` mois, une seule requête large agrégée en JS.

**Fonctions pures** (`src/lib/budget/compute.ts`) : `grilleCalendrierMois(periode)`.

**Pages** :
- `src/app/(app)/budget/calendrier/page.tsx` (nouveau) : grille mensuelle, navigation prev/suivant, lien par jour vers `/budget/transactions?date=...`.
- `src/app/(app)/budget/statistiques/page.tsx` (nouveau) + `RepartitionCategories.tsx`, `RepartitionComptes.tsx`, `TendanceChart.tsx` (nouveaux composants).
- `src/app/(app)/budget/transactions/page.tsx` : filtres `date`/`recherche` branchés sur `getTransactions`, bandeau "Transactions du [date] · Effacer", lien vers `/budget/calendrier`.
- `src/app/(app)/budget/transactions/TransactionsFilters.tsx` : champ de recherche texte (`?q=`).
- `src/app/(app)/budget/page.tsx` : carte "Autres vues" avec liens vers récurrentes/calendrier/statistiques.

## Résultat des vérifications (Phase 3)

- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **0 erreur, 0 warning**.
- `npm run build` : **build complet réussi** — `/budget/calendrier` et `/budget/statistiques` apparaissent bien en dynamique (`ƒ`), aux côtés des 4 routes `/budget/*` existantes.
- **Tests en base** (créés puis nettoyés) :
  1. 6 transactions de test insérées : 3 le même jour (2026-08-05 : 2 dépenses 20€/30€, 1 revenu 100€), 1 avec un libellé distinctif (`"Test Recherche Unique XYZ"`, 2026-08-10), 1 sans libellé (2026-08-11), 1 sur un mois différent (2026-06-15, 40€).
  2. Agrégation par jour (requête SQL reproduisant `getTransactionsParJour`) : **50€ dépenses / 100€ revenus le 05/08** (20+30), **15€ le 10/08**, **5€ le 11/08** — conforme.
  3. Recherche `ilike '%RECHERCHE unique%'` (casse différente) : matche bien `"Test Recherche Unique XYZ"` ; `ilike` sur les lignes à `libelle is null` : **0 résultat**, confirmant l'exclusion silencieuse attendue.
  4. Agrégation multi-mois (requête SQL reproduisant `getResumeMoisPlage`, plage mars→août 2026) : juin = 40€ dépenses (donnée de test), août = 70€ dépenses / 100€ revenus (50+15+5 = 70), juillet = données de production préexistantes (non affectées) — la logique de bucket par mois (vérifiée séparément via un script Node reproduisant exactement le calcul JS) produit les mêmes 6 clés de mois (mars à août inclus) que la plage SQL.
  5. Toutes les transactions de test supprimées ensuite ; compteur final = 117, identique au compteur de départ.

## Limite d'environnement — test fonctionnel navigateur

Comme dans tous les rapports précédents du module, cette session sandbox n'a pas d'accès réseau direct à `vsmtkopkqasrdnjceegp.supabase.co` (`curl` : timeout/`000`) — seul l'outil MCP Supabase peut atteindre le projet. Impossible donc de lancer `next dev` et de vérifier visuellement : le rendu de la grille calendrier (alignement, lisibilité des totaux compacts dans des cellules étroites), le rendu des graphiques SVG (proportions, lisibilité des étiquettes de mois sur `TendanceChart`), ou le ressenti de la recherche en temps réel (navigation à chaque frappe). **Ce point reste à vérifier par Vincent en conditions réelles** avant de considérer cette dernière étape définitivement validée visuellement.

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant le push.

---

## Récapitulatif global — feuille de route Money Manager (4 phases)

Cette tâche clôt la série de rapprochement du module Budget avec Money Manager (Realbyte), menée en 4 étapes sur `kilio` :

1. **Sous-catégories + virements entre comptes** (`reports/2026-08-30-budget-sous-categories-virements.md`) — un niveau de sous-catégorie (type hérité du parent, validé en Server Action), virements entre comptes (nouvelle valeur d'enum `virement`, `compte_destination_id`, `categorie_id` nullable, contrainte de cohérence en base).
2. **Transactions récurrentes** (`reports/2026-08-30-budget-transactions-recurrentes.md`) — table `transactions_recurrentes` (modèle dépense/revenu/virement + fréquence + dates), génération paresseuse des occurrences dues (rattrapage multi-occurrences, calage fin de mois/année via `date-fns`), badge "récurrent" dans l'historique.
3. **Budgets hebdomadaires/annuels** (`reports/2026-08-30-budget-periodes-hebdo-annuel.md`) — `type_periode_budget` (semaine ISO/mois/année), clé unique élargie permettant 3 budgets simultanés par catégorie, onglets + navigation prev/suivant sur `/budget/categories`.
4. **Calendrier, statistiques, recherche** (ce rapport) — vue calendrier mensuelle avec totaux compacts par jour, statistiques graphiques (répartition catégories/comptes, tendance 6 mois), recherche texte sur les libellés.

**Constantes tenues sur les 4 phases** : aucune RLS/`user_id` ajoutée (pattern mono-utilisateur du repo, assumé et reconfirmé à chaque étape) ; aucune dépendance npm nouvelle pour les migrations de dates (`date-fns`, déjà présent) ni pour les graphiques (SVG à la main) ; chaque migration de schéma vérifiée avant/après en base réelle via l'outil MCP Supabase, avec des tests d'insertion/contrainte créés puis nettoyés à chaque fois ; chaque nouvelle fonction `getX` par défaut rétrocompatible avec les appelants existants (aucune régression constatée sur les pages déjà en place à aucune étape) ; limite d'accès réseau direct au projet Supabase depuis ce sandbox documentée et contournée par des tests SQL directs à chaque rapport, avec le test fonctionnel navigateur systématiquement signalé comme restant à faire par Vincent en conditions réelles.

**Écart connu, non corrigé, distinct de cette feuille de route** : les tables `habitudes`/`habitude_entries` restent absentes de la base Supabase réelle malgré leur présence dans le repo (signalé pour la première fois dans `reports/2026-08-30-module-budget.md`, reconfirmé à chaque vérification `list_tables` depuis) — hors périmètre du module Budget, non traité par cette série de tâches.

Le module Budget couvre désormais : comptes multiples avec soldes calculés, catégories + sous-catégories (dépense/revenu), transactions et virements entre comptes, transactions récurrentes, budgets cibles hebdo/mensuel/annuel avec suivi de dépassement, vue calendrier, statistiques graphiques et recherche — fonctionnellement aligné avec les fonctionnalités cœur de Money Manager demandées dans cette série de prompts.
