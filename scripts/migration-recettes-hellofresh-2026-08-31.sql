-- Adapte le module Recettes au format des fiches HelloFresh :
-- override nutritionnel imprimé, ingrédients en texte libre, étapes numérotées, ustensiles.
-- `set_updated_at()` existe déjà (créée dans migration-aliments-2026-08-27.sql), pas de recréation ici.

alter table recettes
  add column kcal_portion numeric,
  add column proteines_portion numeric,
  add column glucides_portion numeric,
  add column sucres_portion numeric,
  add column lipides_portion numeric,
  add column satures_portion numeric,
  add column fibres_portion numeric,
  add column sel_portion numeric,
  add column kcal_100g numeric,
  add column proteines_100g numeric,
  add column glucides_100g numeric,
  add column sucres_100g numeric,
  add column lipides_100g numeric,
  add column satures_100g numeric,
  add column fibres_100g numeric,
  add column sel_100g numeric,
  add column ustensiles text[];

create table recette_ingredients_libres (
  id uuid primary key default gen_random_uuid(),
  recette_id uuid not null references recettes(id) on delete cascade,
  nom text not null,
  quantite text,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

create index on recette_ingredients_libres(recette_id, ordre);

create table recette_etapes (
  id uuid primary key default gen_random_uuid(),
  recette_id uuid not null references recettes(id) on delete cascade,
  ordre integer not null,
  titre text,
  consigne text not null,
  astuce text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index on recette_etapes(recette_id, ordre);

create trigger trg_recette_etapes_updated_at
  before update on recette_etapes
  for each row execute function set_updated_at();
