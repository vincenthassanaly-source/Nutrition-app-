# Personnalisation de la navigation — grille "Plus" réordonnable + barre du bas configurable

Date : 2026-09-04

## Contexte

Vincent voulait pouvoir (1) réordonner par appui long + glisser-déposer les tuiles de la grille `/plus`, et (2) choisir quels modules occupent les 4 emplacements configurables de la barre de navigation du bas, en glissant une tuile de la grille jusqu'à la barre du bas.

## 1. Modèle de données

Table singleton `preferences_navigation` (une ligne, `id` fixé à `1` par contrainte `check`), cohérente avec le reste de Kilio (mono-utilisateur, sans `user_id` ni RLS) :

- `ordre_grille_plus text[]` — hrefs des modules secondaires, dans l'ordre choisi.
- `modules_barre_basse text[]` — les 4 hrefs épinglés en barre du bas, avec une contrainte `check (array_length(modules_barre_basse, 1) = 4)` (Postgres n'impose pas de longueur sur `text[4]`, la contrainte `check` est donc nécessaire pour réellement garantir 4 emplacements).
- `updated_at`, avec le trigger `set_updated_at()` existant (réutilisé, non redéfini).

Migration : `scripts/migration-preferences-navigation-2026-09-04.sql` (+ `-revert.sql`), appliquée via Supabase MCP sur le projet `vsmtkopkqasrdnjceegp` après vérification par `list_tables` qu'aucune table de préférences n'existait. Ligne insérée avec les valeurs par défaut = comportement actuel (ordre de `MODULES` au moment de l'écriture, `['/', '/nutrition', '/taches', '/habitudes']`).

`src/lib/supabase/types.ts` régénéré via `mcp__Supabase__generate_typescript_types` (fichier entier remplacé, structure/ordre alphabétique identiques à l'existant, `preferences_navigation` insérée à sa place).

## 2. Registre unifié de navigation

`src/lib/navigation/registry.ts` : un seul tableau `NAV_ITEMS` (11 items : Accueil, Nutrition, Tâches, Habitudes, Agenda, Courses, Budget, Objectifs, Collection, Notes, Réglages), chacun avec `href`, `label`, `icon`, `accentVar` (et `description` optionnelle pour les 7 secondaires). Les icônes SVG des 4 modules primaires (copiées depuis l'ancien `BottomNav.ITEMS`) et des 7 secondaires (copiées depuis l'ancien `modules.ts`) sont reprises à l'identique — vérifié par extraction/comparaison automatisée des attributs `path`/`rect`/`circle`, aucune différence.

`src/lib/modules.ts` devient un dérivé du registre : `MODULES = NAV_ITEMS.filter(item => !DEFAULT_MODULES_BARRE_BASSE.includes(item.href))`, en conservant le type `AppModule` existant pour ne rien casser côté consommateurs (`ModulesGrid`, `loading.tsx`).

`resolveActiveHref(pathname)` (dans le registre) remplace les fonctions `match()` ad hoc de l'ancien `BottomNav.ITEMS` : il résout le href **le plus spécifique** correspondant à un pathname donné, quel que soit l'emplacement (grille ou barre du bas) où le module correspondant est actuellement épinglé. **Changement de comportement assumé** : l'ancien code faisait un cas spécial (`/agenda` activait l'onglet "Tâches"). Ce cas spécial disparaît au profit d'une résolution générique : `/agenda` active désormais "Plus" tant qu'Agenda n'est pas épinglé, ou son propre emplacement s'il l'est — plus cohérent avec un système où n'importe quel module peut être épinglé n'importe où.

## 3. Server Actions (`src/app/actions/preferences-navigation.ts`)

- `getPreferencesNavigationResolues()` : lit la ligne unique, puis résout :
  - `ordre_grille_plus` : toute entrée absente du tableau enregistré (nouveau module ajouté plus tard à `MODULES`) est ajoutée en fin de grille par défaut.
  - `modules_barre_basse` : tout href enregistré qui ne correspond plus à un item connu du registre retombe sur l'emplacement par défaut correspondant (évite un onglet cassé/vide).
- `updateOrdreGrillePlus(hrefs)` : `UPDATE` + `revalidatePath('/plus')`.
- `updateModulesBarreBasse(hrefs)` : valide `hrefs.length === 4`, `UPDATE`, puis `revalidatePath('/', 'layout')`.

**Écart assumé par rapport à la consigne initiale** (`revalidatePath('/')`) : `BottomNav` est monté dans `src/app/(app)/layout.tsx`, partagé par toutes les pages de l'app. D'après la doc Next.js (`node_modules/next/dist/docs/.../revalidatePath.md`, section *Revalidating a Layout path*), `revalidatePath('/')` sans le second argument n'invalide que la page `/` elle-même, pas le layout partagé vu depuis une autre route déjà visitée (ex. `/taches`). `revalidatePath('/', 'layout')` invalide le layout et toutes les pages en dessous — le choix correct ici vu que la donnée modifiée est lue par le layout global, pas par une page isolée.

## 4. Mode édition sur `/plus` (`src/components/ModulesGrid.tsx`)

Drag & drop via `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` (ajoutés à `package.json`, absents auparavant). Chaque tuile est un `useSortable` dans un `SortableContext` (`rectSortingStrategy`).

**Choix d'implémentation notable** : plutôt que deux systèmes de détection distincts (un `useLongPress` maison + le drag dnd-kit), l'appui long est géré nativement par `PointerSensor` avec `activationConstraint: { delay: 400, tolerance: 8 }` — le drag ne s'active qu'après ~400ms d'appui sans déplacement de plus de 8px (ce qui laisse le scroll normal fonctionner). L'activation du drag *est* l'entrée en mode édition (`onDragStart` → `setIsEditing(true)`), pas un mécanisme séparé. Simplifie beaucoup l'implémentation et évite deux gestures concurrentes sur la même zone tactile.

- Tremblement façon iOS des tuiles en mode édition : classes CSS `plus-tuile-edition` (`src/app/globals.css`), deux variantes de rotation alternées par tuile, désactivées sous `prefers-reduced-motion: reduce`.
- Indicateur de sortie : bouton "Terminé" (`src/app/(app)/plus/PlusEditBar.tsx`), affiché uniquement en mode édition.
- Sortie aussi par tap en dehors des tuiles / du bouton "Terminé" : un listener `pointerdown` global (dans le Provider, actif seulement quand `isEditing`) ferme le mode édition sauf si la cible a un ancêtre `[data-nav-edit-tile]` ou `[data-nav-edit-exit]`.
- En mode édition, un tap sur une tuile ne navigue plus (le `<Link>` est remplacé par un `<div>` non cliquable) : comme sur l'écran d'accueil iOS en mode jiggle, seuls le drag et la sortie du mode édition restent actifs.
- Persistance : `updateOrdreGrillePlus` appelée en optimistic update (état local mis à jour immédiatement, rollback + toast d'erreur via le `toast-store` existant si l'action échoue).

## 5. Glisser une tuile vers la barre du bas (`src/lib/navigation/NavigationEditContext.tsx`)

**Décision d'architecture principale** : `ModulesGrid` (dans `children`) et `BottomNav` sont deux sous-arbres distincts de `src/app/(app)/layout.tsx`, qui les monte côte à côte. Comme dnd-kit ne requiert pas que draggable et droppable soient proches dans le DOM — seulement descendants du **même** `DndContext` — la solution retenue est de remonter un unique `DndContext` dans `AppLayout`, dans un `NavigationEditProvider` client qui englobe `{children}` (donc `ModulesGrid` quand on est sur `/plus`) et expose son state via un Context React consommé indépendamment par `BottomNav`. Pas besoin de Zustand ni d'un pont d'événements DOM : le Context React suffit puisque `NavigationEditProvider` est justement le point commun le plus proche des deux sous-arbres.

- État possédé par le Provider (et non par `ModulesGrid`/`BottomNav` individuellement) : `ordreGrillePlus`, `modulesBarreBasse`, `isEditing`, `activeHref`. `AppLayout` (Server Component, async) lit `getPreferencesNavigationResolues()` une seule fois par requête et passe le résultat en props initiales ; le Provider les garde ensuite en state client, mis à jour par les Server Actions.
- `BottomNav` expose ses 4 emplacements configurables comme `useDroppable` (id `bottombar-slot-{index}`) ; le bouton "Plus" n'est jamais droppable (zone fixe, hors du tableau `modulesBarreBasse`).
- `onDragEnd` du `DndContext` distingue les deux cas par le préfixe de l'id survolé : `bottombar-slot-*` → épingle (`updateModulesBarreBasse`, avec rollback optimiste identique au (4)) ; sinon → réordonne dans la grille via `arrayMove` + `updateOrdreGrillePlus`.
- `isEditing` est **dérivé** de `isEditingRaw && pathname === "/plus"` (pas synchronisé via un `useEffect` qui appellerait `setState` — heurtait la règle ESLint `react-hooks/set-state-in-effect`, activée par défaut dans `eslint-config-next@16` / `eslint-plugin-react-hooks@7`) : quitter `/plus` fait automatiquement disparaître le tremblement et le bouton "Terminé" ailleurs dans l'app, sans effet de bord.
- Un `DragOverlay` (rendu par le Provider, qui a accès à `activeHref`) affiche un aperçu de la tuile suivant le pointeur pendant le drag, y compris au-dessus de `BottomNav`.
- Collision detection : `pointerWithin` (plus fiable que `closestCenter` pour de petites zones de dépôt comme les emplacements de la bottom nav).

Pas de repli "bouton épingler" nécessaire : le drag cross-composant fonctionne avec cette architecture sans complexité additionnelle notable, une fois le `DndContext` remonté au bon endroit.

## Limitations connues

- **Vérification manuelle non effectuée en conditions réelles.** Ce sandbox n'a pas d'accès réseau sortant vers `*.supabase.co` (confirmé aussi dans `reports/2026-09-04-fluidite-navigation.md` pour un autre chantier) : `src/app/(app)/layout.tsx` étant désormais lui-même async et dépendant d'une lecture Supabase, **toutes** les pages sous `(app)` renvoient 500 en local dans ce sandbox (pas seulement les pages à données, comme c'était le cas avant ce chantier) — impossible d'ouvrir `/plus` dans un navigateur ici pour valider visuellement l'appui long, le tremblement, le drag de réordonnancement et le drop sur la bottom nav. La vérification s'est donc limitée à : `tsc --noEmit` ✅, `eslint .` ✅, `next build` ✅ (22 routes, aucune régression), une comparaison automatisée des icônes/couleurs/labels contre l'ancien code (voir §2), et une relecture manuelle attentive de la logique de `NavigationEditContext.tsx` (résolution des ids de drop, rollback optimiste, dérivation de `isEditing`). **Vincent devrait tester manuellement l'appui long + drag sur son téléphone avant de considérer ce chantier définitivement validé**, notamment la sensation du délai de 400ms et l'interaction `touch-action: none` avec le scroll de la page.
- Le comportement de mise en évidence de l'onglet actif change légèrement pour `/agenda` (voir §2) : ce n'est plus jamais "Tâches" qui s'allume, mais "Plus" (par défaut) ou "Agenda" lui-même s'il est épinglé.
- La contrainte `check (array_length(modules_barre_basse, 1) = 4)` protège la base contre un tableau de mauvaise taille, mais seulement au niveau SQL — c'est aussi vérifié côté Server Action (`updateModulesBarreBasse`) avant l'appel réseau.
- Existant, non lié à ce chantier : les 31 tables du projet Supabase Kilio (dont la nouvelle `preferences_navigation`) ont RLS désactivé, cohérent avec le choix mono-utilisateur déjà fait pour tout le reste de l'app (`migration-suppression-auth-2026-08-29.sql`) — signalé ici pour mémoire, sans action proposée puisque déjà le pattern établi.

## Fichiers créés/modifiés

**Créés** : `scripts/migration-preferences-navigation-2026-09-04.sql` (+ `-revert.sql`), `src/lib/navigation/registry.ts`, `src/lib/navigation/NavigationEditContext.tsx`, `src/app/actions/preferences-navigation.ts`, `src/app/(app)/plus/PlusEditBar.tsx`.

**Modifiés** : `src/lib/supabase/types.ts` (régénéré), `src/lib/modules.ts`, `src/components/ModulesGrid.tsx`, `src/components/BottomNav.tsx`, `src/app/(app)/layout.tsx`, `src/app/(app)/plus/page.tsx`, `src/app/globals.css`, `package.json`/`package-lock.json` (ajout `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`).
