# Rapport — Étape 5 : Objectifs nutritionnels + Journal de repas

Date : 2026-08-27

## Ce qui a été construit

- **Calcul nutritionnel** (`src/lib/nutrition/compute.ts`) : fonctions pures
  `nutritionAliment` (kcal/macros pour une quantité d'aliment donnée — la valeur en base est
  toujours « pour 100 unités », donc le calcul est identique en g/ml/pièce) et
  `nutritionRecette` (macros totales de la recette réparties par portion, puis multipliées par le
  nombre de portions effectivement consommées), plus des utilitaires `addNutrition`/
  `scaleNutrition`.
- **Server actions**
  - `src/app/actions/objectifs.ts` : `upsertObjectif` — un objectif par `jour_type`
    (entrainement/repos), upsert sur la contrainte unique `(user_id, jour_type)`.
  - `src/app/actions/journal.ts` : `addJournalEntry` (aliment OU recette consommé, quantité —
    grammes/ml/pièces pour un aliment, nombre de portions pour une recette — date, moment du
    repas), `removeJournalEntry`.
- **Page** `src/app/(app)/journal/page.tsx` : navigation veille/lendemain et sélecteur de type de
  jour (repos/entraînement, en préparation du futur module PPL — pas de calendrier automatique en
  V1, sélection manuelle) via l'URL (`?date=...&jour=...`) ; section objectif (`ObjectifForm`) ;
  résumé du jour avec barres de progression consommé/objectif et reste disponible
  (`ResumeJour`) ; ajout rapide d'un aliment ou d'une recette consommée
  (`AddJournalEntryForm`) ; liste des repas du jour groupés par moment avec kcal calculées et
  suppression (`JournalEntriesList`).

## Tests effectués

- `npx eslint src` : aucun avertissement.
- `npm run build` : compilation + TypeScript OK (y compris l'inférence de types sur la requête
  imbriquée journal → aliment/recette → ingrédients → aliments).
- **Calcul nutritionnel validé par un test unitaire Node** (fonctions pures extraites) sur un cas
  réaliste : une recette « riz-poulet » (2 portions, 300g poulet + 200g riz) donne bien 377,5 kcal
  / 49,2g protéines / 28g glucides / 5,7g lipides pour 1 portion consommée ; combinée à 150g de
  poulet en plus, le total journalier calculé (625 kcal / 95,7g protéines / 28g glucides / 11,1g
  lipides) correspond exactement au calcul manuel de référence.
- **Contrainte XOR vérifiée en base** : une entrée avec aliment_id ET recette_id renseignés est
  rejetée (`23514 check constraint`), tout comme une entrée sans aucun des deux.
- **RLS vérifiée en base** (deux utilisateurs simulés) : objectifs et entrées de journal d'un
  utilisateur totalement invisibles et non modifiables par un autre.
- **Requête imbriquée vérifiée en base** : la structure de données (journal → aliment ou recette
  avec ses ingrédients et leurs aliments) correspond exactement à ce qu'attendent les fonctions de
  calcul, confirmé par une requête SQL reproduisant la jointue de la page.

## Nettoyage transverse : performance RLS

Les Security/Performance Advisors ont été relancés sur l'ensemble du projet après cette dernière
étape :
- **Sécurité : aucun avertissement.**
- **Performance** : deux catégories de recommandations mineures détectées et corrigées via
  `scripts/migration-rls-performance-2026-08-27.sql` :
  - Toutes les policies RLS (32 au total, sur les 8 tables) réécrites pour utiliser
    `(select auth.uid())` au lieu de `auth.uid()` nu, évitant une réévaluation de la fonction à
    chaque ligne (recommandation officielle Supabase à l'échelle).
  - Ajout des index manquants sur les FK `aliment_id`/`recette_id` de `journal_repas`,
    `listes_courses_items` et `placard`.
  - Un sanity check (RLS toujours fonctionnelle après réécriture des 32 policies) a été effectué
    directement en base après application.

### Limite de test inchangée

Comme pour toutes les étapes précédentes, cet environnement bloque les appels réseau sortants vers
`*.supabase.co` : pas de test de parcours utilisateur possible dans un vrai navigateur ici (voir
`RAPPORT-aliments-2026-08-27.md` pour le détail et les options).

## État final de la V1

Les 5 fonctionnalités demandées sont implémentées, testées (lint, build, RLS et logique métier
vérifiées directement en base ou en unitaire) et poussées sur `claude/nutrition-app-init-nohn5u` :

1. CRUD aliments
2. CRUD recettes + ingrédients
3. Liste de courses avec fusion des quantités
4. Placard + recettes réalisables
5. Objectifs nutritionnels + journal de repas + résumé du jour

Prochaine étape naturelle (hors V1) : un vrai test de parcours en navigateur, soit en ajoutant
`*.supabase.co` à la liste blanche réseau de cet environnement, soit en local de ton côté.
