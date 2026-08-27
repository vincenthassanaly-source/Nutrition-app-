-- Articles d'une liste de courses (aliments fusionnés par quantité, avec case à cocher).

create table listes_courses_items (
  id uuid primary key default gen_random_uuid(),
  liste_id uuid not null references listes_courses(id) on delete cascade,
  aliment_id uuid not null references aliments(id) on delete restrict,
  quantite_totale numeric(7,2) not null check (quantite_totale >= 0),
  unite unite_mesure not null,
  coche boolean not null default false,
  unique (liste_id, aliment_id)
);

create index idx_listes_courses_items_liste_id on listes_courses_items(liste_id);

alter table listes_courses_items enable row level security;

create policy "listes_courses_items_select" on listes_courses_items for select
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = auth.uid()));
create policy "listes_courses_items_insert" on listes_courses_items for insert
  with check (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = auth.uid()));
create policy "listes_courses_items_update" on listes_courses_items for update
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = auth.uid()))
  with check (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = auth.uid()));
create policy "listes_courses_items_delete" on listes_courses_items for delete
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = auth.uid()));
