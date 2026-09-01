drop table if exists horaires_travail_creneaux;

-- Recrée horaires_travail avec sa structure d'origine
-- (migration-horaires-travail-2026-09-01.sql), pour repartir de l'état actuel.
create table horaires_travail (
  jour_semaine smallint primary key check (jour_semaine between 0 and 6),
  heure_debut time,
  heure_fin time,
  updated_at timestamptz not null default now()
);

create trigger horaires_travail_set_updated_at
  before update on horaires_travail
  for each row execute function set_updated_at();

insert into horaires_travail (jour_semaine, heure_debut, heure_fin)
select generate_series(0, 6), null, null;
