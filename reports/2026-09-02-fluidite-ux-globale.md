# Passe globale de fluidité UX — 2026-09-02

## Résumé

Mise en place de TanStack Query côté client, de skeleton screens réutilisables
et d'animations Framer Motion sobres sur les modules à plus fort trafic
(Dashboard, Tâches, Notes, Courses, Habitudes), avec chargement optimiste sur
les actions fréquentes à faible risque (cocher une tâche/habitude, ajouter/
cocher un article de courses, épingler/cocher un item de note). Les Server
Actions existantes (`src/app/actions/*.ts`) n'ont pas été modifiées dans leur
logique métier ; seule la couche d'appel côté client a changé.

## Modules migrés vers TanStack Query

| Module | Lecture | Mutation optimiste |
|---|---|---|
| Dashboard (`/`) | `useQuery` par section (nutrition, tâches du jour, prochain événement, habitudes), chacune avec son propre skeleton | cocher une tâche/habitude (cache partagé avec Tâches/Habitudes) |
| Tâches (`/taches`) | `useQuery` taches/listes/tags | cocher/décocher, supprimer |
| Notes (`/notes`) | `useQuery` notes/tags | épingler, cocher un item de checklist, supprimer |
| Courses (`/courses`) | `useQuery` | ajouter un article, cocher, supprimer |
| Habitudes (`/habitudes`) | `useQuery` (types booléen/série) | cocher/décocher |

