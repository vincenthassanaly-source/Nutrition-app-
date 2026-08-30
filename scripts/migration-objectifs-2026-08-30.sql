-- Module Objectifs : suivi d'objectifs personnels ou professionnels, avec
-- échéance et un mode de suivi variable par objectif (valeur cible + courbe
-- dans le temps, checklist d'étapes, ou simple binaire fait/pas fait).
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql, qui a désactivé la RLS sur les
-- tables existantes. objectifs/objectif_etapes/objectif_entries suivent le
-- même pattern (comme habitudes/habitude_entries et taches).

create type categorie_objectif as enum ('perso', 'pro');
create type statut_objectif as enum ('en_cours', 'atteint', 'abandonne');
create type type_suivi_objectif as enum ('valeur', 'etapes', 'binaire');

create table objectifs (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  categorie categorie_objectif not null default 'perso',
  statut statut_objectif not null default 'en_cours',
  type_suivi type_suivi_objectif not null default 'binaire',
  date_echeance date,
  valeur_cible numeric(10,2),
  unite text,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint objectifs_valeur_cible_only_valeur check (
    type_suivi = 'valeur' or valeur_cible is null
  ),
  constraint objectifs_unite_only_valeur check (
    type_suivi = 'valeur' or unite is null
  )
);

create index idx_objectifs_categorie_statut on objectifs(categorie, statut);
create index idx_objectifs_date_echeance on objectifs(date_echeance);

-- set_updated_at() est déjà défini par migration-aliments-2026-08-27.sql.
create trigger trg_objectifs_updated_at
  before update on objectifs
  for each row execute function set_updated_at();

create table objectif_etapes (
  id uuid primary key default gen_random_uuid(),
  objectif_id uuid not null references objectifs(id) on delete cascade,
  titre text not null,
  fait boolean not null default false,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_objectif_etapes_objectif_id on objectif_etapes(objectif_id, ordre);

create table objectif_entries (
  id uuid primary key default gen_random_uuid(),
  objectif_id uuid not null references objectifs(id) on delete cascade,
  date date not null,
  valeur numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint objectif_entries_objectif_date_key unique (objectif_id, date)
);

create index idx_objectif_entries_objectif_id_date on objectif_entries(objectif_id, date);
