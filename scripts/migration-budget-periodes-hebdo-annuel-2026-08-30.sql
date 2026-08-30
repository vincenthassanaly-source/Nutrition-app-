-- Module Budget : budgets cibles hebdomadaires et annuels, en plus du mensuel
-- existant, simultanément actifs sur une même catégorie.

create type type_periode_budget as enum ('hebdomadaire', 'mensuel', 'annuel');

alter table budgets
  add column type_periode type_periode_budget not null default 'mensuel';

-- Remplace la contrainte "premier jour du mois" par une contrainte qui valide
-- `periode` selon `type_periode` : premier jour de la semaine ISO (lundi,
-- date_trunc('week', ...) le confirme — vérifié en Phase 1 via execute_sql)
-- pour l'hebdo, premier jour du mois (inchangé) pour le mensuel, 1er janvier
-- pour l'annuel.
alter table budgets drop constraint budgets_periode_premier_jour;

alter table budgets add constraint budgets_periode_calee check (
  case type_periode
    when 'hebdomadaire' then periode = date_trunc('week', periode)::date
    when 'mensuel' then periode = date_trunc('month', periode)::date
    when 'annuel' then periode = date_trunc('year', periode)::date
  end
);

-- Une catégorie peut désormais avoir un budget hebdo ET mensuel ET annuel
-- actifs en parallèle, sur des périodes qui se recouvrent forcément (c'est
-- le but) : la clé unique porte sur les 3 colonnes, plus seulement 2.
alter table budgets drop constraint budgets_categorie_periode_key;
alter table budgets add constraint budgets_categorie_periode_type_key
  unique (categorie_id, periode, type_periode);

-- Aucune ligne existante en base au moment de cette migration (vérifié en
-- Phase 1) : le `default 'mensuel'` sur la nouvelle colonne suffit, pas
-- besoin d'un update explicite des lignes préexistantes.