Pour ces cinq modules, `page.tsx` est redevenu un shell serveur synchrone
(plus d'attente réseau avant le premier rendu) ; les données sont chargées
côté client par TanStack Query, avec un skeleton pendant `isLoading` et un
message d'erreur discret (`errorText`) si la requête échoue — testé en
conditions réelles (voir "Vérifications" : le sandbox de cette session bloque
l'accès sortant à Supabase, ce qui a permis de vérifier ce cas concrètement).

Choix d'architecture central : les mêmes query keys (`src/lib/query/keys.ts`)
sont utilisées sur plusieurs pages (ex. `taches` sur `/` et `/taches`,
`habitudes(date)` sur `/` et `/habitudes`) — cocher une tâche depuis le
dashboard met donc instantanément à jour la page Tâches si elle est déjà en
cache, et inversement.

Les mutations moins fréquentes des mêmes modules (réordonner, sous-tâches,
tags, édition d'une tâche/note/habitude existante) restent sur le pattern
`useTransition` + Server Action déjà en place, mais invalident désormais la
query correspondante en fin d'action pour rester cohérentes avec le cache
client (elles n'étaient pas listées comme "fréquentes/faible risque" dans le
prompt, donc pas de mise à jour optimiste dessus).

## Modules non migrés (et pourquoi)

- **Journal Nutrition (`/nutrition/journal`)** : reste en Server Component
  (navigation entre jours pilotée par l'URL via `<Link>`, déjà instantanée
  grâce au prefetch). La suppression d'une entrée est passée en optimiste via
  `useOptimistic` (React 19) plutôt que TanStack Query, pour éviter de
  dupliquer la logique de calcul des macros déjà présente dans `page.tsx` sans
  bénéfice perceptible côté UX. Un `loading.tsx` (skeleton) couvre le chargement
  serveur initial.
- **Agenda, Budget, Objectifs, Collection, Recettes** : laissés en Server
  Component inchangés — logique de lecture plus complexe (agenda : swipe/zoom
  déjà animés en CSS pur, cf. rapport du 2026-09-02 sur le swipe ; budget :
  agrégations multi-tables interdépendantes ; objectifs/collection/recettes :
  trafic plus faible que Tâches/Notes/Courses/Habitudes). Un `loading.tsx`
  (skeleton, via les composants de `src/components/skeletons/`) a été ajouté
  sur leurs pages d'entrée pour remplacer l'écran blanc pendant le rendu
  serveur, sans toucher à leur logique de données. Migration TanStack Query
  possible dans une session ultérieure si Vincent le souhaite.
- **Collection** garde son data-fetching serveur mais reçoit l'animation en
  cascade demandée par le prompt (voir plus bas).

## Composants skeleton créés (`src/components/skeletons/`)

- `Skeleton.tsx` : primitif (rectangle `animate-pulse` sur `bg-surface-alt`).
- `CardSkeleton.tsx` : silhouette carte dashboard (ring + 2 lignes).
- `ListItemSkeleton.tsx` / `ListItemSkeletonGroup` : ligne de liste (puce
  ronde + texte), utilisée par Tâches/Notes(vide)/Courses/Habitudes/Agenda/
  Objectifs/Recettes.
- `GridSkeleton.tsx` : grille masonry à hauteurs variables (Notes, Collection).
- `DashboardSkeleton.tsx` : composé pour un futur usage bloquant (non utilisé
  directement — le dashboard actuel affiche un skeleton par section plutôt
  qu'un seul bloc, jugé plus proche de "meaningful loading states" recommandé
  par la doc Next.js 16 lue en Phase 1).

## Animations Framer Motion ajoutées

- **`CheckToggle`** (coche partagée tâches/sous-tâches/habitudes/notes) :
  micro-pop du cercle (`scale 1 → 1.15 → 1`, 180ms) + tracé du check qui
  apparaît/disparaît (150ms).
- **Listes** (Tâches, Courses, Journal, Notes) : `AnimatePresence` +
  fondu/slide vertical de 8px sur ajout/suppression (180ms), avec `layout`
  pour un réarrangement fluide.
- **Grille Collection** (`CollectionsGrid`, `PhotosGrid`) : apparition en
  cascade légère (fondu + `y: 12px` ou `scale: 0.9→1`, delta de délai ≈30ms
  par élément plafonné à 300-350ms de décalage total) — demandé explicitement
  au prompt 2.3.
- **Tuiles du dashboard/module (`ModulesGrid`, cartes dashboard)** :
  `whileTap={{ scale: 0.96-0.98 }}` pour un feedback tactile immédiat, plus un
  léger fondu en cascade à l'affichage de `ModulesGrid`.
- **Toasts d'erreur** (`ToastHost`) : fondu + léger slide, 180ms.

Toutes les durées sont dans la fourchette 150-250ms demandée ; aucune
transition de page complète (dashboard → module) n'a été ajoutée — Next.js
gère déjà cette transition par le streaming RSC natif, et une surcouche
d'animation de route aurait ajouté de la latence perçue plutôt que d'en
retirer, à l'inverse de l'objectif du prompt.

## Cache optimiste et gestion d'erreur

Chaque mutation optimiste suit le même schéma : `onMutate` met à jour
`queryClient.setQueryData` immédiatement (avec capture de l'état précédent),
`onError` restaure cet état et déclenche un toast discret
(`showToast(...)`, `src/components/toast/toast-store.ts` — petit pub-sub sans
dépendance, pas de librairie de toast ajoutée), `onSettled` invalide la query
pour resynchroniser avec le serveur (la logique métier serveur, ex.
récurrence d'une tâche cochée, n'est jamais dupliquée côté client).

## Bug trouvé et corrigé pendant la vérification manuelle

`ToastHost.tsx` utilisait `useSyncExternalStore(subscribe, getSnapshot, () =>
[])` avec un `getServerSnapshot` renvoyant un nouveau littéral `[]` à chaque
appel — React log une boucle infinie potentielle
("The result of getServerSnapshot should be cached..."). Corrigé avec une
constante de module stable. Détecté uniquement grâce au test manuel en
navigateur (voir ci-dessous), pas par `tsc`/ESLint/build.

## Vérifications (Phase 3)

- `npx tsc --noEmit` : 0 erreur.
- `npx eslint .` : 0 erreur, 0 warning.
- `npx next build` : build de production réussi. Les routes migrées
  (`/`, `/taches`, `/notes`, `/courses`, `/habitudes`) sont désormais
  statiques (`○`) au lieu de dynamiques (`ƒ`) — confirmation que leur
  `page.tsx` ne fait plus d'attente réseau bloquante côté serveur.
- **Test manuel navigateur** (Chromium headless via Playwright, `next dev`) :
  parcours dashboard → Tâches → Courses → Notes → Habitudes → Collection,
  captures d'écran à chaque étape, lecture de la console pour les erreurs/
  warnings d'hydratation.
  - Le shell (bottom nav, header) s'affiche bien instantanément sur toutes
    les pages testées.
  - Skeletons confirmés visuellement sur `/taches` (lignes grises pulsées).
  - **Limite importante de cet environnement** : le sandbox de cette session
    bloque l'accès réseau sortant vers le projet Supabase du prompt
    (`Host not in allowlist: vsmtkopkqasrdnjceegp.supabase.co`), donc aucune
    vraie donnée n'a pu être chargée ni aucune mutation testée de bout en
    bout (cocher une tâche, ajouter un article...) — uniquement leur
    comportement de dégradation. Ce test a néanmoins révélé un écart réel :
    sur les pages migrées, une requête en échec restait auparavant sans
    retour visuel (skeleton bloqué) ; un état d'erreur explicite
    (`errorText`, "Erreur de chargement... Réessaie.") a été ajouté sur
    Tâches/Notes/Courses/Habitudes suite à cette observation. À l'inverse,
    les pages non migrées (Collection, etc.) plantent avec l'overlay
    d'erreur Next.js quand leur Server Action lève — comportement préexistant
    à cette session, non modifié.
  - Un warning d'hydratation sans rapport avec les fichiers modifiés (attribut
    `caret-color` injecté sur l'input de `GlobalSearchBar`, fichier non
    touché par ce prompt) est probablement un artefact de l'automatisation du
    navigateur headless, pas une régression introduite ici.
  - Recommandation : refaire ce parcours manuellement sur kilio.vercel.app (ou
    en local avec un accès réseau normal) pour valider les mutations
    optimistes et les animations en conditions réelles avant de pousser.

## Choix d'implémentation notables / compromis

- **Décision d'architecture principale** : plutôt que de garder le rendu
  serveur initial (`initialData`) sur les modules migrés, le choix a été fait
  de charger entièrement côté client avec skeleton, pour que `isLoading` soit
  réellement exploitable (avec `initialData` toujours peuplé par le SSR,
  `isLoading` ne passe quasiment jamais à `true`, ce qui aurait rendu les
  skeletons inertes). Contrepartie assumée : le tout premier rendu d'une page
  migrée montre le skeleton plutôt que la donnée déjà là via SSR — jugé
  cohérent avec la demande explicite du prompt ("skeleton pendant isLoading")
  et avec le fonctionnement d'une app native (shell instantané + chargement
  visible mais court), et cette app est une PWA avec service worker qui met
  déjà en cache le bundle JS, donc l'hydratation est rapide.
- **`getCoursesItems` et `getResumeNutritionJour`** : deux nouvelles fonctions
  de lecture exportées (`src/app/actions/courses.ts`,
  `src/app/actions/journal.ts`), suivant exactement le pattern déjà en place
  (`getTachesAvecRelations`, `getNotesAvecRelations`...) — nécessaires car ces
  lectures étaient jusqu'ici inline dans des Server Components, donc pas
  appelables depuis un `queryFn` client.
- **`AddTaskToggle`/`AddNoteToggle`/`AddHabitudeToggle`** ont reçu un prop
  `onSaved` optionnel pour invalider la query concernée après création —
  seul changement de surface sur ces composants, signature autrement
  inchangée.
- Le sous-agent qui a exécuté cette session a temporairement installé
  `playwright-core` (`npm install --no-save`) pour le test manuel, puis
  désinstallé — `package.json`/`package-lock.json` ne portent que
  `@tanstack/react-query`, `@tanstack/react-query-devtools` et
  `framer-motion`.

## Vérification préalable (Phase 1.3)

Schéma Supabase vérifié via `mcp__Supabase__list_tables` avant toute
modification : conforme au code (tables `taches`, `notes`, `courses_items`,
`habitudes`, `habitude_entries`, `journal_repas`, etc.). Aucune migration
effectuée. Note : Supabase signale RLS désactivée sur toutes les tables —
c'est l'état attendu et documenté du projet (app mono-utilisateur sans
auth/RLS), pas une régression de cette session ; à surveiller si l'app change
un jour de modèle d'accès.

---

Poussez-vous ces changements sur la branche `kilio` ?
