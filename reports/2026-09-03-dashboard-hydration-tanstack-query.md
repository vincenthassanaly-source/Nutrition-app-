# Corrige la lenteur du Dashboard (hydration TanStack Query)

## Problème

Le commit `a38624b` (2026-09-02) a migré le Dashboard d'un Server Component
qui exécutait ses requêtes Supabase côté serveur en une seule réponse, vers
`DashboardView.tsx`, un composant client qui déclenche 5 `useQuery` séparés
(`getTachesAvecRelations`, `getHabitudesDuJour`, `getResumeNutritionJour`,
`getListes`, `getTags`) une fois le JS hydraté dans le navigateur.

Conséquence sur le chargement initial de `/` :

1. Le navigateur télécharge et hydrate le bundle JS de la page.
2. Une fois hydraté, React déclenche 5 appels réseau vers des Server
   Actions Vercel, chacun potentiellement sujet à un cold start serverless
   si l'app n'a pas été utilisée récemment.
3. Le contenu (nutrition, tâches du jour, prochain événement, habitudes)
   reste en skeleton jusqu'à la résolution des 5 requêtes.

Avant la migration, ces mêmes requêtes s'exécutaient en parallèle côté
serveur pendant le rendu de la page — un seul aller-retour, pas de cold
start visible côté client. La migration a donc introduit une lenteur
perçue nouvelle au chargement initial, en échange de skeletons plus fins
sur les chargements/refetch ultérieurs.

## Solution appliquée

Application du pattern officiel TanStack Query pour Next.js App Router :
prefetch serveur + hydration client.

- **`src/lib/query/server-client.ts`** (nouveau) : `makeServerQueryClient()`,
  une factory qui crée un `QueryClient` par requête serveur — jamais
  partagé entre requêtes/utilisateurs, à la différence du
  `browserQueryClient` singleton de `providers.tsx` qui vit côté
  navigateur.
- **`src/app/(app)/page.tsx`** : converti en `async function` (Server
  Component). Il crée un `QueryClient` serveur, préfetche en parallèle
  (`Promise.all` + `queryClient.prefetchQuery`) les 5 requêtes du
  Dashboard en réutilisant exactement les `queryKeys` de
  `src/lib/query/keys.ts` (aucune clé dupliquée), puis enveloppe
  `<DashboardView>` dans `<HydrationBoundary state={dehydrate(queryClient)}>`.
- **`DashboardView.tsx`** : inchangé. Les mêmes `useQuery` avec les mêmes
  clés retrouvent leurs données déjà présentes dans le cache hydraté — pas
  de refetch au premier rendu grâce au `staleTime` de 30s déjà configuré
  dans `providers.tsx`. Les skeletons restent affichés normalement dès que
  le cache redevient stale (navigation ultérieure, retour sur `/` après un
  moment passé sur une autre page) ou pendant un refetch.
- Aucune modification des mutations optimistes (cocher tâche/habitude) ni
  de `DashboardTaskItem`/`DashboardHabitItem`.

## Vérifications effectuées

- `tsc --noEmit` : aucune erreur de type introduite par ce changement
  (une erreur préexistante et non liée subsiste dans `src/app/layout.tsx`
  sur `LayoutProps`, présente avant et après ce changement — probablement
  liée à la génération de types Next 16, pas à ce prompt).
- ESLint sur les fichiers modifiés : aucun problème.
- `next build` : `/` reste marqué `ƒ` (server-rendered on demand), pas de
  génération statique erronée malgré l'usage de données temps réel — le
  build passe sans erreur.

## Autres modules concernés (non corrigés dans ce prompt)

Le même pattern (page client + 5 `useQuery`/`useQuery` uniques déclenchés
après hydratation, donc mêmes cold starts serverless potentiels) a été
introduit par le même commit `a38624b` sur les modules suivants, restés
hors du périmètre de ce prompt (scope = Dashboard uniquement) :

- **Tâches** (`src/app/(app)/taches/page.tsx` → `TachesView.tsx`)
- **Notes** (`src/app/(app)/notes/page.tsx` → `NotesGrid.tsx`)
- **Courses** (`src/app/(app)/courses/page.tsx` → `CoursesList.tsx`)
- **Habitudes** (`src/app/(app)/habitudes/page.tsx` → `HabitudesView.tsx`)

Si la lenteur perçue au chargement initial est également gênante sur ces
pages, le même correctif (prefetch serveur dans le `page.tsx` +
`HydrationBoundary`) pourrait y être répliqué à l'identique.
