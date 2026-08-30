# Budget — transactions récurrentes — 2026-08-30

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : la session était déjà exactement synchronisée sur `origin/kilio` (`b6da1d9`, sous-catégories + virements), aucun rattrapage nécessaire.
- Relecture de `scripts/migration-budget-2026-08-30.sql`, `scripts/migration-budget-sous-categories-virements-2026-08-30.sql`, `src/app/actions/transactions.ts`/`comptes.ts`/`budgets.ts`, `src/lib/budget/compute.ts`, `TransactionModeForm.tsx`/`VirementForm.tsx`/`TransactionsList.tsx`/`TransactionForm.tsx` et `src/lib/supabase/types.ts` : grep `recurrent|recurrence|récurren` sans résultat, confirmant qu'aucune notion de récurrence n'existe déjà.
- Vérification en base (`mcp__Supabase__list_tables` sur `kilio`, `vsmtkopkqasrdnjceegp`) : `comptes` (2), `categories_budget` (12), `transactions` (117), `budgets` (0) — état identique au repo, y compris les colonnes ajoutées par la tâche précédente (`categorie_parent_id`, `compte_destination_id`, `categorie_id` nullable, enum `type_mouvement` à 3 valeurs). Toujours aucune trace de `habitudes`/`habitude_entries` en base malgré leur présence dans le repo — écart déjà documenté deux fois, non corrigé (hors périmètre), re-signalé ici pour mémoire.
- `date-fns@4.4.0` est déjà présent dans `package.json` (utilisé ailleurs dans le repo) : utilisé pour le calcul des prochaines occurrences plutôt que de réimplémenter l'arithmétique de calendrier à la main, cf. décision ci-dessous.

## Décisions prises

### Modèle de données

