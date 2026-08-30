-- Refonte du module Tâches façon TickTick : listes, tags, sous-tâches,
-- priorité, notes et récurrence. Pas de dossiers, pas de Pomodoro (hors
-- périmètre, cf. prompt).
--
-- Pas de RLS ni de user_id : suit le même pattern que taches
-- (migration-taches-2026-08-30.sql), mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql.
--
-- Récurrence : réutilise l'enum frequence_recurrence, déjà défini par
-- migration-budget-transactions-recurrentes-2026-08-30.sql pour
-- transactions_recurrentes — pas de nouvel enum créé, donc pas besoin
-- d'appels apply_migration séparés (une seule transaction suffit). La
-- récurrence hebdomadaire signifie "tous les 7 jours à partir de
-- l'échéance" (pas de champ jours de la semaine), comme pour les
-- transactions récurrentes.
--
-- priorite_tache est un nouvel enum (pas un ALTER TYPE ... ADD VALUE), donc
-- utilisable immédiatement dans la même transaction que sa création.

create type priorite_tache as enum ('aucune', 'basse', 'moyenne', 'haute');

create table listes_taches (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  couleur text,
  ordre integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_listes_taches_ordre on listes_taches(ordre);

create trigger trg_listes_taches_updated_at
  before update on listes_taches
  for each row execute function set_updated_at();

-- Liste par défaut : toutes les tâches existantes y sont rattachées plus
-- bas, avant que liste_id passe not null.
insert into listes_taches (nom, ordre) values ('Général', 0);

create table tags (
  id uuid primary key default gen_random_uuid(),
  nom text not null unique,
  couleur text,
  created_at timestamptz not null default now()
);

create table taches_tags (
  tache_id uuid not null references taches(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (tache_id, tag_id)
);

create index idx_taches_tags_tag_id on taches_tags(tag_id);

create table sous_taches (
  id uuid primary key default gen_random_uuid(),
  tache_id uuid not null references taches(id) on delete cascade,
  titre text not null,
  fait boolean not null default false,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_sous_taches_tache_id on sous_taches(tache_id, ordre);

alter table taches
  add column liste_id uuid references listes_taches(id),
  add column notes text,
  add column priorite priorite_tache not null default 'aucune',
  add column ordre integer not null default 0,
  add column recurrence_frequence frequence_recurrence,
  add column recurrence_fin date;

update taches
  set liste_id = (select id from listes_taches where nom = 'Général')
  where liste_id is null;

alter table taches
  alter column liste_id set not null;

create index idx_taches_liste_id on taches(liste_id);
