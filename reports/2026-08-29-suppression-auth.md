# Suppression complète de l'authentification — 2026-08-29

Nutricio est confirmé comme app strictement mono-utilisateur : toute la logique
d'authentification/multi-compte a été retirée côté application et côté base de données.

## Écart constaté en Phase 1 (signalé et validé avant implémentation)

Le prompt supposait que la table `aliments` n'avait pas de `user_id` ("catalogue
partagé, a priori non, mais à confirmer"). L'exploration a montré le contraire :

- `aliments.user_id` existait (nullable), avec RLS active
  (`user_id IS NULL OR user_id = auth.uid()` en select, `user_id = auth.uid()`
  en insert/update/delete).
- La migration `migration-oeuf-dur-et-catalogue-personnel-2026-08-27.sql` avait déjà
  rattaché **toutes** les lignes au compte unique (plus aucune ligne `user_id IS NULL`).

Sans traitement, la suppression de l'auth aurait laissé les policies RLS de
`aliments` actives avec `auth.uid()` toujours nul : toute requête sur `aliments`
— et donc le journal, les macros de recettes et le sélecteur d'ingrédients qui
l'embarquent via jointure — serait revenue vide, cassant l'app entière au-delà de
la simple suppression du login.

**Décision validée avec l'utilisateur** : étendre le périmètre de la migration à
`aliments` en plus des 4 tables prévues (`journal_repas`, `recettes`,
`objectifs_nutritionnels`, `recette_ingredients`).

Le reste de l'exploration correspondait exactement au prompt : tous les fichiers
listés existaient avec le contenu attendu, et tous les appels à `requireUser()`
correspondaient exactement à la liste donnée (aucun appel supplémentaire trouvé).

## Fichiers supprimés

- `src/app/login/page.tsx`
- `src/app/actions/auth.ts` (`signIn` / `signUp` / `signOut`)
- `src/lib/supabase/auth.ts` (`requireUser`)
- `src/lib/supabase/middleware.ts` (`updateSession`)
- `src/proxy.ts` (middleware Next 16)

## Fichiers modifiés

- `src/app/page.tsx` : redirection inconditionnelle vers `/journal` (plus de check
  de session).
- `src/app/(app)/layout.tsx` : retrait de `requireUser()`, de l'affichage de
  l'email et du bouton de déconnexion.
- `src/app/(app)/journal/page.tsx` : retrait de l'appel `requireUser()`.
- `src/app/(app)/recettes/page.tsx` : retrait de `requireUser()` et de la prop
  `userId` passée à `RecettesList`.
