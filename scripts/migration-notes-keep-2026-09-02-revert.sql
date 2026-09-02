-- Revert de migration-notes-keep-2026-09-02.sql.

drop table if exists notes_tags;
drop table if exists note_items;

drop index if exists idx_notes_epingle;

alter table notes
  drop column if exists epingle,
  drop column if exists couleur,
  drop column if exists type;

drop type if exists note_type;
