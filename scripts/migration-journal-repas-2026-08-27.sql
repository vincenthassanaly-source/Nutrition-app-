-- Journal de repas quotidien (aliment OU recette, jamais les deux).

create type moment_repas as enum ('petit_dej', 'dejeuner', 'diner', 'collation');

create table journal_repas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aliment_id uuid references aliments(id) on delete cascade,
  recette_id uuid references recettes(id) on delete cascade,
  quantite numeric(7,2) not null check (quantite > 0),
  date date not null default current_date,
  moment moment_repas not null,
  created_at timestamptz not null default now(),
  constraint journal_repas_aliment_xor_recette check (
    (aliment_id is not null)::int + (recette_id is not null)::int = 1
  )
);

create index idx_journal_repas_user_id_date on journal_repas(user_id, date);

alter table journal_repas enable row level security;

create policy "journal_repas_select" on journal_repas for select using (user_id = auth.uid());
create policy "journal_repas_insert" on journal_repas for insert with check (user_id = auth.uid());
create policy "journal_repas_update" on journal_repas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "journal_repas_delete" on journal_repas for delete using (user_id = auth.uid());
