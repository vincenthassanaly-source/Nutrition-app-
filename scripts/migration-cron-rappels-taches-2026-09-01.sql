-- Planifie l'appel de l'Edge Function envoyer-rappels-taches toutes les
-- minutes via pg_cron + pg_net (pg_net activée par
-- migration-taches-notifications-2026-09-01.sql).
--
-- L'URL du projet et la clé publishable (anon) sont stockées dans Supabase
-- Vault plutôt qu'en dur dans le job cron, suivant le pattern documenté par
-- Supabase (docs "Scheduling Edge Functions"). La clé publishable/anon
-- n'est pas un secret au sens strict (déjà exposée au client via
-- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) : elle est nécessaire ici pour que
-- l'appel HTTP passe la vérification JWT de la fonction (verify_jwt: true).

create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select vault.create_secret('https://vsmtkopkqasrdnjceegp.supabase.co', 'project_url');
select vault.create_secret(
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzbXRrb3BrcWFzcmRuamNlZWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MDcwOTcsImV4cCI6MjEwMzM4MzA5N30.3V6q8Wb98wOsdsI3mNuiLEXgm8VYvVS7vpBcicoErmk',
  'publishable_key'
);

select cron.schedule(
  'rappels-taches',
  '* * * * *',
  $$
  select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/envoyer-rappels-taches',
      headers := jsonb_build_object(
        'Content-type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'publishable_key')
      ),
      body := '{}'::jsonb
  ) as request_id;
  $$
);
