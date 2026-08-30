# Refonte du module Tâches façon TickTick — 2026-08-30

## Constats de la Phase 1

- État réel de `taches` en base (vérifié via `mcp__Supabase__list_tables`/`execute_sql` avant d'écrire la migration) : `id, titre, echeance, fait, created_at, updated_at, heure` — conforme à `scripts/migration-taches-2026-08-30.sql` + `migration-taches-heure-2026-08-30.sql`, rien d'autre.
- **`frequence_recurrence`** existe déjà (`quotidien | hebdomadaire | mensuel | annuel`), utilisé par `transactions_recurrentes` — réutilisé tel quel pour `taches.recurrence_frequence`, aucun nouvel enum de fréquence créé.
- **`set_updated_at()`** existe déjà en base — réutilisée pour les nouveaux triggers (`listes_taches`), sans redéfinition.
- **`calculerProchaineOccurrence(dateISO, frequence)`** (`src/lib/budget/compute.ts`) est une fonction de calendrier générique (extraction Y/M/A locale, `date-fns`, reconstruction locale) sans dépendance métier au module Budget — réutilisée telle quelle dans `toggleTache` au lieu de dupliquer la logique de récurrence.
- **Anomalie découverte, hors périmètre de cette tâche** : `src/lib/supabase/types.ts` (avant modification) déclarait `habitude_type` et les tables `habitudes`/`habitude_entries`, mais ces tables **n'existent pas** sur le projet Supabase `kilio` (confirmé via `information_schema.tables`) — la migration `migration-habitudes-2026-08-30.sql` a dû être écrite sans jamais être appliquée. Pour ne pas casser le module Habitudes, `types.ts` n'a pas été régénéré intégralement : les nouvelles tables/colonnes Tâches ont été insérées à la main dans le fichier existant, en laissant `habitudes`/`habitude_type` inchangés. **À signaler à Vincent** — le module Habitudes est probablement cassé en prod tant que cette migration n'est pas appliquée.
- **Pas de drag-and-drop dans le codebase** (recherche confirmée : aucune trace de `dnd-kit`, `react-beautiful-dnd`, etc., ni dans le code ni dans `package.json`/`package-lock.json`). Le seul précédent de réordonnancement (`objectif_etapes` via `deplacerEtape`, `src/app/actions/objectifs.ts`) utilise un échange simple avec la ligne voisine (boutons ↑/↓ sur la colonne `ordre`), pas de librairie. **Décision** : même pattern pour `taches`, `sous_taches` et `listes_taches`, plutôt que d'introduire `@dnd-kit/sortable` (non testable ici — accès réseau restreint, cf. Vérifications).
- Pattern CRUD "page dédiée" repris de `src/app/(app)/budget/categories/` (page serveur + `AddXToggle` + `AddXForm` avec `useActionState` + `XList` avec suppression via `useTransition`).

## Fichiers créés / modifiés

### Migration SQL

- `scripts/migration-taches-ticktick-2026-08-30.sql` (créé, **appliqué** sur le projet Supabase `kilio` via `mcp__Supabase__apply_migration`)
- `scripts/migration-taches-ticktick-2026-08-30-revert.sql` (créé)

Contenu : nouvel enum `priorite_tache`, tables `listes_taches`, `tags`, `taches_tags` (jonction), `sous_taches`, et sur `taches` : `liste_id` (uuid, `not null` après backfill vers la liste `Général`), `notes`, `priorite`, `ordre`, `recurrence_frequence`, `recurrence_fin`. Le tout dans un seul appel `apply_migration` (une seule transaction) : `priorite_tache` est un `CREATE TYPE` neuf, pas un `ALTER TYPE ... ADD VALUE`, donc utilisable immédiatement dans la même transaction ; `frequence_recurrence` est réutilisé sans y toucher.

### Types

- `src/lib/supabase/types.ts` : édité à la main (pas de régénération complète, cf. anomalie Habitudes ci-dessus) — ajout de `listes_taches`, `sous_taches`, `taches_tags`, `tags`, mise à jour de `taches`, ajout de l'enum `priorite_tache`.

### Server actions (`src/app/actions/taches.ts`, réécrit)

- `parseTacheInput` étendu : `liste_id`, `notes`, `priorite`, `recurrence_frequence`, `recurrence_fin`.
- `createTache` / `updateTache` : gèrent en plus les tags (`tag_ids` existants + `nouveaux_tags` créés à la volée via `upsert(... , { onConflict: "nom" })`, puis synchronisation complète de `taches_tags`).
- `toggleTache` : logique de récurrence Option A (voir Décisions).
- `reordonnerTaches(id, direction)` : échange d'`ordre` avec la tâche voisine, **au sein de la même liste**.
- `getTachesAvecRelations()` : une seule requête avec embeds PostgREST (`liste`, `sous_taches`, `taches_tags(tag:tags(...))`), tri `fait, ordre, echeance (nulls last), created_at`.
- Listes : `createListe`, `updateListe`, `deleteListe`, `reordonnerListes`, `getListes`.
- Tags : `createTag`, `deleteTag`, `associerTag`, `dissocierTag`, `getTags`.
- Sous-tâches : `createSousTache`, `toggleSousTache`, `updateSousTache`, `deleteSousTache`, `reordonnerSousTaches`.
- `revalidatePath("/taches")` + `revalidatePath("/agenda")` conservés partout où c'était déjà fait.

### UI Tâches (`src/app/(app)/taches/`)

- `page.tsx` (réécrit) : fetch serveur (`getTachesAvecRelations`, `getListes`, `getTags`), délègue tout le reste à `TachesView`.
- `TachesView.tsx` (créé) : onglets *Aujourd'hui / 7 prochains jours / Toutes* + sélecteur de liste (pills horizontales scrollables) + lien vers `/taches/listes`, filtrage **client-side** sur les données déjà chargées — même pattern que `AgendaView.tsx` (fetch tout côté serveur, filtre par état côté client).
- `AddTaskForm.tsx` (réécrit) : liste (`<select>`), priorité (segmented control 4 boutons, couleurs réutilisées — voir Décisions), notes (`<textarea>`), tags (chips togglables + champ "nouveaux tags" séparés par virgule), récurrence (`<select>` réutilisant `FREQUENCE_LABELS` de `@/lib/budget/compute` + date de fin conditionnelle).
- `AddTaskToggle.tsx` (réécrit) : transmet `listes`/`tags`/`defaultListeId`.
- `TasksList.tsx` (réécrit) : badge liste (couleur si définie), badge priorité, chips tags (`pillTag`), icône `↻` si récurrente, compteur sous-tâches (`x/y`) dépliable avec checkboxes individuelles + réordonnancement ↑/↓ + ajout inline, boutons ↑/↓ pour réordonner la tâche elle-même.
- `taches/listes/page.tsx` + `AddListeForm/Toggle.tsx`, `ListesManager.tsx`, `AddTagForm/Toggle.tsx`, `TagsManager.tsx` (créés) : page dédiée de gestion des listes (nom, couleur via `<input type="color">`, réordonnancement ↑/↓, suppression sauf `Général`) et des tags (nom, couleur, suppression).

### Module Agenda (impacté par le passage de `taches.liste_id` en `not null` + nouvelles relations)

- `agenda/page.tsx` : `getTachesAvecRelations()` + `getListes()` + `getTags()` au lieu du `select("*")` brut.
- `agenda/AgendaView.tsx`, `DayView.tsx`, `ListView.tsx` : typage `TacheAvecRelations`, propagation de `listes`/`tags` jusqu'à `TaskCard`/`AddTaskToggle` (qui en ont désormais besoin pour le formulaire d'édition/création).
- `WeekView.tsx`, `MonthView.tsx` : **non modifiés** — ils ne lisent que `echeance`/`heure`/`titre`, compatibles par typage structurel avec `TacheAvecRelations[]`.

