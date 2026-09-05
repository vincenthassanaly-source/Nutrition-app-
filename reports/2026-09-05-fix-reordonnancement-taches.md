# Fix — le réordonnancement des tâches (↑/↓) échangeait parfois avec une tâche archivée invisible

Date : 2026-09-05

## Bug

`reordonnerTaches(id, direction)` (`src/app/actions/taches.ts`, autour de la ligne 403) calcule le "voisin" à échanger en interrogeant **toutes** les tâches de la même `liste_id`, triées par `ordre`, sans distinguer les tâches faites des non faites.

Or l'affichage (`getTachesAvecRelations`, même fichier) trie d'abord par `fait` (non faites en premier) puis par `ordre`, et depuis le rapport du 2026-09-05 (`2026-09-05-agenda-archivage-taches-faites.md` — module Agenda ; le module Tâches avait déjà ce comportement via `2026-08-31-taches-archivage-menu-deroulant.md`), les tâches faites sont rangées dans un menu déroulant "Archivées" fermé par défaut dans `TasksList.tsx`.

Conséquence : `ordre` est une séquence unique et continue par `liste_id`, partagée entre tâches faites et non faites. Vérification via `mcp__Supabase__execute_sql` sur le projet `vsmtkopkqasrdnjceegp` (`select liste_id, id, titre, fait, ordre from taches order by liste_id, ordre;`) : confirmé, par exemple sur la liste `303d42a7-b3dd-4850-ab5a-6d25b8995007`, `ordre` 0 et 1 sont `fait=true` puis `ordre` 2 est `fait=false`, etc. — faites et non faites bien entremêlées dans la même séquence.

Donc cliquer sur ↑/↓ sur une tâche visible en haut/bas de la liste active pouvait calculer comme "voisin" une tâche archivée (invisible, repliée dans le menu déroulant) et échanger son `ordre` avec elle. Le clic ne produisait alors aucun changement visible dans la liste affichée, donnant l'impression que le bouton ne fonctionne pas.

## Correction

Dans `reordonnerTaches` (`src/app/actions/taches.ts`), le voisin est maintenant cherché uniquement parmi les tâches ayant le **même statut `fait`** que la tâche déplacée, en plus du même `liste_id` :

1. La requête initiale sur `courante` sélectionne désormais aussi `fait` (`select("liste_id, fait")` au lieu de `select("liste_id")`).
2. La requête qui récupère la liste ordonnée des tâches voisines ajoute `.eq("fait", courante.fait)` au filtre existant sur `liste_id`.
3. La logique d'échange (swap d'`ordre` entre `actuelle` et `voisine`) est inchangée.
4. `reordonnerSousTaches` n'a pas été touché : les sous-tâches n'ont pas de tri par `fait` à l'affichage, donc pas ce problème.

Diff (`src/app/actions/taches.ts`) :

```diff
   const { data: courante, error: fetchError } = await supabase
     .from("taches")
-    .select("liste_id")
+    .select("liste_id, fait")
     .eq("id", id)
     .single();
   if (fetchError) throw new Error(fetchError.message);

   const { data: taches, error } = await supabase
     .from("taches")
     .select("id, ordre")
     .eq("liste_id", courante.liste_id)
+    .eq("fait", courante.fait)
     .order("ordre", { ascending: true });
```

Le voisin logique correspond désormais toujours au voisin visuel : le bouton ↑/↓ échange la tâche avec la tâche juste au-dessus/en-dessous dans la liste affichée (active ou archivée selon le contexte), jamais avec une tâche de l'autre catégorie.

## Vérifications (Phase 3)

- `node_modules` absent au démarrage de la session → `npm install` effectué (394 paquets, 0 vulnérabilité).
- **`npx tsc --noEmit`** : une première passe isolée signalait une erreur pré-existante et non liée au changement (`src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'`, type généré par Next.js, absent avant toute génération). Après `npm run build` (qui génère `.next/types`), une seconde passe `tsc --noEmit` est **propre, 0 erreur** — y compris avec `fait` ajouté au `select` de `courante`, aucune erreur de type introduite.
- **`npx eslint .`** (ensemble du projet) : 0 erreur, 0 warning.
- **`npm run build`** (Next.js 16.3.3 / Turbopack) : compilation réussie, TypeScript interne au build passé (0 erreur), génération statique des 22 routes OK, y compris `/taches`.

## Fichier touché

- `src/app/actions/taches.ts` (fonction `reordonnerTaches` uniquement)
