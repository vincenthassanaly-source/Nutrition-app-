-- Module Budget : sous-catégories (1 seul niveau) + virements entre comptes.
--
-- Appliquée en 2 migrations séparées (2 appels mcp__Supabase__apply_migration
-- distincts) : Postgres interdit d'utiliser une valeur d'enum fraîchement
-- ajoutée (`alter type ... add value`) dans la même transaction que son
-- ajout — ici le check constraint qui compare `type = 'virement'` la
-- réutilise immédiatement, d'où la séparation en 2 étapes.

-- ============================================================
-- Étape 1/2 — nouvelle valeur d'enum (à committer seule, en premier)
-- ============================================================

alter type type_mouvement add value 'virement';

-- ============================================================
-- Étape 2/2 — sous-catégories + virements (après commit de l'étape 1)
-- ============================================================

-- Sous-catégories : une catégorie peut avoir des sous-catégories, un seul
-- niveau de profondeur. `categorie_parent_id null` = catégorie principale ;
-- non-null = sous-catégorie. La contrainte "pas de sous-sous-catégorie"
-- (categorie_parent_id doit pointer vers une ligne où categorie_parent_id
-- est null) n'est pas exprimable proprement en check SQL (pas de sous-requête
-- possible dans un check constraint) : elle est validée côté Server Action
-- (cf. creerSousCategorie dans src/app/actions/categories-budget.ts).
alter table categories_budget
  add column categorie_parent_id uuid references categories_budget(id) on delete cascade;

create index idx_categories_budget_parent on categories_budget(categorie_parent_id);

-- Virements entre comptes : categorie_id devient nullable (un virement n'a
-- pas de catégorie), compte_destination_id porte le compte crédité.
alter table transactions
  add column compte_destination_id uuid
    constraint transactions_compte_destination_id_fkey
    references comptes(id) on delete cascade,
  alter column categorie_id drop not null;

create index idx_transactions_compte_destination_id on transactions(compte_destination_id);

-- Cohérence dépense/revenu (catégorie obligatoire, pas de destination) vs
-- virement (pas de catégorie, destination obligatoire et différente de la
-- source).
alter table transactions
  add constraint transactions_virement_coherence check (
    (
      type = 'virement'
      and categorie_id is null
      and compte_destination_id is not null
      and compte_destination_id <> compte_id
    )
    or
    (
      type in ('depense', 'revenu')
      and categorie_id is not null
      and compte_destination_id is null
    )
  );
