-- Convention jour_semaine : alignée sur date-fns getDay() (0 = dimanche ...
-- 6 = samedi), déjà utilisé implicitement par WeekView/MonthView via
-- startOfWeek/getDay. weekStartsOn: 1 ne change que l'ordre d'affichage,
-- pas la valeur retournée par getDay().
create table horaires_travail (
  jour_semaine smallint primary key check (jour_semaine between 0 and 6),
  heure_debut time,
  heure_fin time,
  updated_at timestamptz not null default now()
);

-- Réutilise la fonction set_updated_at() existante (créée dans
-- migration-aliments-2026-08-27.sql), ne pas la recréer.
create trigger horaires_travail_set_updated_at
  before update on horaires_travail
  for each row execute function set_updated_at();

-- Seed des 7 jours, tous vides au départ (Vincent les configure depuis l'UI).
insert into horaires_travail (jour_semaine, heure_debut, heure_fin)
select generate_series(0, 6), null, null;
