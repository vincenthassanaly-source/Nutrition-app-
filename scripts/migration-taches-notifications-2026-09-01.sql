-- Étend les tâches pour supporter les événements "toute la journée" (sans
-- heure précise) et un rappel par notification push à un délai configurable
-- avant l'heure de la tâche. Ajoute aussi la table push_subscriptions pour
-- stocker les abonnements push du navigateur.
--
-- rappel_minutes n'a de sens qu'accompagné d'une heure précise : la
-- contrainte n'impose pas heure is not null ici (même logique que
-- recurrence_fin/recurrence_frequence dans taches.ts) — c'est le serveur qui
-- force heure/rappel_minutes à null quand toute_la_journee est coché.
--
-- push_subscriptions : mono-utilisateur (pas de user_id, pas de RLS, comme
-- le reste de Kilio depuis migration-suppression-auth-2026-08-29.sql), une
-- ligne par device/navigateur abonné. endpoint est unique pour permettre un
-- upsert depuis saveSubscription.
--
-- pg_net est nécessaire pour que pg_cron appelle l'Edge Function
-- envoyer-rappels-taches (cf. migration-cron-rappels-taches-2026-09-01.sql).

alter table taches
  add column toute_la_journee boolean not null default false,
  add column rappel_minutes integer null,
  add column rappel_envoye_le timestamptz null;

alter table taches
  add constraint taches_rappel_minutes_check
  check (rappel_minutes is null or rappel_minutes in (5, 15, 30));

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create extension if not exists pg_net;
