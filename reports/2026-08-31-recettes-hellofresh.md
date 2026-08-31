# Adaptation du module Recettes au format HelloFresh

## Résumé

Le module Recettes gère désormais deux types de fiches : les recettes **manuel**
(inchangées, composées d'ingrédients liés à `aliments` avec calcul nutritionnel
automatique) et les recettes **hellofresh** (fiches imprimées, avec ingrédients en
texte libre, étapes numérotées, ustensiles et valeurs nutritionnelles imprimées en
override).

## Base de données

Migration : `scripts/migration-recettes-hellofresh-2026-08-31.sql`
(+ `-revert.sql`). État de la base vérifié avant écriture via `mcp__Supabase__list_tables`
sur le projet `vsmtkopkqasrdnjceegp` — `recettes` et `recette_ingredients` étaient
bien alignées avec `types.ts`, aucun décalage constaté.

### `recettes` — colonnes ajoutées (toutes nullable)
- Override par portion : `kcal_portion`, `proteines_portion`, `glucides_portion`,
  `sucres_portion`, `lipides_portion`, `satures_portion`, `fibres_portion`, `sel_portion`
- Override pour 100g : `kcal_100g`, `proteines_100g`, `glucides_100g`, `sucres_100g`,
  `lipides_100g`, `satures_100g`, `fibres_100g`, `sel_100g`
- `ustensiles text[]`

### Nouvelles tables
- **`recette_ingredients_libres`** : `id`, `recette_id` (FK cascade), `nom`, `quantite`
  (texte libre, ex. `"1 sachet"`, `"⅓ cc"`), `ordre`, `created_at`. Index sur
  `(recette_id, ordre)`.
- **`recette_etapes`** : `id`, `recette_id` (FK cascade), `ordre`, `titre` (nullable),
  `consigne`, `astuce` (nullable), `created_at`, `updated_at` (trigger `set_updated_at()`
  réutilisé depuis `migration-aliments-2026-08-27.sql`). Index sur `(recette_id, ordre)`.

`src/lib/supabase/types.ts` régénéré via `mcp__Supabase__generate_typescript_types`.

## Fichiers modifiés
- `src/lib/nutrition/compute.ts` — ajout de `RecetteNutritionOverride`,
  `hasNutritionOverride()`, `nutritionFromOverride()`.
- `src/app/(app)/page.tsx`, `src/app/(app)/nutrition/journal/page.tsx` — la requête
  `journal_repas` sélectionne désormais les 4 champs `*_portion` de `recettes` ; le calcul
  bascule sur `nutritionFromOverride` quand `hasNutritionOverride(recette)` est vrai,
  sinon comportement inchangé (`nutritionRecette` sur `recette_ingredients`).
- `src/app/(app)/nutrition/recettes/page.tsx` — même bascule pour `kcalParPortion`
  dans la liste.
- `src/app/(app)/nutrition/recettes/[id]/page.tsx` — charge en plus
  `recette_ingredients_libres` et `recette_etapes` ; affiche conditionnellement selon
  `recette.source` (`hellofresh` → ingrédients libres + étapes + ustensiles,
  `manuel` → `IngredientManager` existant, inchangé).
- `src/app/actions/recettes.ts` — `parseRecetteInput` valide et persiste les 16 champs
  nutritionnels (nombres positifs ou vides) et `ustensiles` (une ligne de textarea =
  un ustensile → `text[]`).
- `src/app/(app)/nutrition/recettes/RecetteForm.tsx` — section repliable "Valeurs
  nutritionnelles (si imprimées)" en 2 colonnes (16 champs), et champ `ustensiles`
  (textarea), affichés uniquement quand la source sélectionnée est `hellofresh`.
- `src/app/(app)/nutrition/recettes/[id]/RecetteMacros.tsx` — accepte une prop `detail`
  optionnelle ; si présente (override actif), affiche un tableau repliable "par
  portion / pour 100g" pour sucres, saturés, fibres, sel sous les 4 chips existants.

## Fichiers créés
- `src/app/actions/recette-ingredients-libres.ts` — `addIngredientLibre`,
  `updateIngredientLibre`, `removeIngredientLibre`, `reorderIngredientsLibres`
  (pattern de `recette-ingredients.ts`, sans `aliment_id`).
- `src/app/actions/recette-etapes.ts` — `addEtape`, `updateEtape`, `removeEtape`.
- `src/app/(app)/nutrition/recettes/[id]/IngredientsLibresManager.tsx` — gestion des
  ingrédients en texte libre (nom + quantité texte, sans sélection d'aliment/unité).
- `src/app/(app)/nutrition/recettes/[id]/EtapesManager.tsx` — liste ordonnée d'étapes
  (titre, consigne, astuce) avec ajout/édition/suppression.

Toutes les server actions ci-dessus appellent `revalidatePath` sur
`/nutrition/recettes` et `/nutrition/recettes/[id]`.

## Choix pris
- **Override nutritionnel** : ne remplace pas le calcul existant via
  `recette_ingredients` — c'est un jeu de colonnes parallèle sur `recettes`, activé
  dès que `kcal_portion` est renseigné (`hasNutritionOverride`). Les recettes
  "manuel" sans override continuent de fonctionner exactement comme avant.
- **Ingrédients HelloFresh en texte libre** : table séparée
  (`recette_ingredients_libres`) plutôt que de forcer un lien vers `aliments`, car les
  fiches HelloFresh utilisent des quantités non structurées (`"⅓ cc"`, `"1 sachet"`)
  qui ne correspondent pas au modèle `unite_mesure` existant.
- **Étapes numérotées** : table dédiée `recette_etapes` avec `ordre` explicite plutôt
  qu'un simple champ texte, pour permettre l'édition individuelle de chaque étape
  (titre + consigne + astuce du chef) comme sur les fiches imprimées.
- **Affichage conditionnel par `source`** : la page recette bascule entièrement
  d'interface selon `recette.source` (`hellofresh` vs `manuel`) plutôt que de
  fusionner les deux modèles dans un seul écran.

## Hors scope (laissé pour plus tard si besoin)
- Pas de distinction "ingrédient fourni par HelloFresh / à ajouter soi-même".
- Pas de tags, allergènes, ni numéro de recette HelloFresh.
- Pas de drag-and-drop pour réordonner les ingrédients libres ou les étapes dans
  l'UI (l'action `reorderIngredientsLibres` existe côté serveur mais n'est pas
  encore appelée depuis un composant — les items s'ajoutent en fin de liste via
  `ordre` croissant).

## Vérifications
- `npx tsc --noEmit` : OK
- `npx eslint .` : OK
- `npm run build` : OK (toutes les routes, dont `/nutrition/recettes` et
  `/nutrition/recettes/[id]`, compilent et se génèrent sans erreur)
