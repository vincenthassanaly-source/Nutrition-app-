-- Revert de migration-taches-ticktick-2026-08-30.sql.

alter table taches
  drop column if exists liste_id,
  drop column if exists notes,
  drop column if exists priorite,
  drop column if exists ordre,
  drop column if exists recurrence_frequence,
  drop column if exists recurrence_fin;

drop table if exists sous_taches;
drop table if exists taches_tags;
drop table if exists tags;
drop table if exists listes_taches;

drop type if exists priorite_tache;
