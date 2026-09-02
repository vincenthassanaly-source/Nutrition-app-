-- Refonte du module Notes façon Google Keep : type (texte/checklist),
-- couleur, épinglage, items de checklist, tags.
--
-- Pas de RLS ni de user_id : suit le même pattern que notes
-- (migration-notes-2026-08-29.sql), mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql.
--
-- note_type est un nouvel enum (pas un ALTER TYPE ... ADD VALUE), donc
-- utilisable immédiatement dans la même transaction que sa création (même
-- raisonnement que priorite_tache dans migration-taches-ticktick-2026-08-30.sql).
--
-- couleur stocke une clé de palette pastel (ex. "sauge", "peche"...) définie
-- en TypeScript (src/lib/notes/palette.ts) plutôt qu'en enum Postgres, pour
-- rester facile à faire évoluer sans migration — même choix que
-- listes_taches.couleur et tags.couleur, déjà en text libre.
--
-- notes_tags réutilise la table tags existante (migration-taches-ticktick-
-- 2026-08-30.sql), sur le même modèle que taches_tags : pas de nouvelle
-- table de tags dédiée aux notes.

create type note_type as enum ('texte', 'checklist');

alter table notes
  add column type note_type not null default 'texte',
  add column couleur text,
  add column epingle boolean not null default false;

create index idx_notes_epingle on notes(epingle);

create table note_items (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  libelle text not null,
  coche boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_note_items_note_id on note_items(note_id, position);

create trigger trg_note_items_updated_at
  before update on note_items
  for each row execute function set_updated_at();

create table notes_tags (
  note_id uuid not null references notes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create index idx_notes_tags_tag_id on notes_tags(tag_id);