## Décisions prises

- **Récurrence (Option A validée)** : dans `toggleTache`, si la tâche passe à `fait = true` et a une `recurrence_frequence`, la prochaine échéance est calculée via `calculerProchaineOccurrence` (base = `echeance` actuelle ou aujourd'hui si nulle). Si `recurrence_fin` est dépassée par cette nouvelle date, la tâche reste cochée (fin de la récurrence) ; sinon `fait` repasse à `false` et `echeance` est mise à jour, `heure` inchangée.
- **`recurrence_fin` sans fréquence** : ignorée silencieusement plutôt que rejetée avec une erreur (même logique que `unite`/`valeur_cible` pour les objectifs de type `valeur` dans `parseObjectifInput`).
- **Couleur de `listes_taches`/`tags`** : `couleur text`, saisie via `<input type="color">`, donc toujours un hex 6 chiffres (`#rrggbb`) ou `null`. Aucun précédent exact dans le code (les catégories budget/habitudes utilisent `icone text`, un emoji, pas une couleur) — le hex a été préféré à une classe oklch car ces couleurs sont créées dynamiquement par l'utilisateur, impossible à représenter par des tokens Tailwind compilés à l'avance.
- **Couleurs de priorité (fixe, 4 valeurs)** : réutilisation des accents de module déjà en place plutôt qu'une nouvelle palette — `haute` → `--accent-alert` (rouge), `moyenne` → `--accent-carbs` (orange, déjà l'accent du module Tâches), `basse` → `--accent-agenda` (bleu), `aucune` → pas de badge.
- **Réordonnancement (`reordonnerTaches`/`reordonnerListes`/`reordonnerSousTaches`)** : boutons ↑/↓ avec échange d'`ordre` (pattern `deplacerEtape` existant), **pas de `@dnd-kit`** — décision documentée ci-dessus (Constats). `ordre` est assigné à la création comme `max(ordre) + 1` **au sein de la liste** (`liste_id`) pour `taches`, comme le fait déjà `creerObjectif` pour `objectifs`.
- **Limite connue du réordonnancement** : `reordonnerTaches` échange la tâche avec sa voisine *dans l'ordre complet de la liste*, indépendamment du filtre d'onglet actif (Aujourd'hui/7 jours). Si le voisin réel n'est pas affiché dans la vue filtrée courante, le clic ↑/↓ ne produit aucun changement visible immédiat (aucun bug de données, juste un effet visuel absent tant qu'on n'est pas en vue "Toutes" ou filtré sur une seule liste). Non traité plus finement, faute de spécification explicite sur ce point.
- **Suppression d'une liste** : la liste `Général` (créée par la migration, backfill de toutes les tâches existantes) ne peut pas être supprimée — même logique que les catégories prédéfinies du budget (`supprimerCategorie`). Supprimer une liste qui contient encore des tâches échoue avec l'erreur de contrainte de clé étrangère brute de Postgres (pas de message francisé dédié, ni de réassignation automatique vers `Général`) : choix de simplicité, à revoir si Vincent veut un message plus clair.
- **Tags "à la volée"** : le formulaire envoie à la fois les tags existants cochés (`tag_ids`) et une liste de nouveaux noms séparés par virgule (`nouveaux_tags`) ; `resolveTagIds` fait un `upsert` sur `nom` (unique) pour éviter les doublons si l'utilisateur retape un tag déjà existant.
- **Vues intelligentes** : "Aujourd'hui" = `echeance === aujourd'hui` (strict), "7 prochains jours" = `echeance` dans `[aujourd'hui, aujourd'hui+7]` inclus, "Toutes" = pas de filtre. Les tâches en retard (`echeance` passée, non faites) n'apparaissent donc que dans "Toutes", pas dans "Aujourd'hui" — lecture littérale du prompt plutôt qu'un comportement "retard + aujourd'hui" à la TickTick ; à ajuster si Vincent préfère l'autre lecture.

## Résultat des vérifications

- `npm ci` (nécessaire, `node_modules` absent au démarrage de la session).
- `npx tsc --noEmit` : **0 erreur**.
- `npx eslint .` : **0 erreur, 0 warning**.
- `npx next build` : **build complet réussi**, routes `ƒ /taches` et `ƒ /taches/listes` générées, `/agenda` toujours dynamique.
- **Test navigateur non effectué** : l'accès réseau sortant de cette session est restreint à une liste d'hôtes autorisés qui n'inclut pas `vsmtkopkqasrdnjceegp.supabase.co` pour un process applicatif (contrairement aux appels `mcp__Supabase__*`, qui passent par un chemin différent). `next dev` démarre correctement et les routes `/taches`, `/taches/listes`, `/agenda` répondent, mais tout appel Supabase depuis le serveur de dev échoue avec `Host not in allowlist`. Faute de pouvoir contourner cette restriction (instruction explicite de ne pas le faire), la validation s'est donc arrêtée à : schéma vérifié en base via MCP, compilation/typecheck/lint/build réussis, relecture manuelle du flux de données. **Un test manuel par Vincent dans un environnement avec accès réseau normal reste recommandé avant mise en prod.**

## Avant de pousser

Conformément à la consigne, **rien n'a été poussé sur `kilio`** — confirmation explicite de Vincent requise avant tout `git push`.
