-- Ajoute l'œuf dur cuit au catalogue, puis transfère la propriété de tout
-- le catalogue partagé (user_id NULL) au compte unique de l'app, pour que
-- chaque aliment soit éditable/supprimable depuis l'interface comme s'il
-- avait été ajouté individuellement par l'utilisateur.
-- À exécuter avec le rôle service_role.

-- Ciqual: "Oeuf, cuit dur"
insert into aliments
  (nom, categorie, unite, kcal_100g, proteines_100g, glucides_100g, sucres_100g,
   lipides_100g, acides_gras_satures_100g, fibres_100g, sel_100g, user_id)
values
  ('Œuf dur (cuit)', 'Protéines', 'g', 155, 12.6, 1.1, 1.1, 10.6, 3.3, 0, 0.40,
   (select id from auth.users where email = 'vincent.hassanaly@gmail.com'));

update aliments
set user_id = (select id from auth.users where email = 'vincent.hassanaly@gmail.com')
where user_id is null;
