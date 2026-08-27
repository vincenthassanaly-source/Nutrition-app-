-- Catalogue de référence : aliments partagés (user_id NULL).
-- À exécuter avec le rôle service_role (bypass RLS), cf. commentaire en tête
-- de scripts/migration-aliments-2026-08-27.sql.
-- Valeurs pour 100 g, sources Ciqual (ANSES) en priorité, USDA FoodData
-- Central sinon (voir commentaire sur chaque ligne). Aliments par défaut
-- sous forme cuite/prête à consommer sauf mention contraire.

insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g)
values
  -- Ciqual: "Poulet, blanc, rôti"
  ('Blanc de poulet (cuit)', 'Protéines', 'g', 148, 29.4, 0, 0, 3.5, 1.0, 0, 0.20),
  -- Ciqual: "Dinde, escalope, rôtie/cuite au four"
  ('Escalope de dinde (cuite)', 'Protéines', 'g', 128, 25.0, 0.5, 0, 3.0, 1.0, 0, 0.30),
  -- Ciqual: "Boeuf, steak haché 5% MG, cuit"
  ('Steak haché 5% MG (cuit)', 'Protéines', 'g', 155, 26.0, 0, 0, 5.9, 2.7, 0, 0.20),

  -- Ciqual: "Oeuf, cru"
  ('Œuf entier (cru)', 'Protéines', 'g', 143, 12.5, 0.7, 0.7, 9.9, 3.1, 0, 0.37),
  -- Ciqual: "Oeuf, blanc (blanc d'oeuf), cru"
  ('Blanc d''œuf (cru)', 'Protéines', 'g', 48, 10.9, 0.7, 0.7, 0.2, 0.03, 0, 0.42),
  -- Ciqual: "Thon, au naturel, appertisé, égoutté"
  ('Thon au naturel (conserve, égoutté)', 'Protéines', 'g', 116, 25.5, 0, 0, 0.8, 0.2, 0, 0.90),
  -- Ciqual: "Saumon, cuit, sans précision"
  ('Saumon (cuit)', 'Protéines', 'g', 205, 22.0, 0, 0, 12.0, 2.5, 0, 0.15),
  -- Ciqual: "Cabillaud, cuit"
  ('Cabillaud (cuit)', 'Protéines', 'g', 82, 20.0, 0, 0, 0.7, 0.1, 0, 0.30),
  -- Ciqual: "Jambon cuit, supérieur, découenné dégraissé"
  ('Jambon blanc (découenné, dégraissé)', 'Protéines', 'g', 117, 20.5, 1.7, 0.5, 3.5, 1.2, 0, 1.90),
  -- Ciqual: "Fromage blanc nature, 0% MG"
  ('Fromage blanc 0%', 'Protéines', 'g', 49, 8.0, 3.9, 3.9, 0.2, 0.1, 0, 0.11),
  -- USDA FoodData Central: "Yogurt, Icelandic, skyr, plain, whole milk" (référence proche des skyr nature commerciaux)
  ('Skyr nature', 'Protéines', 'g', 60, 11.0, 3.5, 3.5, 0.2, 0.1, 0, 0.15),
  -- USDA FoodData Central: "Cheese, cottage, lowfat, 2% milkfat"
  ('Cottage cheese', 'Protéines', 'g', 81, 11.1, 3.4, 3.4, 2.3, 1.4, 0, 0.91),
  -- Ciqual: "Tofu, nature, préemballé"
  ('Tofu nature', 'Protéines', 'g', 145, 8.0, 0.5, 0.5, 8.5, 1.3, 1.7, 0.01),
  -- USDA FoodData Central: "Tempeh"
  ('Tempeh', 'Protéines', 'g', 192, 20.3, 7.6, 0.4, 10.8, 2.5, 9.0, 0.02),

  -- Ciqual: "Riz, blanc, cuit, non salé"
  ('Riz blanc (cuit)', 'Féculents / glucides', 'g', 130, 2.7, 28.2, 0.1, 0.4, 0.1, 0.4, 0.01),
  -- Ciqual: "Riz basmati, cuit, non salé"
  ('Riz basmati (cuit)', 'Féculents / glucides', 'g', 118, 3.5, 25.0, 0.1, 0.4, 0.1, 0.5, 0.01),
  -- Ciqual: "Pâtes alimentaires, cuites, non salées"
  ('Pâtes blé (cuites)', 'Féculents / glucides', 'g', 158, 5.3, 30.7, 0.7, 0.9, 0.2, 1.8, 0.01),
  -- Ciqual: "Pâtes sèches, au blé complet, cuites, non salées"
  ('Pâtes complètes (cuites)', 'Féculents / glucides', 'g', 124, 5.5, 23.0, 0.7, 0.9, 0.2, 4.5, 0.01),
  -- Ciqual: "Pomme de terre, bouillie/cuite à l'eau"
  ('Pomme de terre (cuite)', 'Féculents / glucides', 'g', 77, 1.8, 17.0, 0.8, 0.1, 0.02, 1.8, 0.10),
  -- Ciqual: "Patate douce, cuite"
  ('Patate douce (cuite)', 'Féculents / glucides', 'g', 86, 1.6, 20.7, 4.2, 0.1, 0.02, 2.5, 0.04),
  -- Ciqual: "Flocons d'avoine" (secs, tels que vendus/pesés avant cuisson)
  ('Flocons d''avoine (secs)', 'Féculents / glucides', 'g', 372, 13.5, 58.0, 1.0, 7.0, 1.2, 10.0, 0.01),
  -- Ciqual: "Pain complet ou intégral"
  ('Pain complet', 'Féculents / glucides', 'g', 229, 9.0, 44.2, 3.5, 1.8, 0.3, 6.8, 1.10),
  -- Ciqual: "Quinoa, cuit"
  ('Quinoa (cuit)', 'Féculents / glucides', 'g', 120, 4.4, 21.3, 0.5, 1.9, 0.2, 2.8, 0.02),
  -- Ciqual: "Semoule de blé dur, cuite, non salée"
  ('Semoule (cuite)', 'Féculents / glucides', 'g', 112, 3.0, 23.0, 0.3, 0.2, 0.05, 1.3, 0.01),
  -- Ciqual: "Boulgour de blé, cuit, non salé"
  ('Boulgour (cuit)', 'Féculents / glucides', 'g', 106, 3.7, 18.6, 0.2, 0.3, 0.05, 4.5, 0.01),

  -- Ciqual: "Lentille verte, bouillie/cuite à l'eau"
  ('Lentilles vertes (cuites)', 'Légumineuses', 'g', 127, 9.0, 20.0, 1.5, 0.5, 0.1, 8.0, 0.02),
  -- Ciqual: "Lentille corail, cuite"
  ('Lentilles corail (cuites)', 'Légumineuses', 'g', 106, 7.6, 18.0, 0.8, 0.4, 0.1, 3.5, 0.01),
  -- Ciqual: "Pois chiche, cuit"
  ('Pois chiches (cuits)', 'Légumineuses', 'g', 164, 8.9, 16.6, 2.9, 2.6, 0.3, 7.6, 0.02),
  -- Ciqual: "Haricot rouge, cuit"
  ('Haricots rouges (cuits)', 'Légumineuses', 'g', 127, 8.2, 16.5, 0.3, 0.5, 0.1, 6.5, 0.40),
  -- Ciqual: "Haricot blanc, cuit"
  ('Haricots blancs (cuits)', 'Légumineuses', 'g', 112, 7.0, 16.9, 0.3, 0.4, 0.1, 6.3, 0.04),

  -- Ciqual: "Banane, pulpe, crue"
  ('Banane', 'Fruits', 'g', 88, 1.1, 19.7, 17.0, 0.2, 0.05, 2.7, 0),
  -- Ciqual: "Pomme, golden, pulpe et peau, crue"
  ('Pomme', 'Fruits', 'g', 55, 0.3, 12.6, 11.0, 0.2, 0.02, 2.0, 0),
  -- Ciqual: "Orange, pulpe, crue"
  ('Orange', 'Fruits', 'g', 45, 0.9, 9.3, 9.0, 0.2, 0.02, 1.9, 0),
  -- Ciqual: "Fraise, crue"
  ('Fraises', 'Fruits', 'g', 39, 0.7, 6.0, 5.6, 0.3, 0.02, 3.8, 0),
  -- Ciqual: "Myrtille, crue"
  ('Myrtilles', 'Fruits', 'g', 57, 0.7, 11.5, 10.0, 0.3, 0.02, 2.5, 0),
  -- Ciqual: "Raisin, blanc ou noir, pulpe et peau, cru"
  ('Raisin', 'Fruits', 'g', 72, 0.4, 16.1, 15.5, 0.2, 0.02, 0.9, 0),
  -- Ciqual: "Kiwi, pulpe et graines, cru"
  ('Kiwi', 'Fruits', 'g', 61, 1.1, 11.0, 8.9, 0.6, 0.05, 2.4, 0),
  -- Ciqual: "Ananas, pulpe, cru"
  ('Ananas', 'Fruits', 'g', 51, 0.5, 11.9, 10.0, 0.1, 0.01, 1.3, 0),

  -- Ciqual: "Brocoli, cuit, à l'eau"
  ('Brocoli (cuit)', 'Légumes', 'g', 25, 2.6, 1.9, 1.0, 0.4, 0.1, 2.9, 0.02),
  -- Ciqual: "Courgette, non pelée, crue"
  ('Courgette', 'Légumes', 'g', 17, 1.2, 2.4, 2.2, 0.3, 0.05, 1.1, 0.01),
  -- Ciqual: "Epinard, cuit"
  ('Épinards (cuits)', 'Légumes', 'g', 23, 3.0, 3.8, 0.4, 0.3, 0.05, 2.4, 0.14),
  -- Ciqual: "Tomate, crue"
  ('Tomate', 'Légumes', 'g', 18, 0.9, 3.5, 3.0, 0.2, 0.02, 1.2, 0.01),
  -- Ciqual: "Carotte, crue"
  ('Carotte', 'Légumes', 'g', 34, 0.9, 6.4, 4.7, 0.2, 0.02, 2.6, 0.10),
  -- Ciqual: "Poivron, rouge, cru"
  ('Poivron', 'Légumes', 'g', 31, 1.0, 4.2, 4.0, 0.3, 0.02, 1.7, 0),
  -- Ciqual: "Haricot vert, cuit"
  ('Haricots verts (cuits)', 'Légumes', 'g', 31, 1.8, 3.9, 2.5, 0.2, 0.02, 3.2, 0.01),
  -- Ciqual: "Champignon de Paris, cru"
  ('Champignons de Paris', 'Légumes', 'g', 27, 3.0, 0.9, 0.5, 0.3, 0.02, 1.5, 0.01),
  -- Ciqual: "Oignon, cru"
  ('Oignon', 'Légumes', 'g', 40, 1.2, 7.3, 5.6, 0.1, 0.02, 1.7, 0.01),
  -- Ciqual: "Ail, cru"
  ('Ail', 'Légumes', 'g', 130, 6.4, 26.0, 1.0, 0.3, 0.05, 4.0, 0.02),

  -- Ciqual: "Huile d'olive vierge extra"
  ('Huile d''olive', 'Matières grasses', 'g', 899, 0, 0, 0, 100, 11.9, 0, 0),
  -- Ciqual: "Huile de coco/coprah"
  ('Huile de coco', 'Matières grasses', 'g', 862, 0, 0, 0, 100, 86.5, 0, 0),
  -- Ciqual: "Beurre de cacahuète ou pâte d'arachide"
  ('Beurre de cacahuète', 'Matières grasses', 'g', 623, 24.0, 13.0, 6.0, 50.0, 10.0, 6.0, 0.80),
  -- Ciqual: "Amande, sèche"
  ('Amandes', 'Matières grasses', 'g', 634, 22.6, 4.3, 4.0, 51.3, 4.0, 12.5, 0.01),
  -- Ciqual: "Noix, séchée, cerneaux"
  ('Noix', 'Matières grasses', 'g', 709, 15.7, 6.9, 2.6, 67.3, 6.0, 7.0, 0.01),
  -- Ciqual: "Avocat, pulpe, cru"
  ('Avocat', 'Matières grasses', 'g', 203, 2.0, 8.5, 0.4, 14.7, 2.6, 6.7, 0.01),
  -- USDA FoodData Central: "Seeds, chia seeds, dried"
  ('Graines de chia', 'Matières grasses', 'g', 486, 16.5, 42.1, 0, 30.7, 3.3, 34.4, 0.01),
  -- USDA FoodData Central: "Seeds, flaxseed"
  ('Graines de lin', 'Matières grasses', 'g', 534, 18.3, 28.9, 1.6, 42.2, 3.7, 27.3, 0.01),

  -- Ciqual: "Lait demi-écrémé"
  ('Lait demi-écrémé', 'Produits laitiers', 'g', 47, 3.3, 4.8, 4.7, 1.6, 1.0, 0, 0.10),
  -- Ciqual: "Yaourt au lait entier, nature"
  ('Yaourt nature', 'Produits laitiers', 'g', 66, 3.8, 4.5, 4.5, 3.8, 2.4, 0, 0.13),
  -- Ciqual: "Emmental ou emmenthal"
  ('Emmental', 'Produits laitiers', 'g', 380, 28.4, 0, 0, 29.6, 19.0, 0, 0.70),
  -- Ciqual: "Mozzarella au lait de vache"
  ('Mozzarella', 'Produits laitiers', 'g', 280, 18.7, 2.2, 1.0, 21.6, 13.0, 0, 0.64),
  -- Moyenne des boissons amande non sucrées du commerce (proche USDA "Beverages, almond milk, unsweetened")
  ('Lait d''amande (non sucré)', 'Produits laitiers', 'g', 24, 0.5, 2.6, 2.5, 1.1, 0.1, 0.2, 0.10),

  -- Ciqual: "Miel"
  ('Miel', 'Autres', 'g', 304, 0.3, 82.4, 82.1, 0, 0, 0.2, 0.01),
  -- Ciqual: "Pain de mie nature"
  ('Pain de mie', 'Autres', 'g', 265, 8.5, 48.0, 4.0, 3.5, 0.8, 2.5, 1.10),
  -- Ciqual: "Farine de blé tendre ou froment T55"
  ('Farine de blé', 'Autres', 'g', 350, 9.0, 73.7, 1.0, 1.0, 0.2, 3.5, 0.01),
  -- Ciqual: "Sucre blanc"
  ('Sucre', 'Autres', 'g', 399, 0, 99.7, 99.7, 0, 0, 0, 0),
  -- Ciqual: "Chocolat noir à 70% cacao minimum"
  ('Chocolat noir 70%+', 'Autres', 'g', 598, 7.8, 45.9, 24.0, 42.6, 25.0, 10.9, 0.01);
