-- Nouveau module Collection (façon Raindrop) : collections de photos, plus
-- réception via Web Share Target (partage natif Android).
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql. Même pattern que notes/taches.
-- set_updated_at() déjà créée dans migration-aliments-2026-08-27.sql,
-- réutilisée ici sans redéfinition.

create table collections (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references collections(id) on delete cascade,
  url text not null,
  titre text,
  ordre int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_collection_items_collection_id on collection_items(collection_id, ordre);

create trigger trg_collections_updated_at
  before update on collections
  for each row execute function set_updated_at();

create trigger trg_collection_items_updated_at
  before update on collection_items
  for each row execute function set_updated_at();

-- Storage : bucket public 'collection-images', policies permissives scopées
-- au bucket (même pattern que tache-images, cf.
-- migration-tache-images-2026-09-01.sql). Les photos partagées via Web Share
-- Target sont uploadées avant d'être rattachées à une collection : le chemin
-- de stockage n'est donc pas préfixé par un id de collection.

insert into storage.buckets (id, name, public)
values ('collection-images', 'collection-images', true);

create policy "collection_images_select"
  on storage.objects for select
  using (bucket_id = 'collection-images');

create policy "collection_images_insert"
  on storage.objects for insert
  with check (bucket_id = 'collection-images');

create policy "collection_images_delete"
  on storage.objects for delete
  using (bucket_id = 'collection-images');
