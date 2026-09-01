-- Revert de migration-cron-rappels-taches-2026-09-01.sql.

select cron.unschedule('rappels-taches');

delete from vault.secrets where name in ('project_url', 'publishable_key');

drop extension if exists pg_cron;
