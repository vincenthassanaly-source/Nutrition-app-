# Barre de recherche globale sur l'accueil — 2026-08-31

## Résumé

Ajout d'une barre de recherche transversale en haut de l'accueil (`src/app/(app)/page.tsx`), interrogeant en temps réel (dès 2 caractères, debounce ~300ms) les modules Notes, Tâches, Recettes, Objectifs, Courses et Budget (transactions). Les résultats s'affichent dans un dropdown groupé par module sous la barre, cliquables vers la fiche ou le module concerné.

## Constats de la Phase 1

- Branche `kilio` resynchronisée (`git fetch origin kilio && git reset --hard origin/kilio`, HEAD à `a48c156`) avant toute lecture — la branche de travail était ~30 commits en retard.
- Schéma Supabase (projet `vsmtkopkqasrdnjceegp`) vérifié via `information_schema.columns` sur `notes`, `taches`, `listes_taches`, `recettes`, `objectifs`, `courses_items`, `transactions`, `comptes`, `categories_budget` : correspondance exacte avec `src/lib/supabase/types.ts`, aucun décalage repo/DB.
- `notes` et `taches` n'ont pas de vue détail dédiée (pas de route `[id]`) : les résultats de ces deux modules pointent vers la page de liste (`/notes`, `/taches`), conformément à la piste de repli prévue par le prompt.
- `recettes` et `objectifs` ont bien des vues détail (`/nutrition/recettes/[id]`, `/objectifs/[id]`) : les résultats y pointent directement.
- `courses_items` n'a pas de vue détail : résultat vers `/courses`.
- `transactions` n'a pas de vue détail : résultat vers `/budget/transactions?q=<libellé>`, réutilisant le paramètre `q` déjà géré par `TransactionsFilters.tsx`.
- `transactions` a deux clés étrangères vers `comptes` (`compte_id` et `compte_destination_id`) : l'embed PostgREST `comptes(nom)` est ambigu sans hint, résolu avec `comptes!transactions_compte_id_fkey(nom)`.
- Aucune couleur d'accent n'existe pour le module Tâches dans `src/lib/modules.ts` (il vit dans la bottom nav, pas dans la grille "Plus") : réutilisation de `--accent-agenda`, déjà utilisée pour le module Agenda qui affiche les mêmes tâches à échéance — choix cohérent thématiquement plutôt qu'une nouvelle variable CSS.

## Fichiers créés / modifiés

- `src/app/actions/recherche.ts` (créé) : server action `rechercheGlobale(query)`.
  - Retourne `[]` immédiatement si `query.trim().length < 2` (pas de requête DB).
  - Lance les 6 requêtes en parallèle via `Promise.allSettled` (même pattern défensif que le dashboard existant : une source en erreur ne fait pas échouer les autres), chacune `limit(5)` avec select minimal (uniquement id + colonnes affichées).
  - Échappe les caractères spéciaux `ilike` (`%`, `_`, `,`) dans le terme recherché avant de construire le motif.
  - Mappe chaque résultat vers le type commun `ResultatRecherche { id, module, titre, sousTitre?, href }`.
  - Trie le tableau plat : correspondances commençant par la query en premier, puis ordre de retour (tri stable) — groupable côté client par `module`.
