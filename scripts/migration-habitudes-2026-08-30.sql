-- Module Habitudes, indépendant de Nutrition/PPL (pas de lien au split
-- entrainement/repos). Aucune habitude n'est seedée : la table reste vide,
-- l'utilisateur crée ses habitudes lui-même via l'UI après déploiement.
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql, qui a désactivé la RLS sur les
-- tables existantes. habitudes/habitude_entries suivent le même pattern
-- (comme notes et taches).

create type habitude_type as enum ('boolean', 'streak', 'quantifiee');

create table habitudes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type habitude_type not null default 'boolean',
  unite text,
  valeur_cible numeric(8,2),
  icone text,
  ordre integer not null default 0,
  actif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habitudes_unite_only_quantifiee check (
    type = 'quantifiee' or unite is null
  ),
  constraint habitudes_valeur_cible_only_quantifiee check (
    type = 'quantifiee' or valeur_cible is null
  )
);

create index idx_habitudes_actif_ordre on habitudes(actif, ordre);

-- set_updated_at() est déjà défini par migration-aliments-2026-08-27.sql.
create trigger trg_habitudes_updated_at
  before update on habitudes
  for each row execute function set_updated_at();

create table habitude_entries (
  id uuid primary key default gen_random_uuid(),
  habitude_id uuid not null references habitudes(id) on delete cascade,
  date date not null,
  valeur numeric(8,2) not null default 0 check (valeur >= 0),
  created_at timestamptz not null default now(),
  constraint habitude_entries_habitude_date_key unique (habitude_id, date)
);

create index idx_habitude_entries_habitude_id_date on habitude_entries(habitude_id, date);
