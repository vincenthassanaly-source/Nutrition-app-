-- Créneaux de travail ponctuels (une date précise, non récurrents) :
-- affichés avec la même couleur --accent-planning-travail que le planning
-- récurrent (horaires_travail_creneaux), sans modifier cette dernière table.
create table horaires_travail_exceptions (
  id bigint generated always as identity primary key,
  date date not null,
  heure_debut time not null,
  heure_fin time not null check (heure_fin > heure_debut),
  updated_at timestamptz not null default now()
);

-- Réutilise la fonction set_updated_at() existante (créée dans
-- migration-aliments-2026-08-27.sql), ne pas la recréer.
create trigger horaires_travail_exceptions_set_updated_at
  before update on horaires_travail_exceptions
  for each row execute function set_updated_at();
