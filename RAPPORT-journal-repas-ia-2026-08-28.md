# Rapport — Log de repas en texte libre estimé par IA (2026-08-28)

## Objectif

Ajouter, dans le Journal, une saisie en texte libre du repas ("riz + poulet +
avocat") qui appelle l'API Claude pour estimer les macros, affichées à
l'utilisateur dans des champs éditables pour validation/ajustement AVANT tout
enregistrement en base. L'IA n'écrit jamais directement dans le journal.

## ÉTAPE 0 — Validation du schéma (fait avant tout code, confirmé par
l'utilisateur avant implémentation)

- Aucune table pour des entrées de repas en texte libre n'existait.
- `journal_repas` avait une contrainte XOR stricte
  (`aliment_id` XOR `recette_id`) et `quantite` obligatoire (grammes/ml).
- **Décision (validée par l'utilisateur)** : étendre `journal_repas` plutôt
  que créer une table séparée, pour que les entrées "libres" apparaissent
  dans le même flux que l'existant — "Repas du jour" (groupé par moment) et
  "Résumé du jour" (somme des macros de la journée), qui lisent aujourd'hui
  `journal_repas` par date. Une table séparée aurait obligé à fusionner deux
  sources à chaque lecture du journal.
- Écart signalé et confirmé : le prompt indiquait "pas de saisie manuelle
  existante à respecter" — or un formulaire Aliment/Recette existe déjà dans
  le Journal (fonctionnalité précédente de cette session). La saisie IA a été
  ajoutée comme un **second mode**, en plus de l'existant, pas en
  remplacement.

## Migration SQL

`scripts/migration-journal-repas-libre-ia-2026-08-28.sql` (appliquée sur le
projet Supabase `nutrition-app`) :
- Ajoute à `journal_repas` : `description text`, `kcal`, `proteines_g`,
  `glucides_g`, `lipides_g` (numeric, nullable, `check (>= 0)`), et
  `source text check (in 'ia','manuel')` (défaut `'manuel'` — les entrées
  aliment/recette existantes restent classées "manuel").
- `quantite` devient nullable (elle n'a pas de sens pour une entrée libre :
  ses macros sont déjà le total du repas, pas une valeur "pour 100g").
- Remplace la contrainte XOR à 2 voies par une contrainte à 3 voies
  (`journal_repas_source_xor`) : exactement une des trois sources
  (aliment / recette / macros libres) par ligne.
- Ajoute `journal_repas_quantite_requise` (quantite requise ⟺ aliment ou
  recette) et `journal_repas_libre_champs_requis` (description + 4 macros
  toutes renseignées ensemble pour une entrée libre).
- RLS existant inchangé : les policies sont scopées par `user_id` et
  s'appliquent telles quelles aux nouvelles colonnes.

Testé directement en base (insert simulant le server action, puis rollback) :
une ligne "libre" valide est acceptée, une ligne sans aucune source de macros
est bien rejetée par `journal_repas_source_xor`.

## ÉTAPE 1 — Server Action d'appel API

`src/app/actions/journal-ia.ts` — `estimateRepasLibre(description)` :
- `"use server"`, jamais appelé côté client directement à l'API — seul le
  serveur détient la clé.
- Clé lue depuis `process.env.ANTHROPIC_API_KEY` (jamais committée, jamais
  exposée au client ; erreur explicite si absente côté serveur).
- Modèle `claude-opus-5` (SDK officiel `@anthropic-ai/sdk`), appelé via
  `client.messages.parse()` + `output_config.format: zodOutputFormat(...)`
  pour un JSON strictement validé côté SDK (schéma Zod :
  `kcal`, `proteines_g`, `glucides_g`, `lipides_g` ≥ 0, `note: string`).
- Le system prompt impose : estimer les macros du repas **entier** (pas pour
  100g), utiliser des portions standards si l'utilisateur ne précise pas les
  quantités, et **toujours** expliquer les hypothèses faites dans `note`
  (c'est le champ "confiance/note" demandé à l'ÉTAPE 1).
- Parsing robuste : `zodOutputFormat` valide le JSON côté SDK ;
  `response.parsed_output` est vérifié (jamais fait confiance à un JSON brut
  non validé) ; jusqu'à 2 tentatives en cas d'échec ; erreurs typées
  distinguées (`AuthenticationError`, `RateLimitError`, `APIError`) avec un
  message clair renvoyé au client dans tous les cas.
- `effort: "low"` (via `output_config`) : tâche d'extraction simple, pas
  besoin d'un effort de raisonnement élevé — réduit coût et latence.

## ÉTAPE 2 — UI de validation

`src/app/(app)/journal/AddJournalEntryLibreForm.tsx`, ajoutée dans une
nouvelle section "Décrire un repas (IA)" sur `/journal`, sous le formulaire
existant Aliment/Recette :
- Textarea de description libre + bouton "Estimer avec l'IA" (appelle
  `estimateRepasLibre` directement, via `useTransition`).
- Après estimation : 4 champs numériques éditables pré-remplis (kcal,
  protéines, glucides, lipides), la `note` de l'IA affichée en encart
  au-dessus, sélecteur de moment, boutons "Recommencer" / "Valider et
  enregistrer".
- Utilisateur peut ajuster n'importe quelle valeur avant validation.
- Style cohérent avec le reste de l'app (`src/lib/ui.ts` : `card`, `input`,
  boutons, mêmes classes que `AddJournalEntryForm`).

## ÉTAPE 3 — Enregistrement

`addJournalEntryLibre` dans `src/app/actions/journal.ts` :
- Valide description/date/moment/macros (nombres positifs).
- `source` calculé côté client avant soumission : si l'utilisateur a modifié
  au moins une des 4 valeurs proposées par l'IA, `source = 'manuel'`, sinon
  `source = 'ia'` (jugé utile : ça distingue une estimation IA acceptée
  telle quelle d'une correction manuelle, utile pour évaluer la fiabilité de
  l'IA dans le temps).
- Insert dans `journal_repas` avec `aliment_id`/`recette_id` à `null`,
  `quantite` à `null`, RLS existant (insert `with check (user_id = auth.uid())`)
  inchangé.

## Fichiers modifiés/créés

- `scripts/migration-journal-repas-libre-ia-2026-08-28.sql` (créé, appliqué)
- `src/lib/supabase/types.ts` (Row/Insert/Update de `journal_repas` mis à
  jour : nouvelles colonnes, `quantite` nullable)
- `src/app/actions/journal-ia.ts` (créé — appel Claude)
- `src/app/actions/journal.ts` (ajout `addJournalEntryLibre`)
- `src/app/(app)/journal/AddJournalEntryLibreForm.tsx` (créé)
- `src/app/(app)/journal/page.tsx` (nouvelle section, prise en compte des
  entrées libres dans `views`/Résumé du jour via une 3ᵉ branche de mapping)
- `package.json` / `package-lock.json` (ajout `@anthropic-ai/sdk`, `zod`)

## Vérifications faites

- `npx tsc --noEmit` : aucune erreur introduite (seule erreur restante,
  préexistante, sans lien : `LayoutProps` dans `layout.tsx`).
- `npx eslint` sur tous les fichiers modifiés/créés : aucune erreur.
- Schéma Zod `EstimationSchema` testé isolément (accepte un payload valide,
  rejette une valeur négative) : la validation fonctionne réellement.
- Insert réel en base simulant `addJournalEntryLibre` : accepté ; ligne sans
  aucune macro/aliment/recette : rejetée par la contrainte. Ligne de test
  supprimée après vérification.
- Entrées aliment/recette existantes : non affectées (la 3ᵉ branche du
  mapping dans `page.tsx` ne s'applique qu'aux lignes sans `aliment`/`recette`
  joints ; `nutritionAliment`/`nutritionRecette` inchangés).

## Point non testé manuellement (à faire par l'utilisateur)

**L'appel réel à l'API Claude n'a pas pu être testé de bout en bout** : cet
environnement de développement n'a pas de `ANTHROPIC_API_KEY` configurée (ni
de credentials `ant auth`). Pour que la fonctionnalité marche en production :

1. Ajouter la variable d'environnement `ANTHROPIC_API_KEY` sur le projet
   Vercel **nutrition-appvincent** (Settings → Environment Variables) —  je
   n'ai pas accès à ce projet Vercel depuis cette session pour le faire
   moi-même (déjà constaté plus tôt dans la conversation).
2. Si tu développes en local, ajouter la même variable dans `.env.local`
   (déjà dans `.gitignore`, ne sera jamais commitée).
3. Tester dans l'app : Journal → "Décrire un repas (IA)" → décrire un repas
   → "Estimer avec l'IA" → vérifier que les 4 champs se remplissent et que
   la note d'hypothèses s'affiche → ajuster si besoin → "Valider et
   enregistrer" → vérifier l'apparition dans "Repas du jour" et la mise à
   jour du "Résumé du jour".

## Écarts par rapport au prompt

- Schéma étendu sur `journal_repas` plutôt qu'une nouvelle table dédiée
  (justifié et confirmé ci-dessus).
- Le champ "confiance/note" n'est pas persisté en base (uniquement affiché à
  l'utilisateur au moment de l'estimation, avant enregistrement) — la liste
  de colonnes donnée dans le prompt ne l'incluait pas ; à ajouter facilement
  plus tard (`add column note text`) si tu veux le conserver après coup.
- Ajoutée comme second mode de saisie, en plus du formulaire Aliment/Recette
  existant (voir écart signalé à l'ÉTAPE 0).
- Modèle utilisé : `claude-opus-5` (par défaut du skill Claude API du projet,
  aucun modèle demandé explicitement). C'est plus coûteux qu'un modèle plus
  léger pour une simple extraction de macros ; si tu veux réduire le coût,
  il suffit de changer la chaîne `model` dans
  `src/app/actions/journal-ia.ts`.
