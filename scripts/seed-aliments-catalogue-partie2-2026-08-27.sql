-- Catalogue de référence, partie 2 : aliments partagés (user_id NULL).
-- À exécuter avec le rôle service_role (bypass RLS), après
-- scripts/migration-aliments-macros-detaillees-2026-08-27.sql.
-- Valeurs pour 100 g, sources Ciqual (ANSES) en priorité, USDA FoodData
-- Central sinon (voir commentaire sur chaque ligne). Aliments par défaut
-- sous forme cuite/prête à consommer sauf mention contraire.

insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g)
values
  -- Ciqual: "Boeuf, steak haché 15% MG, cuit"
  ('Bœuf haché 15% (cuit)', 'Protéines', 'g', 215, 23.6, 0, 0, 13.0, 5.5, 0, 0.20),
  -- Ciqual: "Boeuf, entrecôte, grillée"
  ('Entrecôte (grillée)', 'Protéines', 'g', 209, 27.0, 0, 0, 11.0, 4.5, 0, 0.15),
  -- Ciqual: "Boeuf, filet, grillé"
  ('Filet de bœuf (cuit)', 'Protéines', 'g', 172, 29.0, 0, 0, 6.0, 2.4, 0, 0.13),
  -- Ciqual: "Veau, escalope, cuite"
  ('Escalope de veau (cuite)', 'Protéines', 'g', 172, 31.0, 0, 0, 5.0, 2.0, 0, 0.19),
  -- Ciqual: "Porc, filet mignon, rôti"
  ('Filet de porc (cuit)', 'Protéines', 'g', 143, 28.0, 0, 0, 3.0, 1.0, 0, 0.15),
  -- Ciqual: "Lapin, cuit"
  ('Lapin (cuit)', 'Protéines', 'g', 178, 29.0, 0, 0, 7.0, 2.5, 0, 0.10),
  -- Ciqual: "Poulet, cuisse, rôtie"
  ('Poulet cuisse (rôtie)', 'Protéines', 'g', 197, 26.0, 0, 0, 10.0, 2.8, 0, 0.20),
  -- Ciqual: "Dinde, hachée, cuite"
  ('Dinde hachée (cuite)', 'Protéines', 'g', 160, 24.0, 0, 0, 7.0, 2.0, 0, 0.20),
  -- Ciqual: "Canard, magret, grillé/poêlé"
  ('Magret de canard (cuit)', 'Protéines', 'g', 190, 25.0, 0, 0, 10.0, 3.3, 0, 0.20),
  -- Ciqual: "Merguez, boeuf et mouton, cuite"
  ('Merguez (cuite)', 'Protéines', 'g', 290, 18.0, 2.0, 0.5, 24.0, 10.0, 0.3, 1.90),
  -- Ciqual: "Chorizo"
  ('Chorizo', 'Protéines', 'g', 455, 24.0, 2.0, 0.5, 38.0, 14.0, 0, 3.00),
  -- Ciqual: "Bacon, cuit ou grillé"
  ('Bacon (cuit)', 'Protéines', 'g', 300, 26.0, 0.5, 0, 22.0, 7.5, 0, 2.20),
  -- Ciqual: "Lardon fumé, cuit"
  ('Lardons fumés (cuits)', 'Protéines', 'g', 280, 22.0, 0.5, 0, 22.0, 8.0, 0, 1.80),
  -- Ciqual: "Crevette, cuite"
  ('Crevettes (cuites)', 'Protéines', 'g', 99, 21.0, 0.5, 0, 1.0, 0.2, 0, 1.20),
  -- Ciqual: "Moule, cuite"
  ('Moules (cuites)', 'Protéines', 'g', 90, 14.0, 3.4, 0, 2.5, 0.5, 0, 0.60),
  -- Ciqual: "Calmar ou calamar ou encornet, cuit"
  ('Calamars (cuits)', 'Protéines', 'g', 100, 18.0, 3.2, 0, 1.5, 0.3, 0, 0.35),
  -- Ciqual: "Sardine, à l'huile, égouttée"
  ('Sardines (à l''huile, égouttées)', 'Protéines', 'g', 208, 24.0, 0, 0, 12.0, 2.5, 0, 0.65),
  -- Ciqual: "Maquereau, cuit"
  ('Maquereau (cuit)', 'Protéines', 'g', 205, 19.0, 0, 0, 14.0, 3.0, 0, 0.25),
  -- Ciqual: "Thon, grillé"
  ('Thon frais (cuit)', 'Protéines', 'g', 184, 29.0, 0, 0, 6.0, 1.7, 0, 0.10),
  -- Ciqual: "Colin ou merlu, cuit"
  ('Colin (cuit)', 'Protéines', 'g', 90, 19.0, 0, 0, 1.3, 0.3, 0, 0.25),
  -- Ciqual: "Dorade, cuite"
  ('Dorade (cuite)', 'Protéines', 'g', 130, 20.0, 0, 0, 5.0, 1.0, 0, 0.15),
  -- Ciqual: "Oeuf de caille, cru"
  ('Œuf de caille (cru)', 'Protéines', 'g', 154, 13.0, 0.4, 0.4, 11.0, 3.6, 0, 0.40),

  -- Ciqual: "Riz, complet, cuit"
  ('Riz complet (cuit)', 'Féculents / céréales', 'g', 123, 2.7, 25.6, 0.2, 1.0, 0.2, 1.8, 0.01),
  -- Ciqual: "Riz sauvage, cuit, non salé"
  ('Riz sauvage (cuit)', 'Féculents / céréales', 'g', 102, 4.0, 21.0, 0.7, 0.3, 0.05, 1.8, 0.01),
  -- Pâtes de riz/maïs sans gluten, cuites (moyenne)
  ('Pâtes sans gluten (cuites)', 'Féculents / céréales', 'g', 130, 2.5, 28.0, 0.3, 0.5, 0.1, 1.0, 0.01),
  -- Ciqual: "Gnocchi à la pomme de terre, cuit"
  ('Gnocchi (cuits)', 'Féculents / céréales', 'g', 150, 3.3, 30.0, 0.5, 0.5, 0.1, 1.5, 0.50),
  -- Ciqual: "Polenta, cuite"
  ('Polenta (cuite)', 'Féculents / céréales', 'g', 70, 1.7, 14.0, 0.1, 0.4, 0.1, 0.9, 0.30),
  -- Ciqual: "Sarrasin, cuit"
  ('Sarrasin (cuit)', 'Féculents / céréales', 'g', 92, 3.4, 19.9, 0.9, 0.6, 0.1, 2.7, 0.01),
  -- Ciqual: "Épeautre, cuit"
  ('Épeautre (cuit)', 'Féculents / céréales', 'g', 127, 5.5, 26.0, 0.7, 0.9, 0.2, 3.7, 0.01),
  -- Ciqual: "Orge, perlé, cuit"
  ('Orge perlé (cuit)', 'Féculents / céréales', 'g', 123, 2.3, 28.2, 0.4, 0.4, 0.1, 3.8, 0.01),
  -- Ciqual: "Millet, cuit"
  ('Millet (cuit)', 'Féculents / céréales', 'g', 119, 3.5, 23.7, 0.2, 1.0, 0.2, 1.3, 0.01),
  -- Type Ciqual "Pain complet ou intégral" enrichi en graines
  ('Pain complet aux céréales', 'Féculents / céréales', 'g', 250, 9.5, 42.0, 4.0, 4.5, 0.7, 7.0, 1.05),
  -- Ciqual: "Pain de seigle"
  ('Pain de seigle', 'Féculents / céréales', 'g', 220, 6.5, 44.0, 2.5, 1.2, 0.2, 5.8, 1.20),
  -- Moyenne des pains sans gluten du commerce
  ('Pain sans gluten', 'Féculents / céréales', 'g', 250, 4.0, 50.0, 3.0, 3.0, 0.5, 3.0, 1.10),
  -- Ciqual: "Tortilla souple (à garnir), à base de blé"
  ('Tortilla de blé', 'Féculents / céréales', 'g', 320, 8.0, 53.0, 2.0, 7.5, 1.0, 2.5, 1.20),
  -- Ciqual: "Galette de riz soufflé complet"
  ('Galette de riz', 'Féculents / céréales', 'g', 380, 7.7, 81.0, 0.5, 2.8, 0.5, 2.9, 0.20),
  -- Moyenne des crackers/biscuits apéritifs complets du commerce
  ('Crackers complets', 'Féculents / céréales', 'g', 440, 10.0, 65.0, 3.0, 15.0, 2.0, 8.0, 1.50),

  -- Ciqual: "Fève, cuite"
  ('Fèves (cuites)', 'Légumineuses', 'g', 61, 5.6, 8.0, 1.0, 0.6, 0.1, 5.6, 0.01),
  -- Ciqual: "Pois cassé, cuit"
  ('Pois cassés (cuits)', 'Légumineuses', 'g', 118, 8.3, 20.0, 2.0, 0.4, 0.1, 8.3, 0.01),
  -- USDA FoodData Central: "Edamame, cooked"
  ('Edamame (cuits)', 'Légumineuses', 'g', 121, 11.0, 10.0, 2.0, 5.0, 0.6, 5.0, 0.01),
  -- Ciqual/USDA: "Haricot noir, cuit"
  ('Haricots noirs (cuits)', 'Légumineuses', 'g', 132, 8.9, 24.0, 0.3, 0.5, 0.1, 8.7, 0.01),
  -- Ciqual: "Haricot flageolet, cuit"
  ('Flageolets (cuits)', 'Légumineuses', 'g', 84, 6.8, 13.0, 0.5, 0.5, 0.1, 5.5, 0.02),

  -- Ciqual: "Poire, pulpe et peau, crue"
  ('Poire', 'Fruits', 'g', 55, 0.3, 12.4, 10.0, 0.2, 0.02, 3.1, 0),
  -- Ciqual: "Pêche, pulpe et peau, crue"
  ('Pêche', 'Fruits', 'g', 42, 0.8, 7.6, 7.0, 0.1, 0.01, 1.5, 0),
  -- Ciqual: "Abricot, pulpe et peau, cru"
  ('Abricot', 'Fruits', 'g', 46, 1.1, 8.5, 8.0, 0.3, 0.02, 1.7, 0),
  -- Ciqual: "Prune, pulpe et peau, crue"
  ('Prune', 'Fruits', 'g', 46, 0.6, 9.9, 9.0, 0.3, 0.02, 1.9, 0),
  -- Ciqual: "Cerise, pulpe et peau, crue"
  ('Cerise', 'Fruits', 'g', 63, 1.0, 14.0, 13.0, 0.3, 0.02, 1.6, 0),
  -- Ciqual: "Pastèque, pulpe, crue"
  ('Pastèque', 'Fruits', 'g', 39, 0.6, 8.0, 7.0, 0.2, 0.02, 0.3, 0),
  -- Ciqual: "Melon, pulpe, cru"
  ('Melon', 'Fruits', 'g', 34, 0.8, 7.6, 7.0, 0.2, 0.02, 0.6, 0),
  -- Ciqual: "Mangue, pulpe, crue"
  ('Mangue', 'Fruits', 'g', 60, 0.6, 13.8, 13.0, 0.4, 0.02, 1.9, 0),
  -- Ciqual: "Papaye, pulpe, crue"
  ('Papaye', 'Fruits', 'g', 42, 0.6, 9.0, 8.0, 0.1, 0.01, 1.9, 0),
  -- Ciqual: "Fruit de la passion, pulpe et graines, cru"
  ('Fruit de la passion', 'Fruits', 'g', 97, 2.2, 23.4, 11.0, 0.7, 0.05, 10.4, 0.02),
  -- Ciqual: "Citron, pulpe, cru"
  ('Citron', 'Fruits', 'g', 29, 0.7, 3.2, 2.5, 0.3, 0.02, 3.7, 0),
  -- Ciqual: "Citron vert (lime), pulpe, cru"
  ('Citron vert', 'Fruits', 'g', 30, 0.7, 3.0, 1.7, 0.2, 0.02, 2.8, 0),
  -- Ciqual: "Pamplemousse, pulpe, cru"
  ('Pamplemousse', 'Fruits', 'g', 42, 0.8, 10.7, 7.0, 0.1, 0.01, 1.6, 0),
  -- Ciqual: "Figue, fraîche, crue"
  ('Figue', 'Fruits', 'g', 69, 0.8, 16.0, 16.0, 0.3, 0.02, 2.5, 0),
  -- Ciqual: "Datte, sèche"
  ('Datte', 'Fruits', 'g', 282, 2.5, 70.0, 63.0, 0.4, 0.03, 8.0, 0.01),
  -- Ciqual: "Pruneau, sec"
  ('Pruneau', 'Fruits', 'g', 253, 2.3, 65.0, 38.0, 0.5, 0.03, 7.0, 0.01),
  -- Ciqual: "Framboise, crue"
  ('Framboise', 'Fruits', 'g', 49, 1.2, 5.0, 4.5, 0.6, 0.02, 6.5, 0),
  -- Ciqual: "Cassis, cru"
  ('Cassis', 'Fruits', 'g', 71, 1.4, 11.0, 8.0, 0.4, 0.02, 6.0, 0),
  -- Ciqual: "Grenade, pulpe et graines, crue"
  ('Grenade', 'Fruits', 'g', 76, 0.9, 17.0, 14.0, 0.6, 0.02, 2.8, 0),
  -- Ciqual: "Litchi, pulpe, cru"
  ('Litchi', 'Fruits', 'g', 66, 0.8, 15.2, 15.0, 0.4, 0.02, 1.3, 0),
  -- Ciqual: "Nectarine, pulpe et peau, crue"
  ('Nectarine', 'Fruits', 'g', 44, 1.1, 9.0, 8.0, 0.3, 0.02, 1.5, 0),
  -- Ciqual: "Clémentine, pulpe, crue"
  ('Clémentine', 'Fruits', 'g', 41, 0.8, 9.0, 9.0, 0.2, 0.02, 1.9, 0),

  -- Ciqual: "Chou-fleur, cuit à l'eau"
  ('Chou-fleur (cuit)', 'Légumes', 'g', 27, 1.9, 3.0, 2.0, 0.3, 0.02, 1.8, 0.02),
  -- Ciqual: "Chou blanc, cru"
  ('Chou blanc', 'Légumes', 'g', 25, 1.3, 4.3, 3.2, 0.2, 0.02, 2.3, 0.02),
  -- Ciqual: "Chou rouge, cru"
  ('Chou rouge', 'Légumes', 'g', 31, 1.4, 4.8, 3.8, 0.2, 0.02, 2.1, 0.03),
  -- Ciqual: "Chou de Bruxelles, cuit"
  ('Chou de Bruxelles (cuit)', 'Légumes', 'g', 45, 3.4, 6.0, 2.0, 0.4, 0.05, 4.8, 0.02),
  -- Ciqual/USDA: "Chou kale, cru"
  ('Chou kale', 'Légumes', 'g', 49, 4.3, 8.8, 2.0, 0.9, 0.1, 3.6, 0.04),
  -- Ciqual: "Asperge, cuite"
  ('Asperges (cuites)', 'Légumes', 'g', 25, 2.4, 2.0, 1.5, 0.2, 0.02, 2.0, 0.01),
  -- Ciqual: "Artichaut, cuit"
  ('Artichaut (cuit)', 'Légumes', 'g', 47, 2.9, 6.5, 1.0, 0.2, 0.02, 5.4, 0.10),
  -- Ciqual: "Aubergine, cuite"
  ('Aubergine (cuite)', 'Légumes', 'g', 27, 1.0, 3.5, 2.5, 0.3, 0.02, 2.5, 0.01),
  -- Ciqual: "Concombre, cru"
  ('Concombre', 'Légumes', 'g', 15, 0.7, 2.0, 1.7, 0.2, 0.02, 0.5, 0.01),
  -- Ciqual: "Radis, cru"
  ('Radis', 'Légumes', 'g', 16, 0.7, 2.0, 1.9, 0.1, 0.01, 1.6, 0.02),
  -- Ciqual: "Betterave, cuite"
  ('Betterave (cuite)', 'Légumes', 'g', 42, 1.7, 8.0, 7.0, 0.1, 0.01, 2.0, 0.10),
  -- Ciqual: "Panais, cuit"
  ('Panais (cuit)', 'Légumes', 'g', 65, 1.2, 13.0, 4.8, 0.3, 0.02, 4.5, 0.01),
  -- Ciqual: "Navet, cuit"
  ('Navet (cuit)', 'Légumes', 'g', 25, 0.7, 4.0, 3.0, 0.1, 0.01, 1.8, 0.03),
  -- Ciqual: "Céleri, branche, cru"
  ('Céleri branche', 'Légumes', 'g', 18, 0.7, 2.0, 1.5, 0.2, 0.02, 1.6, 0.15),
  -- Ciqual: "Céleri-rave, cru"
  ('Céleri-rave', 'Légumes', 'g', 29, 1.5, 4.0, 2.0, 0.3, 0.02, 3.0, 0.10),
  -- Ciqual: "Endive, crue"
  ('Endive', 'Légumes', 'g', 20, 0.9, 3.4, 1.0, 0.2, 0.02, 3.1, 0.01),
  -- Ciqual: "Laitue, crue"
  ('Laitue', 'Légumes', 'g', 13, 1.2, 1.5, 0.9, 0.2, 0.02, 1.3, 0.01),
  -- Ciqual: "Roquette, crue"
  ('Roquette', 'Légumes', 'g', 25, 2.6, 2.0, 2.0, 0.7, 0.1, 1.6, 0.03),
  -- Ciqual: "Mâche, crue"
  ('Mâche', 'Légumes', 'g', 21, 2.0, 1.6, 0.5, 0.4, 0.05, 1.5, 0.02),
  -- Ciqual: "Fenouil, cru"
  ('Fenouil', 'Légumes', 'g', 17, 1.2, 2.4, 1.8, 0.2, 0.02, 3.1, 0.15),
  -- Ciqual: "Poireau, cuit"
  ('Poireau (cuit)', 'Légumes', 'g', 31, 1.2, 7.6, 3.0, 0.3, 0.02, 1.0, 0.02),
  -- Ciqual: "Petit pois, cuit"
  ('Petits pois (cuits)', 'Légumes', 'g', 80, 5.0, 9.5, 3.0, 0.5, 0.05, 4.8, 0.02),
  -- Ciqual: "Maïs doux, en grains, cuit"
  ('Maïs doux (cuit)', 'Légumes', 'g', 146, 3.5, 21.0, 3.0, 1.5, 0.2, 2.7, 0.01),
  -- Ciqual: "Potiron, cuit"
  ('Potiron (cuit)', 'Légumes', 'g', 20, 1.0, 3.5, 2.5, 0.1, 0.01, 1.0, 0.01),
  -- Ciqual: "Courge doubeurre (butternut), pulpe, cuite"
  ('Courge butternut (cuite)', 'Légumes', 'g', 45, 1.2, 10.7, 2.0, 0.1, 0.01, 2.5, 0.01),
  -- Ciqual: "Salsifis, cuit"
  ('Salsifis (cuit)', 'Légumes', 'g', 82, 3.3, 15.0, 3.0, 0.3, 0.02, 3.8, 0.02),

  -- Ciqual: "Huile de colza"
  ('Huile de colza', 'Matières grasses / oléagineux', 'g', 900, 0, 0, 0, 100, 7.0, 0, 0),
  -- Ciqual: "Huile de tournesol"
  ('Huile de tournesol', 'Matières grasses / oléagineux', 'g', 900, 0, 0, 0, 100, 11.0, 0, 0),
  -- Ciqual: "Huile de sésame"
  ('Huile de sésame', 'Matières grasses / oléagineux', 'g', 900, 0, 0, 0, 100, 14.0, 0, 0),
  -- Ciqual: "Huile de lin"
  ('Huile de lin', 'Matières grasses / oléagineux', 'g', 884, 0, 0, 0, 100, 9.0, 0, 0),
  -- Ciqual: "Noix de cajou, grillée, non salée"
  ('Noix de cajou', 'Matières grasses / oléagineux', 'g', 580, 16.8, 29.9, 5.0, 47.8, 9.0, 3.0, 0.02),
  -- Ciqual: "Noisette, sèche"
  ('Noisettes', 'Matières grasses / oléagineux', 'g', 656, 15.0, 7.0, 4.0, 60.0, 4.5, 9.0, 0.01),
  -- Ciqual: "Pistache, grillée, non salée"
  ('Pistaches', 'Matières grasses / oléagineux', 'g', 635, 21.0, 16.0, 7.0, 48.0, 6.0, 10.0, 0.02),
  -- USDA FoodData Central: "Nuts, macadamia nuts, raw"
  ('Noix de macadamia', 'Matières grasses / oléagineux', 'g', 718, 7.9, 13.8, 4.5, 75.8, 12.0, 8.6, 0.01),
  -- USDA FoodData Central: "Nuts, Brazil nuts, dried"
  ('Noix du Brésil', 'Matières grasses / oléagineux', 'g', 656, 14.3, 12.3, 2.3, 66.4, 15.1, 7.5, 0.01),
  -- Ciqual: "Beurre de cacahuète 100% arachide, sans sel ni sucre ajoutés"
  ('Beurre de cacahuète 100%', 'Matières grasses / oléagineux', 'g', 588, 25.0, 7.0, 4.0, 50.0, 8.5, 8.0, 0.01),
  -- Moyenne des purées/beurres d'amande du commerce
  ('Beurre d''amande', 'Matières grasses / oléagineux', 'g', 614, 21.0, 19.0, 4.0, 55.5, 4.5, 10.0, 0.02),
  -- Moyenne des purées de noisette du commerce
  ('Purée de noisette', 'Matières grasses / oléagineux', 'g', 646, 14.0, 10.0, 4.0, 62.0, 4.5, 9.0, 0.01),
  -- Ciqual: "Olive, verte ou noire, en saumure"
  ('Olives (vertes ou noires)', 'Matières grasses / oléagineux', 'g', 145, 1.0, 3.8, 0.5, 14.0, 2.0, 3.0, 4.00),
  -- USDA FoodData Central: "Seeds, pumpkin seeds"
  ('Graines de courge', 'Matières grasses / oléagineux', 'g', 559, 30.0, 11.0, 1.4, 49.0, 8.7, 6.0, 0.02),
  -- Ciqual/USDA: "Graine de tournesol, séchée"
  ('Graines de tournesol', 'Matières grasses / oléagineux', 'g', 584, 21.0, 20.0, 2.6, 51.0, 4.5, 8.6, 0.01),
  -- Ciqual: "Sésame, graine"
  ('Graines de sésame', 'Matières grasses / oléagineux', 'g', 573, 17.7, 23.4, 0.3, 49.7, 7.0, 11.8, 0.01),

  -- Ciqual: "Lait entier"
  ('Lait entier', 'Produits laitiers / substituts', 'g', 64, 3.2, 4.8, 4.8, 3.6, 2.3, 0, 0.10),
  -- Ciqual: "Lait écrémé"
  ('Lait écrémé', 'Produits laitiers / substituts', 'g', 34, 3.4, 5.0, 5.0, 0.1, 0.05, 0, 0.10),
  -- Moyenne des boissons avoine non sucrées du commerce
  ('Lait d''avoine (non sucré)', 'Produits laitiers / substituts', 'g', 47, 1.0, 6.5, 4.0, 1.5, 0.2, 0.8, 0.10),
  -- Moyenne des boissons coco du commerce (brique, à boire)
  ('Lait de coco (boisson)', 'Produits laitiers / substituts', 'g', 25, 0.2, 3.0, 3.0, 1.5, 1.3, 0.1, 0.05),
  -- Moyenne des boissons soja nature non sucrées du commerce
  ('Lait de soja (non sucré)', 'Produits laitiers / substituts', 'g', 39, 3.3, 1.0, 1.0, 2.0, 0.3, 0.4, 0.10),
  -- Ciqual: "Crème fraîche épaisse, 30% MG"
  ('Crème fraîche', 'Produits laitiers / substituts', 'g', 292, 2.2, 3.0, 3.0, 30.0, 19.0, 0, 0.06),
  -- Ciqual: "Crème fraîche légère, 15% MG"
  ('Crème légère', 'Produits laitiers / substituts', 'g', 155, 2.6, 3.5, 3.5, 15.0, 9.5, 0, 0.08),
  -- Ciqual: "Mascarpone"
  ('Mascarpone', 'Produits laitiers / substituts', 'g', 429, 4.8, 3.0, 3.0, 44.0, 29.0, 0, 0.05),
  -- Ciqual: "Ricotta"
  ('Ricotta', 'Produits laitiers / substituts', 'g', 174, 8.8, 3.0, 3.0, 13.0, 8.0, 0, 0.24),
  -- Ciqual: "Fromage type Feta au lait de vache"
  ('Feta', 'Produits laitiers / substituts', 'g', 264, 17.0, 1.5, 1.5, 15.0, 10.0, 0, 2.90),
  -- Ciqual: "Fromage de chèvre bûche"
  ('Chèvre (bûche)', 'Produits laitiers / substituts', 'g', 290, 19.0, 2.0, 2.0, 24.0, 16.0, 0, 0.90),
  -- Ciqual: "Comté"
  ('Comté', 'Produits laitiers / substituts', 'g', 418, 27.0, 0, 0, 34.0, 22.0, 0, 0.75),
  -- Ciqual: "Parmesan"
  ('Parmesan', 'Produits laitiers / substituts', 'g', 400, 35.0, 0.9, 0.9, 28.0, 18.0, 0, 1.61),
  -- Ciqual: "Camembert, sans précision"
  ('Camembert', 'Produits laitiers / substituts', 'g', 279, 20.0, 0.5, 0.5, 23.0, 15.3, 0, 2.10),
  -- Ciqual: "Beurre doux"
  ('Beurre', 'Produits laitiers / substituts', 'g', 745, 0.7, 0.7, 0.7, 82.0, 54.0, 0, 0.02),
  -- Moyenne des yaourts à la grecque du commerce
  ('Yaourt grec', 'Produits laitiers / substituts', 'g', 115, 4.0, 4.0, 4.0, 9.0, 6.0, 0, 0.10),
  -- Moyenne des yaourts au soja nature non sucrés du commerce
  ('Yaourt de soja (nature)', 'Produits laitiers / substituts', 'g', 65, 3.5, 4.0, 3.0, 3.0, 0.5, 0.5, 0.05),
  -- Moyenne des fromages à tartiner allégés du commerce (type Kiri light)
  ('Fromage à tartiner allégé', 'Produits laitiers / substituts', 'g', 155, 11.0, 4.0, 4.0, 10.0, 6.5, 0, 1.20),

  -- Ciqual: "Sirop d'érable"
  ('Sirop d''érable', 'Épicerie / autres', 'g', 261, 0, 67.0, 60.0, 0, 0, 0, 0.01),
  -- Ciqual: "Confiture, tous fruits"
  ('Confiture', 'Épicerie / autres', 'g', 250, 0.4, 61.0, 58.0, 0.1, 0.01, 1.0, 0.02),
  -- Ciqual: "Pâte à tartiner, chocolat et noisette"
  ('Pâte à tartiner chocolat-noisette', 'Épicerie / autres', 'g', 549, 6.9, 50.7, 46.3, 34.4, 7.3, 3.8, 0.10),
  -- Ciqual: "Ketchup"
  ('Ketchup', 'Épicerie / autres', 'g', 101, 1.2, 24.0, 22.0, 0.2, 0.02, 0.9, 2.10),
  -- Ciqual: "Moutarde"
  ('Moutarde', 'Épicerie / autres', 'g', 95, 6.0, 5.0, 3.0, 5.0, 0.3, 3.0, 3.50),
  -- Ciqual: "Mayonnaise"
  ('Mayonnaise', 'Épicerie / autres', 'g', 671, 1.1, 2.0, 2.0, 75.0, 6.0, 0, 1.00),
  -- Ciqual: "Sauce soja"
  ('Sauce soja', 'Épicerie / autres', 'g', 60, 6.0, 6.0, 1.0, 0, 0, 0.8, 14.00),
  -- Ciqual: "Vinaigre balsamique"
  ('Vinaigre balsamique', 'Épicerie / autres', 'g', 88, 0.5, 17.0, 15.0, 0, 0, 0, 0.05),
  -- Bouillon cube, reconstitué (tel que consommé, dilué dans l'eau)
  ('Bouillon cube (reconstitué)', 'Épicerie / autres', 'g', 5, 0.3, 0.5, 0.2, 0.2, 0.05, 0, 1.50),
  -- Ciqual: "Levure de boulanger, fraîche"
  ('Levure de boulanger (fraîche)', 'Épicerie / autres', 'g', 105, 8.0, 3.0, 0, 1.5, 0.2, 6.0, 0.05),
  -- Ciqual: "Amande, en poudre"
  ('Poudre d''amande', 'Épicerie / autres', 'g', 610, 21.0, 6.0, 4.5, 54.0, 4.5, 11.0, 0.01),
  -- Moyenne des pépites de chocolat noir pâtissières du commerce
  ('Pépites de chocolat', 'Épicerie / autres', 'g', 500, 5.0, 55.0, 50.0, 28.0, 17.0, 4.0, 0.02),
  -- Ciqual: "Chocolat au lait, tablette"
  ('Chocolat au lait', 'Épicerie / autres', 'g', 530, 7.0, 52.0, 48.9, 34.5, 19.5, 2.0, 0.15),
  -- Moyenne des biscuits secs type petit-beurre
  ('Gâteaux secs', 'Épicerie / autres', 'g', 440, 7.0, 72.0, 22.0, 14.0, 7.0, 2.5, 0.45),
  -- Moyenne des barres de céréales du commerce
  ('Barre de céréales', 'Épicerie / autres', 'g', 400, 6.0, 65.0, 30.0, 13.0, 6.0, 4.0, 0.30),
  -- Ciqual: "Chips de pommes de terre, standard"
  ('Chips', 'Épicerie / autres', 'g', 545, 6.0, 50.0, 0.5, 34.0, 3.0, 4.5, 1.30),
  -- Ciqual: "Pop-corn, salé"
  ('Popcorn', 'Épicerie / autres', 'g', 387, 12.0, 78.0, 0.9, 4.5, 0.6, 15.0, 0.80),

  -- Ciqual: "Jus d'orange, pur jus"
  ('Jus d''orange', 'Boissons', 'g', 45, 0.7, 8.9, 8.2, 0.2, 0.02, 0.2, 0.01),
  -- Ciqual: "Jus de pomme"
  ('Jus de pomme', 'Boissons', 'g', 46, 0.1, 11.3, 9.6, 0.1, 0.01, 0.2, 0.01),
  -- Ciqual: "Café noir, non sucré"
  ('Café (noir, infusé)', 'Boissons', 'g', 1, 0.1, 0, 0, 0, 0, 0, 0),
  -- Ciqual: "Thé noir, infusé, non sucré"
  ('Thé (infusé, non sucré)', 'Boissons', 'g', 1, 0, 0.3, 0, 0, 0, 0, 0),
  -- Moyenne des boissons protéinées prêtes à boire du commerce
  ('Boisson protéinée', 'Boissons', 'g', 65, 10.0, 4.0, 2.0, 1.5, 0.3, 0.5, 0.15),
  -- Moyenne des eaux gazeuses aromatisées sans sucre du commerce
  ('Eau gazeuse aromatisée', 'Boissons', 'g', 1, 0, 0.1, 0, 0, 0, 0, 0.01);
