# Fiabilité de l'activation du drag + preview live d'échange (grille "Plus" / barre du bas)

Date : 2026-09-05

## Contexte

Deux sujets sur le mode édition de la grille `/plus` (`ModulesGrid.tsx` / `NavigationEditContext.tsx`) :

1. L'appui long ne déclenche pas toujours le drag du premier coup — retry occasionnel nécessaire.
2. Pendant le drag, aucune preview visuelle n'indique quelle tuile va prendre la place de qui, ni dans la grille, ni pour l'épinglage en barre du bas.

## 1. Investigation du bug d'activation

### Mécanisme trouvé dans le code source de dnd-kit (`@dnd-kit/core@6.3.1`)

`PointerSensor`, `TouchSensor` et `MouseSensor` sont tous les trois de simples spécialisations d'une seule classe interne, `AbstractPointerSensor` (`node_modules/@dnd-kit/core/dist/core.cjs.development.js:1388`). Avec un `activationConstraint: { delay, tolerance }`, son fonctionnement est :

- au `pointerdown` (ou `touchstart`), elle démarre un `setTimeout(handleStart, delay)` et écoute les mouvements ;
- à chaque mouvement, si le déplacement cumulé depuis le point de départ dépasse `tolerance`, elle appelle `handleCancel()` (annulation, comportement voulu et documenté) ;
- **mais elle attache aussi, de façon inconditionnelle et dès le `pointerdown`, un listener sur l'événement d'annulation natif du navigateur** (`pointercancel` pour `PointerSensor`, `touchcancel` pour `TouchSensor`) qui appelle `handleCancel()` immédiatement, **sans jamais consulter le délai ni la tolérance** (lignes 1445-1447 et 1586-1598).

Autrement dit, la temporisation de 400ms et les 8px de tolérance ne protègent que contre les mouvements que dnd-kit voit lui-même en JavaScript. Elles ne protègent pas contre la décision du navigateur de "prendre la main" sur le geste pour son propre système de reconnaissance de gestes (panning natif), décision prise indépendamment, sur un thread différent (compositor), avec ses propres seuils internes. Si le navigateur gagne cette course, il annule la séquence de pointeur/touch en cours **avant** que les 400ms ne soient écoulés, sans que la tolérance JS de 8px ait été dépassée — d'où un appui qui "ne prend pas" de façon intermittente, dépendant de micro-variations du geste réel.

C'est exactement l'hypothèse de la consigne, confirmée par lecture du code source plutôt que par supposition.

### Tentative de reproduction empirique

Un test physique sur téléphone n'étant pas possible dans cet environnement, j'ai tenté une reproduction via Chromium headless (Playwright + CDP `Input.dispatchTouchEvent`, contexte `hasTouch: true`/`isMobile: true`) avec une page autonome répliquant fidèlement la logique de `AbstractPointerSensor` (délai 400ms, tolérance 8px, écoute de `pointercancel`/`touchcancel`) sur des tuiles en `touch-action: pan-y`.

