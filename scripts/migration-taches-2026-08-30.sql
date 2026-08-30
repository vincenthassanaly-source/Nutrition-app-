-- Tâches, indépendantes de Nutrition et Notes.
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql, qui a désactivé la RLS sur les
-- tables existantes. taches suit le même pattern (comme notes).

create table taches (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  echeance date,
  fait boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_taches_echeance on taches(echeance);

create trigger trg_taches_updated_at
  before update on taches
  for each row execute function set_updated_at();
