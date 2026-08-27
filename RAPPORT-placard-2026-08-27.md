# Rapport — Étape 4 : Placard

Date : 2026-08-27

## Ce qui a été construit

- **Server actions** (`src/app/actions/placard.ts`)
  - `upsertPlacardItem` : ajoute ou met à jour (via `upsert` sur la contrainte unique
    `(user_id, aliment_id)`) la quantité disponible d'un aliment, avec date de péremption
    optionnelle.
  - `updatePlacardQuantite` (édition rapide inline), `removePlacardItem`.
- **Logique de matching** (`src/lib/nutrition/matching.ts`) : fonction pure
  `matchRecetteAvecPlacard(ingredients, placard)` — une recette est réalisable si, pour chaque
  ingrédient, la quantité disponible au placard (0 si l'aliment est absent) est ≥ la quantité
  requise ; sinon la fonction retourne la liste des ingrédients manquants avec la quantité qui
  manque. Pas de conversion d'unité (cohérent avec la décision validée à l'étape 2 : l'unité du
  placard est toujours celle de l'aliment, comme celle des ingrédients de recette).
- **Page** `src/app/(app)/placard/page.tsx` :
  - Section placard : formulaire d'ajout/mise à jour, liste avec édition rapide de quantité,
    suppression, alerte visuelle si la date de péremption est à moins de 3 jours.
  - Section « Recettes réalisables » : calcule pour chaque recette visible (personnelle +
    partagée) si elle est réalisable avec le placard actuel ; sinon affiche les ingrédients et
    quantités manquants. Les recettes réalisables sont mises en avant en premier.

## Tests effectués

- `npx eslint src` : un problème détecté et corrigé — la nouvelle règle React (« impure function
  during render ») interdisait l'appel direct à `Date.now()` dans le rendu ; corrigé avec
  `useState(() => Date.now())` (pattern React standard pour une valeur figée au montage).
- `npm run build` : compilation + TypeScript OK.
- **Upsert et RLS vérifiés directement en base** : ajout initial puis mise à jour de la même paire
  `(user_id, aliment_id)` via `on conflict` → une seule ligne, quantité bien remplacée (pas de
  doublon). Un autre utilisateur ne voit aucune ligne du placard du premier, et toute tentative de
  modification/suppression sur son placard n'affecte aucune ligne (placard intact vérifié après
  coup).
- **Logique de matching testée unitairement** (Node, fonction pure extraite) sur un cas réaliste à
  deux recettes partageant un ingrédient : avec un placard contenant assez de pâtes et de sauce
  tomate mais aucun parmesan, la recette « bolo » ressort réalisable et la recette « carbo »
  ressort incomplète avec le parmesan manquant (30g) — conforme à l'attendu.
- Données de test entièrement nettoyées après vérification.

### Limite de test inchangée

Comme pour les étapes précédentes, cet environnement bloque les appels réseau sortants vers
`*.supabase.co` : pas de test de parcours utilisateur possible dans un vrai navigateur ici (voir
`RAPPORT-aliments-2026-08-27.md` pour le détail et les options).

## Prochaine étape

Étape 5 : objectif calorique (kcal/macros par type de jour) + journal de repas quotidien + résumé
du jour.
