-- Module Budget : transactions récurrentes (modèles qui génèrent
-- automatiquement des transactions au fil du temps — loyer, salaire,
-- abonnements).
--
-- Pas de cron dans ce repo : la génération des occurrences dues est
-- paresseuse, déclenchée par `genererOccurrencesDues()`
-- (src/app/actions/transactions-recurrentes.ts) en tout début des Server
-- Components /budget et /budget/transactions, avant les autres lectures.

create type frequence_recurrence as enum ('quotidien', 'hebdomadaire', 'mensuel', 'annuel');

create table transactions_recurrentes (
  id uuid primary key default gen_random_uuid(),
  compte_id uuid not null
    constraint transactions_recurrentes_compte_id_fkey
    references comptes(id) on delete cascade,
  categorie_id uuid
    constraint transactions_recurrentes_categorie_id_fkey
    references categories_budget(id),
  compte_destination_id uuid
    constraint transactions_recurrentes_compte_destination_id_fkey
    references comptes(id) on delete cascade,
  montant numeric(12,2) not null check (montant > 0),
  type type_mouvement not null,
  libelle text,
  frequence frequence_recurrence not null,
  date_debut date not null,
  date_fin date,
  -- Prochaine date à générer. Initialisée à date_debut, avancée après chaque
  -- occurrence générée (cf. genererOccurrencesDues). Pas modifiable depuis
  -- l'UI d'édition : c'est un curseur interne, pas un champ utilisateur.
  prochaine_occurrence date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Même règle de cohérence dépense/revenu vs virement que `transactions`
  -- (cf. migration-budget-sous-categories-virements-2026-08-30.sql).
  constraint transactions_recurrentes_virement_coherence check (
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
  ),
  constraint transactions_recurrentes_date_fin_apres_debut check (date_fin is null or date_fin >= date_debut)
);

-- Index partiel : seules les récurrences actives sont candidates à la
-- génération paresseuse, et c'est toujours prochaine_occurrence qui est
-- comparée à aujourd'hui.
create index idx_transactions_recurrentes_actives_prochaine
  on transactions_recurrentes(prochaine_occurrence)
  where active;

create trigger trg_transactions_recurrentes_updated_at
  before update on transactions_recurrentes
  for each row execute function set_updated_at();

-- Lien transaction générée → modèle d'origine, pour badge "récurrent" dans
-- l'historique. `on delete set null` : supprimer le modèle ne supprime pas
-- les transactions déjà générées.
alter table transactions
  add column transaction_recurrente_id uuid
    constraint transactions_transaction_recurrente_id_fkey
    references transactions_recurrentes(id) on delete set null;

create index idx_transactions_transaction_recurrente_id on transactions(transaction_recurrente_id);
