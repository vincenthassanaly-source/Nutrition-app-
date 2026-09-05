# Tâches — remplacement des flèches ↑/↓ par un drag & drop (appui long)

Date : 2026-09-05

## Contexte

Suite au fix du même jour sur `reordonnerTaches` (`2026-09-05-fix-reordonnancement-taches.md`), Vincent a testé en réel et le mécanisme des flèches restait insatisfaisant. Demande : supprimer complètement les boutons ↑/↓ de réorganisation des tâches et les remplacer par un appui long pour glisser-déposer une tâche, sur le modèle du drag & drop déjà utilisé pour les tuiles de la page d'accueil (`ModulesGrid.tsx` / `NavigationEditContext.tsx`, `@dnd-kit`).

## Ce qui a changé

### `src/app/actions/taches.ts`

`reordonnerTaches(id, direction)` (échange de voisin par `ordre`) est supprimée et remplacée par :

```ts
export async function enregistrerOrdreTaches(updates: { id: string; ordre: number }[]) {
  if (updates.length === 0) return;
  const supabase = await createClient();
  const results = await Promise.all(
    updates.map(({ id, ordre }) => supabase.from("taches").update({ ordre }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  revalidateTachesPaths();
}
```

Elle reçoit une liste de `{ id, ordre }` déjà calculée côté client (voir plus bas) et ne persiste que les lignes dont l'ordre a réellement changé.

`reordonnerSousTaches` (sous-tâches) n'est pas touchée : hors sujet, pas de problème équivalent.

### `src/app/(app)/taches/TasksList.tsx`