- Table `transactions_recurrentes` créée exactement comme spécifiée : `compte_id`/`categorie_id`/`compte_destination_id`/`montant`/`type`/`libelle`, `frequence` (nouvel enum `frequence_recurrence` : `quotidien`/`hebdomadaire`/`mensuel`/`annuel`), `date_debut`, `date_fin` nullable, `prochaine_occurrence`, `active` (défaut `true`), `created_at`/`updated_at` + trigger `set_updated_at()` réutilisé.
- **Contrainte de cohérence dépense/revenu vs virement reprise à l'identique** de celle de `transactions` (même `check`, dupliqué plutôt que factorisé — Postgres ne permet pas de partager un `check` constraint entre deux tables sans passer par une fonction, ce qui aurait ajouté de la complexité pour un gain minime ici).
- **`date_fin >= date_debut`** ajouté en `check` SQL (au-delà du strict minimum demandé), pour rejeter à la source une récurrence qui n'aurait jamais d'occurrence — également revalidé côté Server Action pour un message d'erreur plus clair que l'erreur Postgres brute.
- **Calage fin de mois/année** (documenté comme demandé plutôt que laissé implicite) : `calculerProchaineOccurrence` (nouvelle fonction pure dans `src/lib/budget/compute.ts`) délègue à `date-fns` (`addMonths`/`addYears`), qui cale automatiquement sur le dernier jour du mois cible quand le jour d'origine n'y existe pas. Vérifié explicitement : `31 janvier 2026 + 1 mois → 28 février 2026`, `29 février 2024 (bissextile) + 1 an → 28 février 2025`. Les composants année/mois/jour sont extraits et reconstruits en date **locale** (jamais via `toISOString`, qui convertit en UTC et peut décaler le résultat d'un jour selon le fuseau du serveur) : le calcul reste correct quel que soit le fuseau d'exécution.
- **`transaction_recurrente_id`** ajouté sur `transactions` avec `on delete set null`, exactement comme demandé : supprimer un modèle ne supprime jamais les transactions déjà générées, il les détache simplement (`supprimerRecurrente` ne fait qu'un `delete` sur `transactions_recurrentes`, le `on delete set null` fait le reste).
- **`date_debut`/`prochaine_occurrence` non éditables après création** : décision prise pour éviter de rejouer ou sauter des occurrences déjà générées si l'utilisateur modifiait la date de départ d'un modèle en cours de vie. `modifierRecurrence`/`modifierRecurrenceVirement` n'exposent donc que compte/catégorie/montant/fréquence/date de fin/libellé ; pour corriger une date de début erronée avant toute génération, il faut supprimer et recréer le modèle. Documenté dans l'UI (message sous le champ, dans `RecurrenceForm`/`RecurrenceVirementForm`).

### Génération paresseuse

- `genererOccurrencesDues()` (dans le nouveau `src/app/actions/transactions-recurrentes.ts`) sélectionne les modèles `active = true` avec `prochaine_occurrence <= aujourd'hui`, puis pour chacun **boucle** en insérant une transaction par occurrence en retard et en avançant `prochaine_occurrence` à chaque tour, jusqu'à dépasser aujourd'hui ou `date_fin` — le cas d'usage "3 mois sans ouvrir l'app" génère bien 3 (ou 4, cf. tests) transactions d'un coup, pas seulement la dernière.
- **Bug évité et corrigé avant tout test** : si `date_fin` a été raccourcie *après* que `prochaine_occurrence` l'ait déjà dépassée (édition d'un modèle existant), la boucle de génération ne produit aucune transaction — mais le modèle doit quand même être désactivé. La condition de mise à jour finale est `prochaine !== prochaine_occurrence initiale OU date_fin dépassée` (pas seulement "des occurrences ont été générées"), pour couvrir ce cas. Vérifié explicitement en base (cf. Phase 3).
- Appelée en tout début de `/budget/page.tsx` et `/budget/transactions/page.tsx` (avant `getResumeMois`/`getComptesAvecSolde`/`getTransactions`), pour que les occurrences dues apparaissent immédiatement dans les totaux et l'historique du chargement en cours — pas de cron dans ce repo, conformément à la contrainte.
- `getResumeMois`/`getSuiviCategories`/`getComptesAvecSolde` : **aucune modification**. Une occurrence générée est une ligne `transactions` ordinaire (avec juste `transaction_recurrente_id` renseigné) et suit exactement les règles déjà en place, virements récurrents inclus (une fois insérée, `getComptesAvecSolde` la traite comme n'importe quel virement).

### Réutilisation de l'UI existante — compromis assumé

Le prompt demandait de réutiliser `TransactionModeForm`/`VirementForm` "autant que possible ... plutôt que dupliquer toute la logique de sélection compte/catégorie". Plutôt que de refactoriser en profondeur ces deux composants déjà en production sur `/budget/transactions` (risque de régression sur un flux critique et déjà testé), j'ai créé des composants **structurellement parallèles** (`RecurrenceForm`, `RecurrenceVirementForm`, `RecurrenceModeForm`) qui :
- réutilisent **la même fonction pure** `regrouperParCategorieParente` et le même rendu `<optgroup>` groupé par catégorie parente que `TransactionForm` (c'est la "logique de sélection" au sens propre, pas juste le JSX) ;
- réutilisent les mêmes classes `@/lib/ui` et le même pattern d'onglets Dépense/Revenu/Virement que `TransactionModeForm` ;
- remplacent le champ unique `date_operation` par `frequence`/`date_debut`/`date_fin`.

Compromis assumé et documenté ici plutôt qu'imposé silencieusement : `TransactionForm`/`VirementForm` restent intouchés (zéro risque de régression sur les pages existantes), au prix d'une duplication du JSX de sélection compte/catégorie entre les deux familles de formulaires. Si Vincent préfère une fusion complète (un seul `TransactionForm` générique prenant l'action et les champs de date en props), c'est un refactor de suivi possible mais plus risqué, non fait ici par défaut.

## Ce qui a été créé/modifié

**Migration** : `scripts/migration-budget-transactions-recurrentes-2026-08-30.sql` (appliquée via `mcp__Supabase__apply_migration`, nom `budget_transactions_recurrentes`).

**Server Actions** : nouveau `src/app/actions/transactions-recurrentes.ts` — `creerRecurrence`/`modifierRecurrence` (dépense/revenu), `creerRecurrenceVirement`/`modifierRecurrenceVirement`, `supprimerRecurrence`, `basculerActive(id, active)`, `getRecurrences`, `genererOccurrencesDues`.

**Fonctions pures** (`src/lib/budget/compute.ts`) : `aujourdhuiISO`, `calculerProchaineOccurrence`, `FREQUENCE_LABELS`. `todayISO()` (dupliquée dans `TransactionForm.tsx`/`VirementForm.tsx`) remplacée par `aujourdhuiISO()` au passage, pour une seule définition partagée par les 4 formulaires (transactions + récurrentes).

**Types** : `src/lib/supabase/types.ts` régénéré (enum `frequence_recurrence`, table `transactions_recurrentes`, `transactions.transaction_recurrente_id`), avec réintégration manuelle de `habitudes`/`habitude_entries`/`habitude_type` (toujours absentes de la base réelle, cf. Constats).

**UI** :
- `src/app/(app)/budget/recurrentes/` (nouveau dossier) : `page.tsx`, `RecurrenceModeForm.tsx` (onglets), `RecurrenceForm.tsx` (dépense/revenu), `RecurrenceVirementForm.tsx`, `AddRecurrenceToggle.tsx`, `RecurrencesList.tsx` (liste avec badge "En pause", pause/reprise, édition, suppression, prochaine échéance formatée).
- `src/app/(app)/budget/page.tsx` : appel de `genererOccurrencesDues()` en tête + lien "🔁 Transactions récurrentes →".
- `src/app/(app)/budget/transactions/page.tsx` : appel de `genererOccurrencesDues()` en tête + lien "🔁 Récurrentes →".
- `src/app/(app)/budget/transactions/TransactionsList.tsx` : badge "🔁 récurrent" sur les transactions dont `transaction_recurrente_id` n'est pas nul.

## Résultat des vérifications (Phase 3)

- `npx tsc --noEmit` : **0 erreur**.
- `npm run lint` : **0 erreur, 0 warning**.
- `npm run build` : **build complet réussi**, `/budget/recurrentes` généré en dynamique (`ƒ`) aux côtés des 4 routes existantes.
- Vérification en base (`mcp__Supabase__list_tables`/`list_migrations`) : migration `budget_transactions_recurrentes` bien enregistrée, table `transactions_recurrentes` et colonne `transactions.transaction_recurrente_id` conformes au schéma attendu.
- **Test de la génération paresseuse** (créé puis nettoyé en base, cf. détails ci-dessous) :
  1. Modèle créé : dépense mensuelle de 50€ sur "Logement", `date_debut = 2026-05-30`, `prochaine_occurrence = 2026-05-30` (aujourd'hui = 2026-08-30).
  2. Calcul de référence via un script Node utilisant `date-fns` (même bibliothèque, même fonction que `calculerProchaineOccurrence`) : 4 occurrences attendues (30/05, 30/06, 30/07, 30/08), `prochaine_occurrence` finale attendue = 2026-09-30.
  3. Exécution de la logique de génération (reproduite fidèlement en SQL, faute d'accès réseau direct depuis ce sandbox pour appeler la Server Action TypeScript elle-même — cf. limite ci-dessous) : **4 transactions générées avec exactement les dates attendues**, `prochaine_occurrence` avancée à **2026-09-30**, `active` resté `true` (pas de `date_fin`).
  4. Cas limite testé séparément : `date_fin` positionnée avant `prochaine_occurrence` courante (simulant une édition qui raccourcit une récurrence déjà avancée) → **aucune transaction générée, `active` correctement basculée à `false`** — confirme le correctif du bug identifié à la conception (cf. Décisions).
  5. Contrainte `transactions_recurrentes_virement_coherence` testée : un virement récurrent sans `compte_destination_id` est **rejeté**.
  6. Toutes les données de test supprimées ensuite ; compteurs finaux identiques aux compteurs de départ (117 transactions, 0 `transactions_recurrentes`, 12 catégories, 2 comptes).

## Limite d'environnement — test fonctionnel navigateur et exécution directe de la Server Action

Comme dans les rapports précédents, cette session sandbox n'a pas d'accès réseau direct à `vsmtkopkqasrdnjceegp.supabase.co` (`curl` : timeout/`000`) — seul l'outil MCP Supabase peut atteindre le projet. Deux conséquences :
- Impossible de lancer `next dev` et de tester dans un navigateur l'onglet Virement récurrent, l'imbrication des sous-catégories dans le sélecteur, le badge "récurrent" dans l'historique, ou les boutons pause/reprise.
- Impossible d'appeler littéralement `genererOccurrencesDues()` (la fonction TypeScript) depuis ce sandbox : le test de la Phase 3 reproduit fidèlement son algorithme en SQL (même requêtes, même structure de boucle, mêmes conditions) plutôt que d'exécuter le fichier `.ts` lui-même. La logique de calendrier (`calculerProchaineOccurrence`, avec le calage fin de mois de `date-fns`) a en revanche été vérifiée séparément avec un script Node exécutant la vraie bibliothèque installée (`date-fns@4.4.0`), donc avec la même sémantique que le code réellement livré.

**Ce point reste à vérifier par Vincent en conditions réelles** (ou par une session avec accès réseau complet) avant de considérer l'UI et la génération automatique définitivement validées bout en bout.

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant le push.
