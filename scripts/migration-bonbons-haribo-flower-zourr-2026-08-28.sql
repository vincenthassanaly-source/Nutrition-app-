-- Ajoute le bonbon "Haribo Flower Zourr" identifié à partir du tableau de
-- valeurs nutritionnelles photographié sur l'emballage (100 g : 373 kcal,
-- 2,7 g de lipides dont 1,8 g saturés, 87 g de glucides dont 63 g de sucres,
-- 1,5 g de protéines, 0,4 g de sel). Fibres non indiquées sur l'emballage,
-- laissées à 0.
-- À exécuter avec le rôle service_role.

insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g, user_id)
values
  ('Bonbons Haribo Flower Zourr', 'Épicerie / autres', 'g', 373, 1.5, 87.0, 63.0, 2.7, 1.8, 0, 0.40,
   (select id from auth.users where email = 'vincent.hassanaly@gmail.com'));
