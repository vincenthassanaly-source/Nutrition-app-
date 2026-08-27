-- Objectifs nutritionnels par type de jour (lié au futur module PPL entrainement/repos).

create type jour_type_ppl as enum ('entrainement', 'repos');

create table objectifs_nutritionnels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jour_type jour_type_ppl not null default 'repos',
  kcal_cible numeric(7,2) not null check (kcal_cible >= 0),
  proteines_cible_g numeric(6,2) not null default 0 check (proteines_cible_g >= 0),
  glucides_cible_g numeric(6,2) not null default 0 check (glucides_cible_g >= 0),
  lipides_cible_g numeric(6,2) not null default 0 check (lipides_cible_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, jour_type)
);

create index idx_objectifs_nutritionnels_user_id on objectifs_nutritionnels(user_id);

create trigger trg_objectifs_nutritionnels_updated_at
  before update on objectifs_nutritionnels
  for each row execute function set_updated_at();

alter table objectifs_nutritionnels enable row level security;

create policy "objectifs_select" on objectifs_nutritionnels for select using (user_id = auth.uid());
create policy "objectifs_insert" on objectifs_nutritionnels for insert with check (user_id = auth.uid());
create policy "objectifs_update" on objectifs_nutritionnels for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "objectifs_delete" on objectifs_nutritionnels for delete using (user_id = auth.uid());