- `src/app/(app)/GlobalSearchBar.tsx` (créé, `"use client"`) :
  - Input avec icône loupe, style `input` de `@/lib/ui` (même pattern que `TransactionsFilters.tsx`), placeholder "Rechercher dans Kilio…".
  - Debounce 300ms via `useEffect`/`setTimeout` (le `setState` de nettoyage/résultat est appelé dans le callback du timer, pas synchroniquement dans le corps de l'effet, pour rester conforme à la règle ESLint `react-hooks/set-state-in-effect`).
  - Appel de la server action encapsulé dans `useTransition` ; indicateur de chargement discret (spinner en `border` dans l'input) piloté par `isPending`.
  - Dropdown `absolute`/`z-50` sous la barre, ouvert dès que la query ≥ 2 caractères ET l'input a le focus (ou reste ouvert tant qu'on n'a pas cliqué ailleurs), groupé par module avec en-tête coloré (`MODULE_INFO`), chaque ligne un `Link` qui ferme le dropdown et vide la query au clic.
  - État vide « Aucun résultat. » distinct de l'état « Recherche… » pendant que la première réponse n'est pas encore arrivée.
  - Fermeture au clic extérieur (`mousedown` + `ref`) et à `Échap`.
  - Accessibilité minimale : `role="combobox"`/`aria-expanded`/`aria-controls` sur l'input, `role="listbox"` sur le dropdown, `role="option"` sur chaque résultat.
- `src/app/(app)/page.tsx` (modifié) : import et insertion de `<GlobalSearchBar />` juste après le `<header>`, avant la carte Nutrition — aucune modification de la logique serveur existante.

## Tables interrogées et colonnes indexées par `ilike`

| Module | Table | Colonnes `ilike` | Jointure affichée |
|---|---|---|---|
| Notes | `notes` | `titre` OU `contenu` | — |
| Tâches | `taches` | `titre` | `listes_taches(nom)` |
| Recettes | `recettes` | `nom` | — |
| Objectifs | `objectifs` | `titre` | — |
| Courses | `courses_items` | `libelle` | — |
| Budget | `transactions` | `libelle` (exclut `libelle is null`) | `comptes(nom)` via `compte_id` |

## Routes de destination par module

- Notes → `/notes`
- Tâches → `/taches`
- Recettes → `/nutrition/recettes/[id]`
- Objectifs → `/objectifs/[id]`
- Courses → `/courses`
- Budget → `/budget/transactions?q=<libellé de la transaction>`

## Comportement (résumé conceptuel)

- Sous 2 caractères : aucune requête, dropdown fermé.
- À partir de 2 caractères : 300ms sans frappe → requête serveur → dropdown ouvert, groupé par module (Notes, Tâches, Recettes, Objectifs, Courses, Budget dans cet ordre), chaque groupe avec sa couleur d'accent.
- Clic sur un résultat → navigation + fermeture du dropdown + reset de la query.
- Clic en dehors de la barre ou touche Échap → fermeture du dropdown (la query tapée reste dans l'input).

## Phase 3 — Vérification

- `npx tsc --noEmit` : aucune erreur sur les fichiers créés/modifiés (une erreur préexistante et sans rapport, `src/app/layout.tsx` — `Cannot find name 'LayoutProps'` —, confirmée présente aussi hors de ce diff via `git stash`).
- `npm run lint` (ESLint) : aucune erreur (un problème `react-hooks/set-state-in-effect` détecté et corrigé en déplaçant les `setState` de nettoyage dans le callback du `setTimeout`).
- `npm run build` : build de production réussi (Next.js 16.3.3 / Turbopack), toutes les routes compilent, `/` reste dynamique (`ƒ`) comme avant.
- `node_modules` absent au démarrage de la session : `npm install` exécuté avant les vérifications.
- Pas de vérification visuelle en navigateur dans cette session (pas de test Playwright effectué) : le comportement décrit ci-dessus est déduit de la relecture du code, pas observé à l'écran.

## Limitations connues

- Pas de pagination des résultats : chaque source est limitée à 5 lignes (`LIMIT_PAR_SOURCE`), sans "voir plus".
- `ilike` n'est ni insensible aux accents ni tolérant aux fautes de frappe (recherche de "recette" ne trouvera pas "récette" si la casse d'accentuation diffère selon la locale de collation). Piste d'amélioration future : activer les extensions Postgres `pg_trgm` (recherche floue/similarité) et/ou `unaccent` (normalisation des accents), avec un index trigram sur les colonnes recherchées pour garder de bonnes performances à mesure que le volume de données grandit.
- Le résultat Budget renvoie vers la liste des transactions filtrée par libellé (`?q=`), pas vers une fiche transaction dédiée — il n'en existe pas dans l'app actuellement.

## Points en question

Aucun écart repo/DB constaté en Phase 1 — aucun point n'est resté en suspens.

## Prochaine étape

Poussée non effectuée — en attente de confirmation de Vincent avant `git push` sur `kilio`.
