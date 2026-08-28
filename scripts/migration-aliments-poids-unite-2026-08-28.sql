-- Ajoute un poids de référence par "pièce" sur les aliments, pour permettre
-- de logger une quantité dans le journal en unités (ex: 1 banane) sans avoir
-- à peser, en la convertissant en grammes avant calcul des macros.
--
-- Important : les macros de référence (kcal_100g, proteines_100g,
-- glucides_100g, lipides_100g, etc.) restent TOUJOURS exprimées pour 100g,
-- quelle que soit la valeur de `unite`. `poids_unite_g` n'est qu'un
-- coefficient de conversion (poids moyen en grammes d'une pièce de cet
-- aliment, ex: banane ≈ 120g) utilisé uniquement pour transformer une
-- saisie "en pièces" en grammes avant d'appliquer `nutritionAliment`. On ne
-- réintroduit pas de macros "pour 100 pièces".
--
-- Nullable : tous les aliments n'ont pas une pièce standard (ex: riz, huile).

alter table aliments
  add column poids_unite_g numeric(6,2) check (poids_unite_g > 0);
