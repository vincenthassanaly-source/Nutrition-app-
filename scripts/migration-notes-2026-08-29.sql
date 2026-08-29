-- Notes libres, indépendantes du Journal et des Recettes.
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql, qui a désactivé la RLS sur les
-- 5 tables existantes (aliments, recettes, recette_ingredients,
-- objectifs_nutritionnels, journal_repas). notes suit le même pattern.

create table notes (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  contenu text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_notes_created_at on notes(created_at desc);

create trigger trg_notes_updated_at
  before update on notes
  for each row execute function set_updated_at();
