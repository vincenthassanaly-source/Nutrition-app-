-- Ajoute les macros détaillées à la table aliments : sucres, acides gras
-- saturés, fibres et sel, en complément des colonnes existantes (kcal,
-- protéines, glucides, lipides). Nullable car pas toujours disponible selon
-- la source (Ciqual / USDA FoodData Central).

alter table aliments
  add column sucres_100g numeric(6,2) check (sucres_100g >= 0),
  add column acides_gras_satures_100g numeric(6,2) check (acides_gras_satures_100g >= 0),
  add column fibres_100g numeric(6,2) check (fibres_100g >= 0),
  add column sel_100g numeric(6,2) check (sel_100g >= 0);
