-- Ajoute une troisième façon de logger un repas dans journal_repas : la
-- saisie en texte libre ("riz + poulet + avocat"), dont les macros sont
-- estimées par l'IA puis validées/ajustées par l'utilisateur avant
-- enregistrement (voir src/app/actions/journal-ia.ts et addJournalEntryLibre
-- dans src/app/actions/journal.ts).
--
-- Décision de schéma : on étend journal_repas plutôt que de créer une table
-- séparée. Ces entrées doivent apparaître dans le même flux que les entrées
-- aliment/recette existantes (regroupement par moment dans "Repas du jour",
-- somme des macros dans "Résumé du jour"), qui repose entièrement sur une
-- lecture de journal_repas par date. Fragmenter en une deuxième table
-- obligerait à fusionner deux sources à chaque lecture du journal pour un
-- bénéfice schématique limité.
--
-- Une entrée "libre" n'a pas d'aliment_id/recette_id : ses macros sont déjà
-- le total du repas décrit (pas une valeur "pour 100g" à multiplier par une
-- quantité), donc `quantite` n'a pas de sens pour elle et devient nullable.
--
-- `source` distingue si les valeurs enregistrées sont telles que proposées
-- par l'IA ("ia") ou si l'utilisateur les a modifiées avant validation
-- ("manuel") ; les entrées aliment/recette existantes sont classées
-- "manuel" par défaut (saisie structurée par l'utilisateur).

alter table journal_repas
  add column description text,
  add column kcal numeric(7,2) check (kcal >= 0),
  add column proteines_g numeric(6,2) check (proteines_g >= 0),
  add column glucides_g numeric(6,2) check (glucides_g >= 0),
  add column lipides_g numeric(6,2) check (lipides_g >= 0),
  add column source text not null default 'manuel' check (source in ('ia', 'manuel'));

alter table journal_repas
  alter column quantite drop not null;

alter table journal_repas
  drop constraint journal_repas_aliment_xor_recette;

-- Exactement une des trois sources de macros doit être renseignée par ligne.
alter table journal_repas
  add constraint journal_repas_source_xor check (
    (aliment_id is not null)::int + (recette_id is not null)::int + (kcal is not null)::int = 1
  );

-- quantite est requise pour aliment_id/recette_id, absente pour une entrée libre.
alter table journal_repas
  add constraint journal_repas_quantite_requise check (
    (quantite is not null) = (aliment_id is not null or recette_id is not null)
  );

-- Une entrée libre doit avoir sa description et ses 4 macros toutes renseignées ensemble.
alter table journal_repas
  add constraint journal_repas_libre_champs_requis check (
    (kcal is not null) =
    (description is not null and proteines_g is not null and glucides_g is not null and lipides_g is not null)
  );
