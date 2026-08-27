-- Catalogue de référence : aliments partagés (user_id NULL).
-- À exécuter avec le rôle service_role (bypass RLS), cf. commentaire en tête
-- de scripts/migration-aliments-2026-08-27.sql.
-- Valeurs pour 100 g, sources Ciqual (ANSES) en priorité, USDA FoodData
-- Central sinon (voir commentaire sur chaque ligne). Aliments par défaut
-- sous forme cuite/prête à consommer sauf mention contraire.

insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g)
values
  -- Ciqual: "Poulet, blanc, rôti"
  ('Blanc de poulet (cuit)', 'Protéines', 'g', 148, 29.4, 0, 0, 3.5, 1.0, 0, 0.20),
  -- Ciqual: "Dinde, escalope, rôtie/cuite au four"
  ('Escalope de dinde (cuite)', 'Protéines', 'g', 128, 25.0, 0.5, 0, 3.0, 1.0, 0, 0.30),
  -- Ciqual: "Boeuf, steak haché 5% MG, cuit"
  ('Steak haché 5% MG (cuit)', 'Protéines', 'g', 155, 26.0, 0, 0, 5.9, 2.7, 0, 0.20);
