-- Préférences de navigation personnalisables par Vincent :
-- - ordre_grille_plus : ordre des tuiles de la grille "Plus" (hrefs des
--   modules secondaires de src/lib/navigation/registry.ts, dans l'ordre
--   choisi). Toute entrée absente de ce tableau (nouveau module ajouté
--   plus tard au registre) est résolue en fin de grille côté application
--   (voir resolveOrdreGrillePlus dans src/app/actions/preferences-navigation.ts).
-- - modules_barre_basse : les 4 hrefs épinglés dans la barre de navigation
--   du bas, dans l'ordre d'affichage. Le bouton "Plus" n'est jamais stocké
--   ici : il reste fixe en 5e position côté BottomNav.
--
-- Table singleton (id fixé à 1, contrainte check) : cohérent avec le reste
-- de Kilio qui est mono-utilisateur, sans user_id ni RLS (voir
-- migration-suppression-auth-2026-08-29.sql). set_updated_at() déjà créée
-- dans migration-aliments-2026-08-27.sql, réutilisée ici sans redéfinition.

create table preferences_navigation (
  id int primary key default 1,
  ordre_grille_plus text[] not null default '{}',
  modules_barre_basse text[] not null default array['/', '/nutrition', '/taches', '/habitudes'],
  updated_at timestamptz not null default now(),
  constraint preferences_navigation_singleton check (id = 1),
  constraint preferences_navigation_barre_basse_4_slots check (array_length(modules_barre_basse, 1) = 4)
);

create trigger trg_preferences_navigation_updated_at
  before update on preferences_navigation
  for each row execute function set_updated_at();

-- Ligne unique, valeurs par défaut = comportement actuel (ordre de MODULES
-- au moment de l'écriture de cette migration, barre du bas inchangée).
insert into preferences_navigation (id, ordre_grille_plus, modules_barre_basse)
values (
  1,
  array['/agenda', '/courses', '/budget', '/objectifs', '/collection', '/notes', '/reglages'],
  array['/', '/nutrition', '/taches', '/habitudes']
);
