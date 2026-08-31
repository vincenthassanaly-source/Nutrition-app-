-- Revert de migration-recettes-hellofresh-2026-08-31.sql

drop trigger if exists trg_recette_etapes_updated_at on recette_etapes;
drop table if exists recette_etapes;
drop table if exists recette_ingredients_libres;

alter table recettes
  drop column if exists kcal_portion,
  drop column if exists proteines_portion,
  drop column if exists glucides_portion,
  drop column if exists sucres_portion,
  drop column if exists lipides_portion,
  drop column if exists satures_portion,
  drop column if exists fibres_portion,
  drop column if exists sel_portion,
  drop column if exists kcal_100g,
  drop column if exists proteines_100g,
  drop column if exists glucides_100g,
  drop column if exists sucres_100g,
  drop column if exists lipides_100g,
  drop column if exists satures_100g,
  drop column if exists fibres_100g,
  drop column if exists sel_100g,
  drop column if exists ustensiles;