- Les deux boutons ↑/↓ de `TaskCard` sont supprimés.
- `TaskCard` accepte un nouveau prop optionnel `reorderable` (défaut `false`). Il appelle `useSortable({ id: tache.id })` de `@dnd-kit/sortable` **inconditionnellement** (règle des Hooks), y compris pour les usages statiques (tâches archivées, module Agenda) où `reorderable` reste `false` : hors d'un `DndContext`/`SortableContext`, dnd-kit retombe sur ses valeurs de contexte par défaut, inertes et sans erreur (vérifié dans `node_modules/@dnd-kit/{core,sortable}` — `defaultInternalContext` et le `Context` par défaut de `SortableContext`).
  - `reorderable=false` : rendu inchangé, `<motion.li layout ...>` gère seul l'animation d'entrée/sortie/repositionnement.
  - `reorderable=true` : le `<li>` externe (élément DOM brut, pas motion) porte le `ref`/`style.transform`/`attributes`/`listeners` de dnd-kit pendant le drag ; un `<motion.div>` interne garde l'animation framer-motion (`layout`, entrée/sortie) pour les *autres* tâches qui se décalent. Les deux systèmes de transform sont volontairement sur deux nœuds différents : les combiner sur le même nœud les ferait s'écraser l'un l'autre (framer-motion recalcule `style.transform` dès qu'un `animate` avec `y` est actif).
- Nouveau composant `SortableTachesList` : enveloppe la liste des tâches actives dans un `DndContext` (capteur `PointerSensor`, `activationConstraint: { delay: 400, tolerance: 8 }` — même réglage d'appui long que les tuiles de la page d'accueil) + `SortableContext` (`verticalListSortingStrategy`). À la fin d'un drag (`handleDragEnd`) :
  1. Recalcule la position de la tâche déplacée dans le tableau (`arrayMove`).
  2. Renumérote l'`ordre` en séquence (0..n-1) **par `liste_id`**, dans l'ordre visuel obtenu — cohérent avec le fix du jour (l'`ordre` reste scoping par liste).
  3. Ne transmet à `enregistrerOrdreTaches` que les tâches dont l'`ordre` a effectivement changé.
  4. Met à jour le cache TanStack Query de façon optimiste (`queryClient.setQueryData`), avec invalidation + toast d'erreur en cas d'échec serveur (même pattern que `handleDragEnd` dans `NavigationEditContext.tsx`).
- `TasksList` gagne un prop `reordonnable` (défaut `false`) qui bascule entre `SortableTachesList` (drag actif) et le rendu `<ul>` statique existant pour la liste des tâches actives. La section « Tâches archivées » repliable n'est jamais réordonnable (son tri suit `updated_at`, pas `ordre` — comportement déjà existant, indépendant de cette modification).

### `src/app/(app)/taches/TachesView.tsx`

`<TasksList reordonnable={vue === "toutes"} .../>`.

## Pourquoi restreindre le drag à la vue "Toutes" (sans filtre de date)

L'`ordre` est scoping par `(liste_id, fait)` : le renumérotage séquentiel après un drag n'est correct que si la liste actuellement affichée contient **l'intégralité** des tâches actives de chaque `liste_id` représentée. C'est garanti quand `vue === "toutes"` (aucun filtre d'échéance), que "Toutes les listes" ou une liste précise soit sélectionnée : tout ce qui existe pour cette/ces liste(s) est visible.

En revanche, sous un filtre "Aujourd'hui" ou "7 jours", seule une sous-partie des tâches actives d'une liste est affichée. Renumérote uniquement ce sous-ensemble visible aurait décalé arbitrairement l'`ordre` des tâches masquées par le filtre (non présentes dans le calcul), sans intention de l'utilisateur. Le drag & drop est donc simplement désactivé (pas de `DndContext`, cartes statiques) dans ces deux vues — la vue par défaut de l'app est déjà "Toutes" (`useState<VueKey>("toutes")` dans `TachesView`), donc le cas courant est couvert dès l'ouverture de l'écran.

Si ce compromis ne convient pas (ex. vouloir réordonner aussi en vue filtrée), il faudra une stratégie différente de persistance (ex. positionnement fractionnaire entre voisins plutôt que renumérotation de groupe) — non implémentée ici pour rester simple sur un premier jet.

## Vérifications (Phase 3)

- **`npx tsc --noEmit`** : propre, 0 erreur.
- **`npx eslint .`** : une première passe a révélé 5 erreurs `react-hooks/refs` ("Cannot access refs during render") sur une architecture initiale où `useSortable()` était appelé dans un composant wrapper séparé (`SortableTaskCard`) et son résultat passé en prop brute à `TaskCard`, qui lisait ensuite `sortable.setNodeRef`/`.attributes`/`.listeners`/`.isDragging` pendant son propre rendu — la règle interdit de lire, dans un composant, des valeurs issues d'un Hook appelé et retourné par un *autre* composant. Corrigé en appelant `useSortable` directement dans `TaskCard` (même composant que la lecture), comme le fait déjà `ModuleTile` dans `ModulesGrid.tsx`. Après correction : 0 erreur, 0 warning sur l'ensemble du projet.
- **`npm run build`** (Next.js 16.3.3 / Turbopack, `.next` supprimé au préalable pour un build propre) : compilation réussie, TypeScript interne au build passé (0 erreur), génération statique des 22 routes OK, y compris `/taches`.
- **Test navigateur réel** : non réalisable dans cette session — `npm run dev` sur `/taches` échoue avec `Error: Host not in allowlist: vsmtkopkqasrdnjceegp.supabase.co` (règle d'egress réseau du bac à sable qui bloque les appels sortants directs du serveur Next vers Supabase, indépendante du code). Cette limitation est propre à l'environnement d'exécution de cette session, pas au code. **Vincent : merci de tester en réel sur mobile/navigateur** (appui long sur une tâche en vue "Toutes" → drag → relâcher → l'ordre doit persister au rechargement) avant de considérer le sujet clos.

## Fichiers touchés

- `src/app/actions/taches.ts` (`reordonnerTaches` → `enregistrerOrdreTaches`)
- `src/app/(app)/taches/TasksList.tsx` (suppression des flèches, ajout du drag & drop)
- `src/app/(app)/taches/TachesView.tsx` (prop `reordonnable`)
