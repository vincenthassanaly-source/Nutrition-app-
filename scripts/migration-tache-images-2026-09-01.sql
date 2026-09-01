-- Ajout d'images sur les tâches (module Tâches). Première utilisation de
-- Supabase Storage dans Kilio : pas de pattern existant à reproduire.
--
-- storage.objects a RLS activée par défaut chez Supabase (contrairement aux
-- tables applicatives du projet, qui n'ont pas de RLS depuis
-- migration-suppression-auth-2026-08-29.sql) : policies permissives scopées
-- au bucket 'tache-images', cohérentes avec le modèle mono-utilisateur sans
-- auth du reste de Kilio.
--
-- tache_images suit le même pattern que sous_taches : pas de RLS, pas de
-- user_id, cascade sur suppression de la tâche.

insert into storage.buckets (id, name, public)
values ('tache-images', 'tache-images', true);

create policy "tache_images_select"
  on storage.objects for select
  using (bucket_id = 'tache-images');

create policy "tache_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'tache-images');

create policy "tache_images_delete"
  on storage.objects for delete
  using (bucket_id = 'tache-images');

create table tache_images (
  id uuid primary key default gen_random_uuid(),
  tache_id uuid not null references taches(id) on delete cascade,
  url text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_tache_images_tache_id on tache_images(tache_id, ordre);
