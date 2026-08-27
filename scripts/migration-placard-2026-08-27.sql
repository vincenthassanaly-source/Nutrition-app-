-- Placard : quantités d'aliments disponibles chez l'utilisateur.

create table placard (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aliment_id uuid not null references aliments(id) on delete cascade,
  quantite_disponible numeric(7,2) not null default 0 check (quantite_disponible >= 0),
  date_peremption date,
  updated_at timestamptz not null default now(),
  unique (user_id, aliment_id)
);

create index idx_placard_user_id on placard(user_id);

create trigger trg_placard_updated_at
  before update on placard
  for each row execute function set_updated_at();

alter table placard enable row level security;

create policy "placard_select" on placard for select using (user_id = auth.uid());
create policy "placard_insert" on placard for insert with check (user_id = auth.uid());
create policy "placard_update" on placard for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "placard_delete" on placard for delete using (user_id = auth.uid());
