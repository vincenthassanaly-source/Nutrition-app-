-- Table de référence des aliments (base nutritionnelle).
-- user_id NULL  = aliment global/partagé (catalogue de référence, seedé via service_role)
-- user_id défini = aliment personnel, visible et modifiable uniquement par son créateur

create extension if not exists "pgcrypto";

create type unite_mesure as enum ('g', 'ml', 'piece');

create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table aliments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nom text not null,
  categorie text,
  unite unite_mesure not null default 'g',
  kcal_100g numeric(7,2) not null check (kcal_100g >= 0),
  proteines_100g numeric(6,2) not null default 0 check (proteines_100g >= 0),
  glucides_100g numeric(6,2) not null default 0 check (glucides_100g >= 0),
  lipides_100g numeric(6,2) not null default 0 check (lipides_100g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_aliments_user_id on aliments(user_id);
create index idx_aliments_nom on aliments using gin (to_tsvector('french', nom));

create trigger trg_aliments_updated_at
  before update on aliments
  for each row execute function set_updated_at();

alter table aliments enable row level security;

create policy "aliments_select" on aliments for select
  using (user_id is null or user_id = auth.uid());
create policy "aliments_insert" on aliments for insert
  with check (user_id = auth.uid());
create policy "aliments_update" on aliments for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "aliments_delete" on aliments for delete
  using (user_id = auth.uid());
