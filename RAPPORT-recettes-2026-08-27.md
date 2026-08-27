# Rapport — Étape 2 : CRUD Recettes + Ingrédients

Date : 2026-08-27

## Ce qui a été construit

- **Server actions**
  - `src/app/actions/recettes.ts` : `createRecette` (redirige vers la fiche recette créée),
    `updateRecette`, `deleteRecette` (redirige vers la liste après suppression). Validation des
    champs (nom requis, portions entier positif, temps de préparation entier positif ou vide,
    source dans l'enum).
  - `src/app/actions/recette-ingredients.ts` : `addIngredient`, `updateIngredient`,
    `removeIngredient`. Message dédié si l'aliment est déjà présent dans la recette (violation de
    la contrainte unique `(recette_id, aliment_id)` → code Postgres `23505`), et si la
    modification porte sur une recette partagée non modifiable (RLS).
- **Pages**
  - `src/app/(app)/recettes/page.tsx` : liste des recettes visibles (personnelles + partagées),
    formulaire de création repliable.
  - `src/app/(app)/recettes/[id]/page.tsx` : fiche recette — en-tête éditable/supprimable
    (`RecetteHeader`) + gestion des ingrédients (`IngredientManager`) : ajout via un sélecteur
    d'aliments existants (l'unité est automatiquement dérivée de l'aliment choisi, pas de saisie
    manuelle d'unité pour éviter les incohérences avec le placard à l'étape 4), édition inline de
    la quantité, suppression.
- Les recettes et leurs ingrédients suivent la même logique de partage que les aliments
  (`user_id` nullable → visible par tous, non modifiable sauf par le propriétaire).

## Tests effectués

- `npx eslint src` : aucun avertissement.
- `npm run build` : compilation + vérification TypeScript OK, nouvelles routes générées
  (`/recettes`, `/recettes/[id]`).
- **RLS et contraintes vérifiées directement en base** (deux utilisateurs simulés, comme à
  l'étape 1) :
  - Création d'une recette avec 2 ingrédients par l'utilisateur A.
  - Contrainte unique `(recette_id, aliment_id)` : un doublon est bien rejeté
    (`23505 duplicate key`), correspondant au message d'erreur affiché côté UI.
  - Utilisateur B : ne voit ni la recette ni les ingrédients de A (recette personnelle, pas
    partagée) ; toute tentative d'insertion d'un ingrédient dans la recette de A est rejetée par
    la RLS (`42501 new row violates row-level security policy`) ; toute tentative d'UPDATE/DELETE
    sur la recette de A affecte 0 ligne, recette intacte vérifiée ensuite.
  - Utilisateur A : modification de quantité (200g → 250g) appliquée correctement ; suppression de
    la recette entraîne bien la suppression en cascade de ses `recette_ingredients` (0 ligne
    orpheline après coup).
  - Données de test entièrement nettoyées après vérification.

### Limite de test inchangée

Comme pour l'étape 1, cet environnement bloque les appels réseau sortants vers
`*.supabase.co`, donc pas de test possible dans un vrai navigateur ici (voir
`RAPPORT-aliments-2026-08-27.md` pour le détail et les options).

## Prochaine étape

Étape 3 : liste de courses — sélection de recettes → génération avec fusion des quantités par
aliment identique, cases à cocher.
