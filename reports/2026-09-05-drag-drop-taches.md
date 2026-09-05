# Tâches — remplacement des flèches ↑/↓ par un drag & drop (poignée dédiée)

Date : 2026-09-05

## Contexte

Suite au fix du même jour sur `reordonnerTaches` (`2026-09-05-fix-reordonnancement-taches.md`), Vincent a testé en réel et le mécanisme des flèches restait insatisfaisant. Demande initiale : supprimer complètement les boutons ↑/↓ de réorganisation des tâches et les remplacer par un appui long pour glisser-déposer une tâche, sur le modèle du drag & drop déjà utilisé pour les tuiles de la page d'accueil (`ModulesGrid.tsx` / `NavigationEditContext.tsx`, `@dnd-kit`).

**Itération 1** (appui long sur la carte entière, comme les tuiles) : testée en réel par Vincent, ne fonctionnait pas — une vibration (retour natif du téléphone, pas du code) se déclenchait à l'appui long mais la tâche ne bougeait pas, et le geste suivant faisait défiler l'écran au lieu de déplacer la tâche. Cause : sur une grille 2D (tuiles), `touchAction: "pan-y"` laisse le scroll vertical natif cohabiter avec le drag car le drag utile passe surtout par du mouvement horizontal détecté en JS. Sur une **liste verticale**, le geste de drag (monter/descendre une tâche) est exactement sur le même axe que le scroll de page : le navigateur gagnait systématiquement la course contre le délai d'activation de dnd-kit (400ms), remontant son propre geste de scroll/callout natif avant que le drag ne prenne la main.

**Itération 2** (celle décrite ci-dessous) : le drag part désormais d'une **poignée dédiée** (icône 6 points) sur chaque tâche, avec `touchAction: "none"` limité à cette seule poignée — le reste de la carte garde un scroll natif intact.

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
  - `reorderable=false` : rendu inchangé, `<motion.li layout ...>` gère seul l'animation d'entrée/sortie/repositionnement, pas de poignée affichée.
  - `reorderable=true` : le `<li>` externe (élément DOM brut, pas motion) porte le `ref`/`style.transform` de dnd-kit pendant le drag ; un `<motion.div>` interne garde l'animation framer-motion (`layout`, entrée/sortie) pour les *autres* tâches qui se décalent. Les deux systèmes de transform sont volontairement sur deux nœuds différents : les combiner sur le même nœud les ferait s'écraser l'un l'autre (framer-motion recalcule `style.transform` dès qu'un `animate` avec `y` est actif). Une **poignée** (bouton icône 6 points, `GRIP_ICON`) apparaît alors dans la barre du bas de la carte, à gauche des boutons Modifier/Suppr. : c'est elle, et elle seule, qui porte `attributes`/`listeners` de dnd-kit (déclencheurs du drag) et `style={{ touchAction: "none" }}`.
- Nouveau composant `SortableTachesList` : enveloppe la liste des tâches actives dans un `DndContext` (capteur `PointerSensor`, `activationConstraint: { distance: 4 }`) + `SortableContext` (`verticalListSortingStrategy`). À la fin d'un drag (`handleDragEnd`) :
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

## Pourquoi une poignée dédiée plutôt que la carte entière (retour terrain)

Le premier jet (appui long sur toute la carte, comme les tuiles) a été testé en réel par Vincent et ne fonctionnait pas : vibration au bout de l'appui long (retour haptique natif du téléphone/navigateur — pas quelque chose que le code déclenche pendant un drag, `vibrate()` n'est appelé que sur la case à cocher) mais la tâche restait immobile, puis le geste suivant faisait défiler l'écran.

