-- Ajoute le bonbon "Haribo Flower Zourr" identifié sur une fiche Yuka/photo
-- d'emballage. Sucre, calories, graisses saturées et sel lus directement sur
-- la fiche ; protéines/glucides totaux/lipides totaux/fibres estimés d'après
-- la composition type des bonbons acidulés gélifiés Haribo (non listés sur
-- la fiche mais requis par le schéma).
-- À exécuter avec le rôle service_role.

insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g, user_id)
values
  ('Bonbons Haribo Flower Zourr', 'Épicerie / autres', 'g', 373, 4.5, 78.0, 63.0, 3.5, 1.8, 0, 0.40,
   (select id from auth.users where email = 'vincent.hassanaly@gmail.com'));
