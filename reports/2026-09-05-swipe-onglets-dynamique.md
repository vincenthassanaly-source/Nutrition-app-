# Swipe entre onglets : suivre la barre du bas dynamique

Date : 2026-09-05

## Bug initial

`src/components/TabSwipeWrapper.tsx` naviguait le swipe horizontal entre 4 onglets **codés en dur** :

```ts
const ONGLETS_ORDRE = ["/", "/nutrition", "/taches", "/habitudes"];
```

Or la barre du bas (`BottomNav.tsx`) est dynamique et personnalisable par drag & drop (4 emplacements épinglables), avec l'ordre réel exposé par `modulesBarreBasse` dans `NavigationEditContext` — hydraté côté serveur via `getPreferencesNavigationResolues()` dans `src/app/(app)/layout.tsx`.

Ce tableau statique s'était désynchronisé de la barre réellement affichée (ex. `/agenda` et `/notes` épinglés mais absents du tableau, tandis que `/nutrition` et `/habitudes` y figuraient sans être épinglés). Conséquence : le swipe pouvait naviguer vers un onglet non épinglé, ou ignorer un onglet réellement présent en barre du bas (ex. Notes).

## Fix appliqué

Dans `TabSwipeWrapper.tsx` :
- Suppression du tableau statique `ONGLETS_ORDRE`.
- Lecture de l'ordre réel via `const { modulesBarreBasse } = useNavigationEdit();` (le composant était déjà monté à l'intérieur de `NavigationEditProvider` dans `layout.tsx`, donc pas de risque de throw hors provider).
- `indexOngletActif`, `actif` et `handleSwipe` reposent désormais sur `modulesBarreBasse` au lieu du tableau codé en dur, avec exactement la même logique : pas de wrap-around (borne vérifiée avant `navigate`, no-op hors bornes), "Plus" toujours exclu (il ne fait jamais partie de `modulesBarreBasse`, qui ne contient que les 4 emplacements épinglés — voir `BottomNav.tsx`).
- Commentaires du fichier mis à jour pour décrire la source dynamique (`modulesBarreBasse`) au lieu de l'ancien ordre fixe.
- Vérifié par grep qu'aucune autre partie du code ne référençait `ONGLETS_ORDRE` avant suppression (seule une mention dans un rapport historique, `reports/2026-09-04-fluidite-navigation.md`, non impactée).

Comme l'ordre est maintenant lu depuis le contexte React (state, mis à jour immédiatement après un drag & drop réussi dans `NavigationEditContext.handleDragEnd`), un réordonnancement de la barre du bas est pris en compte par le swipe sans rechargement de page.

## Comportement sur les sous-routes (inchangé)

Le swipe reste actif **uniquement** sur les 4 URL exactes présentes dans `modulesBarreBasse` — jamais sur leurs sous-routes. `indexOngletActif = modulesBarreBasse.indexOf(pathname)` ne matche que sur une correspondance stricte de `pathname`, donc `/agenda/quelquechose`, `/nutrition/journal`, `/nutrition/recettes`, etc. restent hors du mécanisme, exactement comme avant. Cela évite tout conflit avec le swipe dates/semaines déjà présent sur ces écrans (Agenda, Journal Nutrition).

## Vérifications effectuées

- `npm install` (node_modules absent au démarrage de la session).
- `npx tsc --noEmit` : une seule erreur, `src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'` — pré-existante et sans rapport avec ce chantier (type généré par Next.js au build, absent avant `next build`; confirmé identique sur `origin/kilio` avant toute modification via `git stash`).
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` (`next build`) : ✅ build de production réussi, 22 routes générées, TypeScript vérifié en interne par Next.js sans erreur.

## Scénario testé (raisonnement statique, pas d'environnement Supabase dans ce sandbox)

Avec Notes épinglé en position 2 de `modulesBarreBasse` (ex. `["/", "/notes", "/taches", "/habitudes"]`) :
- Sur `/taches` (index 2), swipe vers la gauche (`sens === "suivant"`) → `prochainIndex = 3` → navigue vers `/habitudes`.
- Swipe vers la droite (`sens === "precedent"`) → `prochainIndex = 1` → navigue vers `/notes`, jamais vers `/nutrition` (qui n'est plus dans le tableau).
- Sur le premier élément (`index 0`), swipe vers la droite → `prochainIndex = -1` → no-op (pas de wrap-around), comportement identique à avant.

Ce raisonnement découle directement de la logique de `handleSwipe`, inchangée à l'exception de la source du tableau (`modulesBarreBasse` au lieu de `ONGLETS_ORDRE`).
