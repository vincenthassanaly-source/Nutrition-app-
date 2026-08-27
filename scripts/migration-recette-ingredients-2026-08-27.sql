-- Ingrédients composant une recette (table de jonction recettes <-> aliments).
-- La RLS se fait par rebond sur la recette parente (pas de user_id propre).

create table recette_ingredients (
  id uuid primary key default gen_random_uuid(),
  recette_id uuid not null references recettes(id) on delete cascade,
  aliment_id uuid not null references aliments(id) on delete restrict,
  quantite numeric(7,2) not null check (quantite > 0),
  unite unite_mesure not null,
  unique (recette_id, aliment_id)
);

create index idx_recette_ingredients_recette_id on recette_ingredients(recette_id);
create index idx_recette_ingredients_aliment_id on recette_ingredients(aliment_id);

alter table recette_ingredients enable row level security;

create policy "recette_ingredients_select" on recette_ingredients for select
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id
      and (r.user_id is null or r.user_id = auth.uid())
  ));
create policy "recette_ingredients_insert" on recette_ingredients for insert
  with check (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = auth.uid()
  ));
create policy "recette_ingredients_update" on recette_ingredients for update
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = auth.uid()
  ));
create policy "recette_ingredients_delete" on recette_ingredients for delete
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = auth.uid()
  ));
