-- Suppression complète de l'authentification (app strictement mono-utilisateur).
--
-- Périmètre : journal_repas, recettes, objectifs_nutritionnels, recette_ingredients,
-- ainsi que aliments. Cette dernière n'était pas prévue au périmètre initial, mais
-- l'exploration a montré qu'elle a aussi un user_id + RLS actives (et que toutes ses
-- lignes ont déjà été rattachées au compte unique par la migration
-- migration-oeuf-dur-et-catalogue-personnel-2026-08-27.sql) : sans son inclusion ici,
-- toute requête sur aliments — et donc le journal, les macros de recettes et le
-- sélecteur d'ingrédients qui l'embarquent — reviendrait vide une fois auth.uid()
-- toujours nul.

-- 1. Policies RLS
drop policy if exists "aliments_select" on aliments;
drop policy if exists "aliments_insert" on aliments;
drop policy if exists "aliments_update" on aliments;
drop policy if exists "aliments_delete" on aliments;

drop policy if exists "recettes_select" on recettes;
drop policy if exists "recettes_insert" on recettes;
drop policy if exists "recettes_update" on recettes;
drop policy if exists "recettes_delete" on recettes;

drop policy if exists "recette_ingredients_select" on recette_ingredients;
drop policy if exists "recette_ingredients_insert" on recette_ingredients;
drop policy if exists "recette_ingredients_update" on recette_ingredients;
drop policy if exists "recette_ingredients_delete" on recette_ingredients;

drop policy if exists "objectifs_select" on objectifs_nutritionnels;
drop policy if exists "objectifs_insert" on objectifs_nutritionnels;
drop policy if exists "objectifs_update" on objectifs_nutritionnels;
drop policy if exists "objectifs_delete" on objectifs_nutritionnels;

drop policy if exists "journal_repas_select" on journal_repas;
drop policy if exists "journal_repas_insert" on journal_repas;
drop policy if exists "journal_repas_update" on journal_repas;
drop policy if exists "journal_repas_delete" on journal_repas;

-- 2. Désactivation de la RLS (accès direct via la clé publishable, un seul utilisateur)
alter table aliments disable row level security;
alter table recettes disable row level security;
alter table recette_ingredients disable row level security;
alter table objectifs_nutritionnels disable row level security;
alter table journal_repas disable row level security;

-- 3. Contrainte UNIQUE(user_id, jour_type) -> UNIQUE(jour_type), avant de dropper la colonne
alter table objectifs_nutritionnels drop constraint if exists objectifs_nutritionnels_user_id_jour_type_key;
alter table objectifs_nutritionnels add constraint objectifs_nutritionnels_jour_type_key unique (jour_type);

-- 4. Suppression des colonnes user_id
alter table aliments drop column if exists user_id;
alter table recettes drop column if exists user_id;
alter table objectifs_nutritionnels drop column if exists user_id;
alter table journal_repas drop column if exists user_id;

-- recette_ingredients n'a pas de user_id propre (RLS par rebond sur recettes,
-- déjà traitée ci-dessus) : rien à dropper ici.

-- 5. Index devenus inutiles (remplacés par des index sans user_id là où ça reste pertinent)
drop index if exists idx_aliments_user_id;
drop index if exists idx_recettes_user_id;
drop index if exists idx_objectifs_nutritionnels_user_id;
drop index if exists idx_journal_repas_user_id_date;

create index if not exists idx_journal_repas_date on journal_repas(date);

-- Les tables Supabase Auth internes (auth.users) ne sont pas touchées : elles ne
-- sont simplement plus référencées par le schéma applicatif.
