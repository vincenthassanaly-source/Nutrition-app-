-- Module Budget : finances personnelles (comptes, catégories, transactions,
-- budgets cibles par catégorie/mois).
--
-- Pas de RLS ni de user_id : l'app est strictement mono-utilisateur depuis
-- migration-suppression-auth-2026-08-29.sql, qui a désactivé la RLS sur les
-- tables existantes. comptes/categories_budget/transactions/budgets suivent
-- le même pattern (comme habitudes, objectifs et taches).

create type type_compte as enum ('courant', 'epargne', 'autre');
create type type_mouvement as enum ('depense', 'revenu');

create table comptes (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type type_compte not null default 'courant',
  solde_initial numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- set_updated_at() est déjà défini par migration-aliments-2026-08-27.sql.
create trigger trg_comptes_updated_at
  before update on comptes
  for each row execute function set_updated_at();

create table categories_budget (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  type type_mouvement not null,
  icone text,
  is_predefinie boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_categories_budget_type on categories_budget(type);

create trigger trg_categories_budget_updated_at
  before update on categories_budget
  for each row execute function set_updated_at();

create table transactions (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null references comptes(id) on delete cascade,
  categorie_id uuid not null references categories_budget(id),
  montant numeric(12,2) not null check (montant > 0),
  type type_mouvement not null,
  date_operation date not null default current_date,
  libelle text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_transactions_compte_id on transactions(compte_id, date_operation desc);
create index idx_transactions_categorie_id on transactions(categorie_id);
create index idx_transactions_date_operation on transactions(date_operation);

create trigger trg_transactions_updated_at
  before update on transactions
  for each row execute function set_updated_at();

create table budgets (
  id uuid primary key default gen_random_uuid(),
  categorie_id uuid not null references categories_budget(id) on delete cascade,
  montant_cible numeric(12,2) not null check (montant_cible >= 0),
  periode date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_categorie_periode_key unique (categorie_id, periode),
  constraint budgets_periode_premier_jour check (periode = date_trunc('month', periode)::date)
);

create index idx_budgets_periode on budgets(periode);

create trigger trg_budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();

-- Catégories prédéfinies (is_predefinie = true, non supprimables par l'app).
insert into categories_budget (nom, type, icone, is_predefinie) values
  ('Logement', 'depense', '🏠', true),
  ('Alimentation', 'depense', '🛒', true),
  ('Transport', 'depense', '🚗', true),
  ('Loisirs', 'depense', '🎉', true),
  ('Santé', 'depense', '💊', true),
  ('Abonnements', 'depense', '📱', true),
  ('Restaurants', 'depense', '🍽️', true),
  ('Shopping', 'depense', '🛍️', true),
  ('Autres dépenses', 'depense', '📦', true),
  ('Salaire', 'revenu', '💼', true),
  ('Autres revenus', 'revenu', '💰', true);
