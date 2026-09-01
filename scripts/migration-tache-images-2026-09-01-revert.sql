-- Revert de migration-tache-images-2026-09-01.sql.

drop table if exists tache_images;

drop policy if exists "tache_images_select" on storage.objects;
drop policy if exists "tache_images_insert" on storage.objects;
drop policy if exists "tache_images_delete" on storage.objects;

delete from storage.buckets where id = 'tache-images';
