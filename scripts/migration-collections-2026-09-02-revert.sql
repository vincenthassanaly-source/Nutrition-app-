-- Revert de migration-collections-2026-09-02.sql.

drop table if exists collection_items;
drop table if exists collections;

drop policy if exists "collection_images_select" on storage.objects;
drop policy if exists "collection_images_insert" on storage.objects;
drop policy if exists "collection_images_delete" on storage.objects;

delete from storage.buckets where id = 'collection-images';
