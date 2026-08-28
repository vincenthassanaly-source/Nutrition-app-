-- Supprime les fonctionnalités Placard et Listes de courses.
--
-- La table `aliments` est CONSERVÉE : elle est référencée par journal_repas.aliment_id
-- et recette_ingredients.aliment_id (sections Journal et Recettes, non concernées par
-- cette suppression). Seule la page de gestion du catalogue (CRUD "Aliments") est
-- retirée côté application ; aucune table ne la supporte donc rien à dropper ici.
--
-- Ordre de suppression : listes_courses_items (référence listes_courses et aliments)
-- avant listes_courses, puis placard (référence aliments uniquement), puis l'enum
-- liste_statut (utilisé uniquement par listes_courses).

drop table if exists listes_courses_items;
drop table if exists listes_courses;
drop table if exists placard;

drop type if exists liste_statut;
