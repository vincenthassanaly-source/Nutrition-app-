-- Courses (liste de courses à ajout manuel libre), indépendante de
-- Nutrition/Notes/Tâches : pas de lien avec aliments/recettes (pas de fusion
-- de quantités, pas de génération depuis une recette).
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql. courses_items suit le même
-- pattern que notes/taches (table plate, trigger updated_at).
--
-- L'ancienne listes_courses (liée à aliments, avec user_id/RLS) a été
-- supprimée par migration-suppression-aliments-placard-courses-2026-08-28.sql
-- et n'est volontairement pas reconstruite : pas de table d'en-tête type
-- listes_courses, une seule liste continue comme Tâches/Notes.

create table courses_items (
  id uuid primary key default gen_random_uuid(),
  libelle text not null,
  coche boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index composite couvrant le tri de la page (non cochés d'abord, puis plus récents).
create index idx_courses_items_coche_created_at on courses_items(coche, created_at desc);

create trigger trg_courses_items_updated_at
  before update on courses_items
  for each row execute function set_updated_at();
