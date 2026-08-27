-- Recettes. Même logique de partage que les aliments :
-- user_id NULL = recette globale/partagée, user_id défini = recette personnelle.

create type recette_source as enum ('manuel', 'hellofresh');

create table recettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  nom text not null,
  description text,
  temps_prepa_min integer check (temps_prepa_min >= 0),
  portions integer not null default 1 check (portions > 0),
  source recette_source not null default 'manuel',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_recettes_user_id on recettes(user_id);

create trigger trg_recettes_updated_at
  before update on recettes
  for each row execute function set_updated_at();

alter table recettes enable row level security;

create policy "recettes_select" on recettes for select
  using (user_id is null or user_id = auth.uid());
create policy "recettes_insert" on recettes for insert
  with check (user_id = auth.uid());
create policy "recettes_update" on recettes for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "recettes_delete" on recettes for delete
  using (user_id = auth.uid());
