# Rapport — Logging d'un aliment en pièce(s) sans pesée (2026-08-28)

## Objectif

Permettre de logger un aliment dans le journal en grammes **ou** en unité(s)
"pièce" (ex : 1 banane), sans réintroduire de macros "pour 100 pièces" — les
macros de référence (`kcal_100g`, `proteines_100g`, etc.) restent toujours
exprimées pour 100g.

## Vérification du schéma existant (étape 1)

- `aliments` (`scripts/migration-aliments-2026-08-27.sql`) : colonnes macros
  en `xxx_100g`, enum `unite_mesure` (`g` / `ml` / `piece`) déjà présent pour
  l'unité d'achat/affichage, RLS par `user_id`.
- `aliments-macros-detaillees` : ajoute `sucres_100g`,
  `acides_gras_satures_100g`, `fibres_100g`, `sel_100g` — toujours en base
  100g, confirme le pattern à suivre pour la nouvelle colonne.
- `journal_repas` (`scripts/migration-journal-repas-2026-08-27.sql`) :
  colonne `quantite numeric(7,2) check (quantite > 0)`, pas d'unité propre —
  la quantité est toujours interprétée dans l'unité native de l'aliment
  (grammes dans la pratique : tous les aliments seedés utilisent `unite='g'`,
  y compris "Œuf dur").
- `src/lib/nutrition/compute.ts` (`nutritionAliment`) : calcule
  `quantite / 100 * xxx_100g` — donc **aucune modification nécessaire** tant
  que la quantité stockée en base reste en grammes.

Ces vérifications confirment que la conversion pièces → grammes peut se
faire uniquement côté formulaire/server action, avant l'insert, sans toucher
au schéma de `journal_repas` ni au calcul des macros.

## Fichiers créés

- `scripts/migration-aliments-poids-unite-2026-08-28.sql` : ajoute
  `poids_unite_g numeric(6,2)` nullable sur `aliments`, avec
  `check (poids_unite_g > 0)`. Commentaire dans le fichier précisant que ce
  champ ne sert qu'à convertir une saisie en pièces vers des grammes, et que
  les macros restent pour 100g. L'enum `unite_mesure` n'est pas modifié.

## Fichiers modifiés

- `src/lib/supabase/types.ts` : ajout de `poids_unite_g: number | null` dans
  `Row` / `Insert` / `Update` de la table `aliments` (types maintenus à la
  main dans ce projet, comme pour les colonnes ajoutées par la migration
  macros détaillées).
- `src/app/actions/aliments.ts` : `parseAlimentInput` lit et valide
  `poids_unite_g` (optionnel, doit être un nombre positif si renseigné) ;
  `createAliment`/`updateAliment` l'enregistrent via le même objet
  `parsed.value` déjà inséré/mis à jour.
- `src/app/(app)/aliments/AlimentForm.tsx` : le select `unite` devient
  contrôlé (`useState`) ; un champ "Poids moyen d'une pièce (g)" (number,
  step 1, min 1, optionnel) s'affiche uniquement quand `unite === "piece"`.
- `src/app/(app)/journal/AddJournalEntryForm.tsx` :
  - suit l'aliment sélectionné (`alimentId`) pour lire son `poids_unite_g` ;
  - affiche un toggle "Grammes / Pièce(s)" (même style que le toggle
    Aliment/Recette) uniquement si `type === "aliment"` et que l'aliment
    sélectionné a un `poids_unite_g` défini ;
  - en mode "Pièce(s)" : label "Quantité (en pièces)", placeholder "ex: 1",
    `step="0.1"`, texte d'aide "≈ Xg" recalculé en direct
    (`poids_unite_g * quantité saisie`, arrondi à l'entier) ;
  - transmet le mode choisi via un input caché `saisie_mode` ;
  - pour les recettes, le toggle n'apparaît jamais et le comportement est
    inchangé.
- `src/app/actions/journal.ts` (`addJournalEntry`) : lit `saisie_mode`
  (`"grammes"` par défaut, valeur validée) ; si `saisie_mode === "piece"`,
  recharge l'aliment concerné, vérifie que `poids_unite_g` est bien défini
  (sinon erreur explicite : "Cet aliment n'a pas de poids par pièce
  défini..."), puis convertit `quantite_saisie * poids_unite_g` en grammes
  **avant** l'insert dans `journal_repas`. La colonne `quantite` stockée
  reste donc toujours en grammes/ml, sans changement de schéma sur
  `journal_repas`.

## Vérifications (étape 6)

- `nutritionAliment` n'a pas été touché : comme la conversion pièces→grammes
  a lieu avant l'insert, la quantité en base reste en grammes et le calcul
  `quantite / 100 * xxx_100g` fonctionne sans changement.
- Aliments existants sans `poids_unite_g` (tous les aliments actuels du
  catalogue) : `poids_unite_g` vaut `null`, le toggle Grammes/Pièce(s) ne
  s'affiche jamais pour eux, le formulaire de journal se comporte exactement
  comme avant (mode "grammes" implicite, `saisie_mode` envoyé mais ignoré
  côté conversion). Aucune régression.
- `npx tsc --noEmit` : aucune erreur introduite (la seule erreur restante,
  `Cannot find name 'LayoutProps'` dans `src/app/layout.tsx`, est
  préexistante — confirmée identique avant les modifications via
  `git stash` — et provient des types générés par Next.js, pas de ce
  changement).
- `npx eslint` sur les fichiers modifiés : aucune erreur.

## Écarts par rapport au prompt

- Le prompt suppose que les macros sont "déjà" en base 100g dans tous les
  cas. En réalité, `unite_mesure` contient une valeur `piece` préexistante
  et `AlimentForm.tsx` affichait déjà un libellé conditionnel
  "Kcal / 100 pièce" quand `unite === "piece"` — un affichage resté inutilisé
  en pratique (tous les aliments seedés, y compris ceux qui se comptent à la
  pièce comme l'œuf dur, utilisent `unite = 'g'`). Ce comportement préexistant
  n'a pas été modifié : il est hors du périmètre demandé et une aliment
  "unite=piece" avec macros pour 100 pièces reste possible côté schéma. La
  nouvelle fonctionnalité (toggle Grammes/Pièce au moment du log) est
  indépendante de ce champ `unite` et repose uniquement sur la présence de
  `poids_unite_g` sur l'aliment.
- Aucun autre écart : toutes les étapes (migration, formulaire aliment,
  formulaire journal, server action, non-régression) ont été implémentées
  telles que décrites.
