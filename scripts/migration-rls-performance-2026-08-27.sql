-- Optimisation des policies RLS (auth.uid() -> (select auth.uid()) pour éviter une
-- réévaluation par ligne, cf. Supabase Performance Advisors) et ajout des index
-- manquants sur les FK aliment_id, détectés après l'étape 5.

-- Index manquants
create index if not exists idx_journal_repas_aliment_id on journal_repas(aliment_id);
create index if not exists idx_journal_repas_recette_id on journal_repas(recette_id);
create index if not exists idx_listes_courses_items_aliment_id on listes_courses_items(aliment_id);
create index if not exists idx_placard_aliment_id on placard(aliment_id);

-- aliments
drop policy if exists "aliments_select" on aliments;
drop policy if exists "aliments_insert" on aliments;
drop policy if exists "aliments_update" on aliments;
drop policy if exists "aliments_delete" on aliments;

create policy "aliments_select" on aliments for select
  using (user_id is null or user_id = (select auth.uid()));
create policy "aliments_insert" on aliments for insert
  with check (user_id = (select auth.uid()));
create policy "aliments_update" on aliments for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "aliments_delete" on aliments for delete
  using (user_id = (select auth.uid()));

-- recettes
drop policy if exists "recettes_select" on recettes;
drop policy if exists "recettes_insert" on recettes;
drop policy if exists "recettes_update" on recettes;
drop policy if exists "recettes_delete" on recettes;

create policy "recettes_select" on recettes for select
  using (user_id is null or user_id = (select auth.uid()));
create policy "recettes_insert" on recettes for insert
  with check (user_id = (select auth.uid()));
create policy "recettes_update" on recettes for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "recettes_delete" on recettes for delete
  using (user_id = (select auth.uid()));

-- recette_ingredients
drop policy if exists "recette_ingredients_select" on recette_ingredients;
drop policy if exists "recette_ingredients_insert" on recette_ingredients;
drop policy if exists "recette_ingredients_update" on recette_ingredients;
drop policy if exists "recette_ingredients_delete" on recette_ingredients;

create policy "recette_ingredients_select" on recette_ingredients for select
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id
      and (r.user_id is null or r.user_id = (select auth.uid()))
  ));
create policy "recette_ingredients_insert" on recette_ingredients for insert
  with check (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = (select auth.uid())
  ));
create policy "recette_ingredients_update" on recette_ingredients for update
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = (select auth.uid())
  ));
create policy "recette_ingredients_delete" on recette_ingredients for delete
  using (exists (
    select 1 from recettes r
    where r.id = recette_ingredients.recette_id and r.user_id = (select auth.uid())
  ));

-- placard
drop policy if exists "placard_select" on placard;
drop policy if exists "placard_insert" on placard;
drop policy if exists "placard_update" on placard;
drop policy if exists "placard_delete" on placard;

create policy "placard_select" on placard for select using (user_id = (select auth.uid()));
create policy "placard_insert" on placard for insert with check (user_id = (select auth.uid()));
create policy "placard_update" on placard for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "placard_delete" on placard for delete using (user_id = (select auth.uid()));

-- listes_courses
drop policy if exists "listes_courses_select" on listes_courses;
drop policy if exists "listes_courses_insert" on listes_courses;
drop policy if exists "listes_courses_update" on listes_courses;
drop policy if exists "listes_courses_delete" on listes_courses;

create policy "listes_courses_select" on listes_courses for select using (user_id = (select auth.uid()));
create policy "listes_courses_insert" on listes_courses for insert with check (user_id = (select auth.uid()));
create policy "listes_courses_update" on listes_courses for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "listes_courses_delete" on listes_courses for delete using (user_id = (select auth.uid()));

-- listes_courses_items
drop policy if exists "listes_courses_items_select" on listes_courses_items;
drop policy if exists "listes_courses_items_insert" on listes_courses_items;
drop policy if exists "listes_courses_items_update" on listes_courses_items;
drop policy if exists "listes_courses_items_delete" on listes_courses_items;

create policy "listes_courses_items_select" on listes_courses_items for select
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = (select auth.uid())));
create policy "listes_courses_items_insert" on listes_courses_items for insert
  with check (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = (select auth.uid())));
create policy "listes_courses_items_update" on listes_courses_items for update
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = (select auth.uid())));
create policy "listes_courses_items_delete" on listes_courses_items for delete
  using (exists (select 1 from listes_courses l where l.id = listes_courses_items.liste_id and l.user_id = (select auth.uid())));

-- objectifs_nutritionnels
drop policy if exists "objectifs_select" on objectifs_nutritionnels;
drop policy if exists "objectifs_insert" on objectifs_nutritionnels;
drop policy if exists "objectifs_update" on objectifs_nutritionnels;
drop policy if exists "objectifs_delete" on objectifs_nutritionnels;

create policy "objectifs_select" on objectifs_nutritionnels for select using (user_id = (select auth.uid()));
create policy "objectifs_insert" on objectifs_nutritionnels for insert with check (user_id = (select auth.uid()));
create policy "objectifs_update" on objectifs_nutritionnels for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "objectifs_delete" on objectifs_nutritionnels for delete using (user_id = (select auth.uid()));

-- journal_repas
drop policy if exists "journal_repas_select" on journal_repas;
drop policy if exists "journal_repas_insert" on journal_repas;
drop policy if exists "journal_repas_update" on journal_repas;
drop policy if exists "journal_repas_delete" on journal_repas;

create policy "journal_repas_select" on journal_repas for select using (user_id = (select auth.uid()));
create policy "journal_repas_insert" on journal_repas for insert with check (user_id = (select auth.uid()));
create policy "journal_repas_update" on journal_repas for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "journal_repas_delete" on journal_repas for delete using (user_id = (select auth.uid()));