**Résultat : inconclusive.** Même avec un déplacement synthétique dépassant largement le seuil de panning natif habituel (jusqu'à 60px cumulés), Chromium headless n'a déclenché **aucun** `pointercancel`/`touchcancel` natif, et n'a **pas non plus** effectué de scroll réel de la page (`window.scrollY` reste à 0 après le geste). Ceci confirme une limite connue de l'émulation tactile via CDP en mode headless : `Input.dispatchTouchEvent` alimente le pipeline d'événements mais ne déclenche pas l'arbitrage de gestes du compositeur (scroll natif par balayage) comme le ferait un vrai écran tactile — donc cet environnement ne peut ni confirmer ni infirmer la course en conditions réelles, seulement la lecture du code source le permet. Le script de reproduction est conservé (non committé) dans le scratchpad de session si une future investigation souhaite le reprendre sur un environnement avec un vrai pipeline tactile.

Je n'ai pas ajouté de `console.log` dans le code applicatif livré : les callbacks exposés par `DndContext` (`onDragStart`/`onDragCancel`) ne donnent de toute façon pas accès à la raison de l'annulation (tolérance JS vs `pointercancel` natif) — cette information n'existe qu'à l'intérieur de dnd-kit, déjà lue directement en `1.` ci-dessus. Ajouter des logs sans pouvoir les observer sur un vrai appareil n'aurait rien apporté de plus que cette lecture de code.

## 2. Correctif tenté puis abandonné : `MouseSensor` + `TouchSensor` au lieu de `PointerSensor`

**⚠️ Ce correctif a été revert après déploiement — voir "Correction post-déploiement" plus bas.** Conservé ici tel qu'initialement raisonné, par transparence sur la démarche.

`NavigationEditContext.tsx` utilisait un seul `PointerSensor`. Remplacé par `useSensor(MouseSensor, ...)` + `useSensor(TouchSensor, ...)`, avec le même `activationConstraint: { delay: 400, tolerance: 8 }` pour les deux.

**Pourquoi ça doit réduire le problème**, même si `TouchSensor` partage la même classe `AbstractPointerSensor` que `PointerSensor` (donc le même mécanisme de délai/tolérance, voir ci-dessus) : la différence utile n'est pas dans cette logique commune, mais dans **quel événement natif d'annulation est écouté**.

- `pointercancel` est normativement déclenché par la spec Pointer Events précisément quand *"the browser decides to control [pointer] events e.g. panning"* — le comportement est explicitement écrit pour se déclencher dès que le navigateur reconnaît une intention de pan, ce qui en fait un signal **très réactif**, potentiellement avant que l'utilisateur ait consciemment bougé son doigt de façon significative.
- `touchcancel` (spec Touch Events, plus ancienne) est réservé à des interruptions plus rares de la séquence tactile (ex. alerte système, trop de points de contact) ; les navigateurs mobiles ne le déclenchent en pratique pas pour un simple pan pris en charge nativement — ils continuent typiquement à délivrer les `touchmove` pendant que le scroll natif se produit en parallèle.

En clair : sur mobile, avec `PointerSensor`, le navigateur peut couper le drag en cours d'activation dès qu'il commence à envisager un scroll ; avec `TouchSensor`, cette coupure prématurée est nettement moins probable pour le même geste, réduisant la fenêtre de course décrite en `1.`. `MouseSensor` est conservé pour le pointeur souris/trackpad (pas concerné par ce problème, et `MouseSensor` s'active sur `onMouseDown` natif, sans recouvrement possible avec `TouchSensor`).

C'est le correctif que dnd-kit recommande lui-même dans sa documentation pour ce cas de figure (dissocier explicitement souris et tactile plutôt que le `PointerSensor` unifié) — retenu comme première ligne de défense, sans toucher `delay`/`tolerance` pour l'instant (voir Limitations).

`touchAction: "pan-y"` sur les tuiles est inchangé : il reste nécessaire pour garder le scroll vertical natif fluide en usage normal (hors édition), et n'est pas la cause du problème identifié ci-dessus (le problème vient de la course sur l'annulation, pas du `touch-action` en tant que tel).

## 3. Preview live en échange direct pendant le drag

Dans `NavigationEditContext.tsx` :

- **Instantané au `dragStart`** (`dragStartSnapshotRef`) : capture `ordreGrillePlus` et `modulesBarreBasse` avant toute mutation, sert de base pure de calcul pour chaque survol et de référence de rollback (jamais l'état juste avant le dernier survol).
- **`onDragOver`** : à chaque changement de cible survolée (dédupliqué via `lastOverIdRef` — un survol immobile ne redéclenche aucun recalcul ni re-render), le preview est **recalculé intégralement depuis l'instantané du `dragStart`** plutôt qu'accumulé depuis l'état courant :
  - survol d'une tuile de la grille → échange direct des deux positions dans `ordreGrillePlus` via `arraySwap` (`@dnd-kit/sortable`), pas un `arrayMove` de liste réordonnée ;
  - survol d'un slot `bottombar-slot-N` → `modulesBarreBasse[N]` prend `draggedHref` en local, sans appel Server Action ;
  - changer de type de cible en cours de geste (ex. survoler une tuile de la grille puis finalement la barre du bas) annule automatiquement l'autre preview, puisque tout est recalculé depuis l'instantané à chaque survol.

  Ce calcul "pur" (toujours `f(instantané, cible actuelle)`, jamais `f(état déjà muté, cible actuelle)`) évite les bugs de swaps qui s'accumuleraient de façon incohérente si l'utilisateur survole plusieurs tuiles à la suite, et sert nativement de throttling : seul un changement réel de cible provoque un `setState`.
- **`handleDragEnd`** : l'état local reflète déjà le résultat final au lâcher. Persistance directe de l'état courant (`updateOrdreGrillePlus` ou `updateModulesBarreBasse` selon que le dernier survol visait la grille ou un slot de barre du bas), avec rollback vers l'instantané du `dragStart` en cas d'échec réseau — jamais vers un état intermédiaire. Un lâcher hors de toute cible, ou sur la tuile d'origine (aucun changement réel), ne déclenche aucun appel réseau.
- **`handleDragCancel`** : restauration intégrale à l'instantané du `dragStart`, sans persistance.

Aucun changement nécessaire dans `ModulesGrid.tsx` (le `rectSortingStrategy` de `SortableContext` anime déjà automatiquement les tuiles vers leur nouvelle position dès que l'ordre change, qu'il s'agisse d'un `arrayMove` ou d'un `arraySwap`) ni dans `BottomNav.tsx` (chaque slot affiche déjà le module courant de `modulesBarreBasse[index]`, donc la mise à jour locale pendant `onDragOver` suffit à faire apparaître visuellement la tuile déplacée à la place de l'ancienne, avant le lâcher).

## Correction post-déploiement : régression sur téléphone réel

**Retour terrain de Vincent après déploiement** : avec `TouchSensor` + `MouseSensor`, le drag ne s'activait plus **du tout** (0% de réussite, à chaque tentative), contre un problème seulement intermittent avec `PointerSensor` — et l'appui long finissait alors interprété comme un simple tap, déclenchant la navigation normale du `<Link>` vers le module, laquelle échouait ("This page couldn't load", l'écran d'erreur réseau natif du navigateur — pas une erreur applicative).

Ce résultat contredit directement l'hypothèse de la spec (`touchcancel` plus rare que `pointercancel`) : soit elle ne s'applique pas telle quelle sur ce navigateur/appareil précis (Brave sur Android), soit un autre effet de bord du changement de sensor (ex. `TouchSensor` attache ses listeners `touchmove`/`touchend` directement sur le nœud DOM de la tuile plutôt que sur `document`, contrairement à `PointerSensor`/`MouseSensor` — une piste plausible mais non confirmée faute de pouvoir tester sur cet appareil) est en cause. **Revert immédiat vers `PointerSensor` seul**, en conservant intégralement la preview live (§3, indépendante du sensor utilisé).

**Conséquence** : le problème de fiabilité d'origine (activation intermittente, 1-2 essais parfois nécessaires) n'est donc **pas résolu** par ce chantier — seule la régression introduite par la tentative de correctif a été annulée, revenant au comportement antérieur (imparfait mais fonctionnel). Toute nouvelle tentative sur ce point (ajustement `delay`/`tolerance`, ou `touchAction: "none"` en dernier recours, voir plus bas) devrait être testée un changement à la fois, avec confirmation de Vincent entre chaque, plutôt que combinée avec d'autres changements.

## Vérifications

- `next build` (inclut le typecheck TypeScript) : ✅, 22 routes, aucune régression.
- `eslint` sur les fichiers modifiés : ✅, aucun avertissement.
- Schéma Supabase (`list_tables`, projet `vsmtkopkqasrdnjceegp`) : `preferences_navigation` inchangée, aucune migration nécessaire pour ce chantier — confirmé.
- Pas de vérification visuelle possible dans ce sandbox (pas de navigateur interactif, et la génération de preview tactile réelle n'est de toute façon pas reproductible en headless, voir §1) : relecture manuelle attentive de la logique de swap/rollback/dédoublonnage en remplacement.

## Limitations et point en suspens pour Vincent

- **Le problème de fiabilité d'activation d'origine reste ouvert.** `TouchSensor`+`MouseSensor` a été essayé et a régressé (voir plus haut) ; le comportement est donc revenu à l'état d'avant ce chantier (intermittent, 1-2 essais parfois nécessaires). Pistes restantes, par ordre de risque croissant, à tester **une à la fois** avec confirmation de Vincent entre chaque : (a) affiner `delay`/`tolerance` sur `PointerSensor` (ex. délai légèrement réduit, tolérance légèrement augmentée) ; (b) en dernier recours, `touchAction: "none"` sur les tuiles supprimerait complètement le scroll natif pendant que le doigt est posé sur une tuile, y compris hors mode édition — un compromis produit (scroll natif vs fiabilité du drag) que je n'ai **pas** appliqué, faute de validation explicite.
- **Test manuel obligatoire sur téléphone.** Cet environnement ne dispose pas d'écran tactile physique, et l'émulation CDP headless ne reproduit pas l'arbitrage de gestes natif du navigateur (voir §1) — elle ne peut donc pas garantir que le correctif résout réellement le problème en conditions réelles. Merci de tester l'appui long + drag (réordonnancement grille et épinglage barre du bas) sur ton téléphone après déploiement, dans plusieurs conditions (appui bien immobile, appui légèrement instable comme un usage normal) avant de considérer ce chantier définitivement validé.
- RLS désactivée sur `preferences_navigation` (et les 31 autres tables du projet) : existant, cohérent avec le choix mono-utilisateur déjà acté pour toute l'app, sans lien avec ce chantier — signalé pour mémoire uniquement.

## Fichiers modifiés

`src/lib/navigation/NavigationEditContext.tsx` (sensors, snapshot de drag, `onDragOver`, `handleDragEnd`, `handleDragCancel`). Aucun autre fichier touché.
