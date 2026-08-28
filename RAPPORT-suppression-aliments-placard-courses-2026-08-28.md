# Rapport — Suppression des sections Aliments, Placard, Courses

Branche : `claude/remove-nutrition-sections-bqtd9b`

## Résumé

Les sections **Aliments**, **Placard** et **Courses** ont été retirées de l'application. **Journal** et **Recettes** restent intactes et fonctionnelles. La table `aliments` (catalogue d'aliments) a été **conservée en base** car elle est le socle de données utilisé par Journal et Recettes — seule la page de gestion CRUD de ce catalogue a été supprimée (cf. point de validation ci-dessous).

## Fichiers supprimés

**Pages/routes**
- `src/app/(app)/aliments/` (page.tsx, AlimentsList.tsx, AlimentForm.tsx, AddAlimentToggle.tsx)
- `src/app/(app)/placard/` (page.tsx, PlacardList.tsx, AddPlacardToggle.tsx, RecettesRealisables.tsx)
- `src/app/(app)/courses/` (page.tsx, ListesCoursesList.tsx, NewListeToggle.tsx, `[id]/page.tsx`, `[id]/ItemsChecklist.tsx`, `[id]/ListeHeader.tsx`)

**Server Actions**
- `src/app/actions/aliments.ts`
- `src/app/actions/placard.ts`
- `src/app/actions/listes-courses.ts`

**Lib**
- `src/lib/nutrition/matching.ts` (`matchRecetteAvecPlacard`, utilisé uniquement par Placard)

## Fichiers modifiés

- `src/components/BottomNav.tsx` — ne garde que Journal et Recettes ; layout recentré (`justify-center gap-10`, largeur fixe par item) au lieu d'un flex sur 5 emplacements.
- `src/app/page.tsx` — redirect utilisateur connecté : `/aliments` → `/journal`.
- `src/app/actions/auth.ts` — redirects post signIn/signUp : `/aliments` → `/journal` (référence résiduelle repérée par grep, corrigée).
- `src/lib/supabase/types.ts` — retrait des types `placard`, `listes_courses`, `listes_courses_items` et de l'enum `liste_statut`.
- `public/manifest.json` — description PWA mise à jour ("Liste de courses, recettes, suivi calorique et placard" → "Suivi calorique et recettes").

## Schéma Supabase — tables droppées

| Table | Décision | Raison |
|---|---|---|
| `placard` | **DROP** | FK sortante uniquement vers `aliments` ; aucune table conservée ne la référence. |
| `listes_courses` | **DROP** | Idem, référencée seulement par `listes_courses_items`. |
| `listes_courses_items` | **DROP** (avant `listes_courses`) | FK vers `aliments` (restrict) et `listes_courses` (cascade). |
| enum `liste_statut` | **DROP** | Utilisé uniquement par `listes_courses`. |
| `aliments` | **CONSERVÉE** | Référencée par `journal_repas.aliment_id` et `recette_ingredients.aliment_id` (Journal, Recettes). |

Migration : [`scripts/migration-suppression-aliments-placard-courses-2026-08-28.sql`](scripts/migration-suppression-aliments-placard-courses-2026-08-28.sql)

```sql
drop table if exists listes_courses_items;
drop table if exists listes_courses;
drop table if exists placard;

drop type if exists liste_statut;
```

**⚠️ Cette migration n'a pas été exécutée automatiquement** (aucun accès Supabase CLI/MCP configuré dans ce repo, et un `DROP TABLE` sur une base réelle est une opération destructive/irréversible) — à appliquer manuellement via le SQL editor Supabase quand vous serez prêt.

## Vérification

- `npm run lint` → OK, aucune erreur.
- `npm run build` (Next.js, typecheck inclus) → OK. Routes générées : `/`, `/login`, `/journal`, `/recettes`, `/recettes/[id]` — plus aucune route `/aliments`, `/placard`, `/courses`.
- Test en conditions réelles dans un navigateur **non effectué** : aucune variable d'environnement Supabase (`NEXT_PUBLIC_SUPABASE_URL`/clé) n'est présente dans ce container, donc impossible de se connecter et de valider visuellement Journal/Recettes. Le typecheck et le lint garantissent la correction du code, pas le comportement fonctionnel réel — recommande un test manuel rapide de Journal (ajout d'un repas) et Recettes (ajout d'un ingrédient) après déploiement.

## Points validés avec vous avant exécution

1. **Table `aliments` non droppable** : Journal et Recettes en dépendent (FK). Seule la page de gestion CRUD est supprimée.
2. **Conséquence acceptée** : plus aucune UI dans l'app pour créer/modifier/supprimer un aliment du catalogue après cette suppression (dépendance au catalogue existant / accès direct à Supabase Studio si besoin d'ajouter un aliment).

## Point restant à votre main

- La migration SQL n'est pas encore appliquée sur la base réelle — à lancer vous-même (ou dites-moi si vous voulez que je l'exécute via un accès Supabase MCP, si vous en connectez un à cette session).