Explication : sur les tuiles de la page d'accueil (grille 2D), `style={{ touchAction: "pan-y" }}` fonctionne parce que réordonner une tuile implique surtout du mouvement **horizontal**, que `pan-y` laisse justement à la charge de JS (dnd-kit) tout en laissant le scroll vertical natif tranquille. Sur la liste des tâches, réordonner une tâche implique du mouvement **vertical** — le même axe que `pan-y` réserve explicitement au scroll natif. Résultat : dès qu'un doigt bouge verticalement sur une carte, le navigateur peut décider unilatéralement "c'est un scroll" (éventuellement avant même que le délai d'activation de 400ms de dnd-kit n'ait eu la main), et une fois cette décision prise, JS ne peut plus la reprendre — d'où l'écran qui défile au lieu de la tâche qui bouge. C'est le même phénomène que le mode `'manipulation'` déjà écarté pour les tuiles dans `ModulesGrid.tsx` ("le navigateur récupère la main sur un geste tenu mais quasi immobile"), sauf qu'ici il n'existe pas d'équivalent de `pan-y` qui laisserait à la fois le scroll vertical natif ET le drag vertical cohabiter sur le même élément : les deux veulent le même axe.

La solution robuste (et standard dans les apps de tâches à réordonner par glisser-déposer, ex. Todoist, Reminders) est d'isoler le geste de drag sur une **poignée dédiée**, petite zone qui seule reçoit `touchAction: "none"` (empêchant tout scroll natif à cet endroit précis) et les `attributes`/`listeners` de dnd-kit. Le reste de la carte garde son comportement de scroll natif intact. Comme la poignée ne sert à rien d'autre (pas de clic normal à préserver), plus besoin non plus du délai de 400ms qui servait, sur les tuiles, à laisser un tap normal (case à cocher, boutons) passer avant que le drag ne prenne la main : un simple seuil de distance (`activationConstraint: { distance: 4 }`) suffit, rendant le drag plus réactif.

## Vérifications (Phase 3)

- **`npx tsc --noEmit`** : propre, 0 erreur.
- **`npx eslint .`** : une première passe a révélé 5 erreurs `react-hooks/refs` ("Cannot access refs during render") sur une architecture initiale où `useSortable()` était appelé dans un composant wrapper séparé (`SortableTaskCard`) et son résultat passé en prop brute à `TaskCard`, qui lisait ensuite `sortable.setNodeRef`/`.attributes`/`.listeners`/`.isDragging` pendant son propre rendu — la règle interdit de lire, dans un composant, des valeurs issues d'un Hook appelé et retourné par un *autre* composant. Corrigé en appelant `useSortable` directement dans `TaskCard` (même composant que la lecture), comme le fait déjà `ModuleTile` dans `ModulesGrid.tsx`. Après correction : 0 erreur, 0 warning sur l'ensemble du projet.
- **`npm run build`** (Next.js 16.3.3 / Turbopack, `.next` supprimé au préalable pour un build propre) : compilation réussie, TypeScript interne au build passé (0 erreur), génération statique des 22 routes OK, y compris `/taches`.
- **Test navigateur réel** : toujours non réalisable dans cette session — `npm run dev` sur `/taches` échoue avec `Error: Host not in allowlist: vsmtkopkqasrdnjceegp.supabase.co` (règle d'egress réseau du bac à sable qui bloque les appels sortants directs du serveur Next vers Supabase, indépendante du code). C'est cette limitation qui a empêché de détecter le problème de `touchAction` dès l'itération 1 — seul un test sur téléphone réel (fait par Vincent) l'a révélé. **Vincent : merci de retester en réel sur mobile** (poignée 6 points en bas à gauche de chaque tâche active, en vue "Toutes" → appui + glisser sur la poignée → relâcher → l'ordre doit persister au rechargement, et le scroll normal doit fonctionner en touchant le reste de la carte) avant de considérer le sujet clos.

## Fichiers touchés

- `src/app/actions/taches.ts` (`reordonnerTaches` → `enregistrerOrdreTaches`)
- `src/app/(app)/taches/TasksList.tsx` (suppression des flèches, ajout du drag & drop)
- `src/app/(app)/taches/TachesView.tsx` (prop `reordonnable`)