- `src/app/(app)/recettes/RecettesList.tsx` : retrait de la prop `userId` et du
  badge "partagé" (devenu sans objet, `recettes.user_id` n'existe plus).
- `src/app/(app)/recettes/[id]/page.tsx` : retrait de `requireUser()` et du calcul
  `isOwner`.
- `src/app/(app)/recettes/[id]/RecetteHeader.tsx` : retrait de la prop `isOwner`
  et du badge "partagé" — édition/suppression toujours visibles.
- `src/app/(app)/recettes/[id]/IngredientManager.tsx` : retrait de la prop
  `isOwner` — édition/ajout/suppression d'ingrédients toujours visibles.
- `src/app/actions/journal.ts` : retrait de `requireUser()` et de
  `user_id: user.id` dans l'insert `journal_repas`.
- `src/app/actions/recettes.ts` : retrait de `requireUser()` et de
  `user_id: user.id` dans l'insert `recettes`.
- `src/app/actions/objectifs.ts` : retrait de `requireUser()`, de
  `user_id: user.id`, et `onConflict: "user_id,jour_type"` → `onConflict: "jour_type"`.
- `src/app/actions/recette-ingredients.ts` : retrait des 3 appels `requireUser()`
  (recette_ingredients n'a jamais eu de `user_id` propre).
- `src/lib/supabase/types.ts` : régénération manuelle (pas d'accès à la CLI
  Supabase) — retrait du champ `user_id` des types `Row`/`Insert`/`Update` de
  `aliments`, `journal_repas`, `objectifs_nutritionnels`, `recettes`.

`src/lib/supabase/server.ts` (`createClient`) est conservé tel quel : toujours
nécessaire pour interroger la base, indépendamment de l'auth. `@supabase/ssr`
reste utilisé (par `createClient`) — non désinstallé.

## Migration SQL appliquée

Fichier : `scripts/migration-suppression-auth-2026-08-29.sql`, **appliquée** sur
le projet Supabase `nutrition-app` (réf. `vsmtkopkqasrdnjceegp`) via les outils
MCP Supabase, avec confirmation de l'utilisateur au préalable (opération
irréversible en pratique : `DROP COLUMN`).

```sql
-- Suppression complète de l'authentification (app strictement mono-utilisateur).
--
-- Périmètre : journal_repas, recettes, objectifs_nutritionnels, recette_ingredients,
-- ainsi que aliments. Cette dernière n'était pas prévue au périmètre initial, mais
-- l'exploration a montré qu'elle a aussi un user_id + RLS actives (et que toutes ses
-- lignes ont déjà été rattachées au compte unique par la migration
-- migration-oeuf-dur-et-catalogue-personnel-2026-08-27.sql) : sans son inclusion ici,
-- toute requête sur aliments — et donc le journal, les macros de recettes et le
-- sélecteur d'ingrédients qui l'embarquent — reviendrait vide une fois auth.uid()
-- toujours nul.

-- 1. Policies RLS
drop policy if exists "aliments_select" on aliments;
drop policy if exists "aliments_insert" on aliments;
drop policy if exists "aliments_update" on aliments;
drop policy if exists "aliments_delete" on aliments;

drop policy if exists "recettes_select" on recettes;
drop policy if exists "recettes_insert" on recettes;
drop policy if exists "recettes_update" on recettes;
drop policy if exists "recettes_delete" on recettes;

drop policy if exists "recette_ingredients_select" on recette_ingredients;
drop policy if exists "recette_ingredients_insert" on recette_ingredients;
drop policy if exists "recette_ingredients_update" on recette_ingredients;
drop policy if exists "recette_ingredients_delete" on recette_ingredients;

drop policy if exists "objectifs_select" on objectifs_nutritionnels;
drop policy if exists "objectifs_insert" on objectifs_nutritionnels;
drop policy if exists "objectifs_update" on objectifs_nutritionnels;
drop policy if exists "objectifs_delete" on objectifs_nutritionnels;

drop policy if exists "journal_repas_select" on journal_repas;
drop policy if exists "journal_repas_insert" on journal_repas;
drop policy if exists "journal_repas_update" on journal_repas;
drop policy if exists "journal_repas_delete" on journal_repas;

-- 2. Désactivation de la RLS (accès direct via la clé publishable, un seul utilisateur)
alter table aliments disable row level security;
alter table recettes disable row level security;
alter table recette_ingredients disable row level security;
alter table objectifs_nutritionnels disable row level security;
alter table journal_repas disable row level security;

-- 3. Contrainte UNIQUE(user_id, jour_type) -> UNIQUE(jour_type), avant de dropper la colonne
alter table objectifs_nutritionnels drop constraint if exists objectifs_nutritionnels_user_id_jour_type_key;
alter table objectifs_nutritionnels add constraint objectifs_nutritionnels_jour_type_key unique (jour_type);

-- 4. Suppression des colonnes user_id
alter table aliments drop column if exists user_id;
alter table recettes drop column if exists user_id;
alter table objectifs_nutritionnels drop column if exists user_id;
alter table journal_repas drop column if exists user_id;

-- recette_ingredients n'a pas de user_id propre (RLS par rebond sur recettes,
-- déjà traitée ci-dessus) : rien à dropper ici.

-- 5. Index devenus inutiles (remplacés par des index sans user_id là où ça reste pertinent)
drop index if exists idx_aliments_user_id;
drop index if exists idx_recettes_user_id;
drop index if exists idx_objectifs_nutritionnels_user_id;
drop index if exists idx_journal_repas_user_id_date;

create index if not exists idx_journal_repas_date on journal_repas(date);

-- Les tables Supabase Auth internes (auth.users) ne sont pas touchées : elles ne
-- sont simplement plus référencées par le schéma applicatif.
```

Vérifié après application (`list_tables` + requête sur `pg_tables`) :
`user_id` absent des 5 tables, `rowsecurity = false` sur les 5 tables.

**Point de sécurité à noter** : l'outil Supabase a signalé, comme attendu, que
RLS est maintenant désactivée sur ces 5 tables (donc accès complet via la clé
publishable). C'est le résultat volontaire de cette tâche pour une app
mono-utilisateur — pas une régression imprévue — mais il doit être noté que la
clé publishable (exposée côté client dans `next.config.ts`) donne désormais un
accès complet en lecture/écriture à ces tables à quiconque la possède.

Les tables Auth internes (`auth.users`) n'ont pas été touchées, conformément au
prompt.

## Résultat des vérifications (Phase 3)

- `npx eslint` : ✅ aucune erreur.
- `npx tsc --noEmit` : ✅ aucune erreur (une fausse alerte initiale sur
  `LayoutProps` a disparu après génération des types Next 16 via `next build` —
  ce type est auto-généré dans `.next/types` et absent avant un premier build).
- `npm run build` (`next build`, Turbopack) : ✅ build réussi, typecheck intégré
  passé, 7 routes générées. La route `/login` a bien disparu de la liste des
  routes.

## Vérification finale (Phase 2.D)

Grep sur `src/` : zéro occurrence restante de `requireUser`, `signIn`, `signUp`,
`signOut`, `/login`, `auth.uid()`, `supabase.auth.*`, ou `user_id` (hors
migrations SQL historiques déjà appliquées, non réécrites).
