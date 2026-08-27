-- Listes de courses (en-tête).

create type liste_statut as enum ('en_cours', 'terminee');

create table listes_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nom text not null default 'Liste de courses',
  statut liste_statut not null default 'en_cours',
  created_at timestamptz not null default now()
);

create index idx_listes_courses_user_id on listes_courses(user_id);

alter table listes_courses enable row level security;

create policy "listes_courses_select" on listes_courses for select using (user_id = auth.uid());
create policy "listes_courses_insert" on listes_courses for insert with check (user_id = auth.uid());
create policy "listes_courses_update" on listes_courses for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "listes_courses_delete" on listes_courses for delete using (user_id = auth.uid());
