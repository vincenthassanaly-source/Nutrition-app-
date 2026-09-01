-- Revert de migration-taches-notifications-2026-09-01.sql.
--
-- pg_net n'est pas désactivée ici : la migration de cron
-- (migration-cron-rappels-taches-2026-09-01.sql) en dépend aussi et sa
-- propre revert s'en charge si besoin.

drop table if exists push_subscriptions;

alter table taches
  drop constraint if exists taches_rappel_minutes_check;

alter table taches
  drop column if exists toute_la_journee,
  drop column if exists rappel_minutes,
  drop column if exists rappel_envoye_le;
