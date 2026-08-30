-- Annule scripts/migration-taches-heure-2026-08-30.sql.

alter table taches
  drop column heure;
