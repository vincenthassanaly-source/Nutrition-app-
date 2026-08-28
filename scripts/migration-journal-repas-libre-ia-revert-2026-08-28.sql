-- Annule scripts/migration-journal-repas-libre-ia-2026-08-28.sql.
-- La fonctionnalité "Décrire un repas (IA)" est retirée : elle dépend d'une
-- clé API Claude payante que l'utilisateur ne souhaite pas configurer pour
-- l'instant. Restaure journal_repas à son état précédent (aliment_id XOR
-- recette_id, quantite obligatoire).
--
-- On garde la migration originale en historique plutôt que de la réécrire :
-- ce fichier l'annule explicitement (pas de ligne "libre" n'a jamais été
-- utilisée en production, quantite est déjà null sur 0 ligne).

alter table journal_repas
  drop constraint journal_repas_libre_champs_requis;

alter table journal_repas
  drop constraint journal_repas_quantite_requise;

alter table journal_repas
  drop constraint journal_repas_source_xor;

alter table journal_repas
  add constraint journal_repas_aliment_xor_recette check (
    (aliment_id is not null)::int + (recette_id is not null)::int = 1
  );

alter table journal_repas
  alter column quantite set not null;

alter table journal_repas
  drop column description,
  drop column kcal,
  drop column proteines_g,
  drop column glucides_g,
  drop column lipides_g,
  drop column source;
