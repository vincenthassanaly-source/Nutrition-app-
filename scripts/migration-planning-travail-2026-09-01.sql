drop table if exists horaires_travail;

create table horaires_travail_creneaux (
  id bigint generated always as identity primary key,
  jour_semaine smallint not null check (jour_semaine between 0 and 6), -- getDay() : 0 = dimanche ... 6 = samedi
  heure_debut time not null,
  heure_fin time not null check (heure_fin > heure_debut),
  frequence text not null default 'toutes_les_semaines'
    check (frequence in ('toutes_les_semaines', 'une_semaine_sur_deux')),
  semaine_reference date, -- utilisé seulement si frequence = 'une_semaine_sur_deux' :
                          -- une date quelconque tombant dans une semaine "travaillée"
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on horaires_travail_creneaux
  for each row execute function set_updated_at();

insert into horaires_travail_creneaux (jour_semaine, heure_debut, heure_fin, frequence, semaine_reference) values
  -- Mercredi, une semaine sur deux — semaine de référence "travaillée" : celle du mercredi 2 septembre 2026
  (3, '08:30', '12:00', 'une_semaine_sur_deux', '2026-09-02'),
  (3, '13:00', '17:30', 'une_semaine_sur_deux', '2026-09-02'),
  -- Jeudi, toutes les semaines
  (4, '08:30', '12:00', 'toutes_les_semaines', null),
  (4, '13:00', '19:30', 'toutes_les_semaines', null),
  -- Vendredi, toutes les semaines
  (5, '08:30', '12:00', 'toutes_les_semaines', null),
  (5, '13:00', '19:30', 'toutes_les_semaines', null),
  -- Samedi, toutes les semaines, sans coupure
  (6, '09:00', '19:30', 'toutes_les_semaines', null);
