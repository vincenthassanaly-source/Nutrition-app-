# Fix : Journal vide au lancement de l'app — 2026-08-29

## Contexte

Les entrées du Journal sont désormais ajoutées quasi exclusivement en
écriture directe dans Supabase (sessions Claude Code), sans passer par la
Server Action `addJournalEntry`. Symptôme rapporté : au lancement de l'app,
ou en y revenant, le Journal apparaît vide/périmé tant qu'un rechargement
complet n'est pas fait.

## Phase 1 — Exploration & validation

Chacune des hypothèses du diagnostic initial a été vérifiée avant tout
changement de code.

### 1. Client Router Cache (`next.config.ts` / `staleTimes`)

`next.config.ts` ne définit pas `experimental.staleTimes`. Vérifié dans le
Next.js réellement installé (16.3.3, non présent avant `npm install` — voir
note plus bas) : le défaut de `staleTimes.dynamic` est **`0`** depuis la
v15.0.0 (changelog du fichier `staleTimes.md` livré avec le package :
*"The `dynamic` `staleTimes` default changed from 30s to 0s"*). Autrement dit
le Client Router Cache **ne met déjà rien en cache** pour une route dynamique
comme `/journal`, par défaut, avec cette version. Aucune route du projet n'a
de `loading.tsx`, donc il n'y a même pas de "shell statique" prefetchable à
mettre dans le bucket `static` (300 s par défaut).
→ **Non causal.** Aucun changement nécessaire sur `next.config.ts`.

### 2. `middleware.ts` absent

Confirmé absent à la racine. Historique Git :

- `2d43eec` (28/08) constatait déjà que le diagnostic "middleware.ts
  manquant" était incorrect : Next.js 16 a renommé `middleware.ts` en
  `proxy.ts`, et `src/proxy.ts` existait, branché sur `updateSession()`.
- Le commit le plus récent, `39b2587` ("Supprime toute l'authentification —
  app mono-utilisateur"), a supprimé `src/proxy.ts` **intentionnellement**,
  en même temps que toute l'auth et toutes les policies RLS (colonnes
  `user_id` retirées de `journal_repas`, `recettes`,
  `objectifs_nutritionnels`, `recette_ingredients`, `aliments`).

L'app est maintenant strictement mono-utilisateur sans session ni RLS : il
n'y a plus de cookie de session à rafraîchir, donc plus de raison d'avoir un
middleware/proxy de tout.
→ **Non causal, absence désormais légitime.** Aucun fichier à recréer.

### 3. `public/sw.js`

Déjà corrigé et revérifié dans des sessions précédentes (`2d43eec`,
`37746d8`) : stratégie **network-first** pour toute requête GET same-origin
qui n'est pas un asset statique versionné (`_next/static/`, `/icons/`) — ce
qui couvre à la fois les navigations classiques et les fetch RSC internes du
routeur (`mode: "cors"`, pas `"navigate"`). Relu le fichier : toujours
correct, aucune régression.
→ **Non causal, déjà fixé.** Aucun changement.

### 4. Écouteur `visibilitychange` / `pageshow`

`grep` sur `src/` : **aucun** écouteur de ce type nulle part dans le
codebase, ni dans `ServiceWorkerRegister.tsx` ni ailleurs.
→ **C'est le trou restant.** Quand l'app repasse au premier plan (retour
d'arrière-plan sur mobile/PWA, restauration bfcache du navigateur), aucune
navigation ni fetch RSC n'a lieu : React réaffiche simplement l'arbre déjà
en mémoire, avec les données qu'il avait au moment de la mise en
arrière-plan. Rien dans le code existant ne déclenche de refetch dans ce
cas — ni le Client Router Cache (déjà désactivé par défaut), ni le service
worker (qui n'intercepte que de vraies requêtes réseau, pas une simple
reprise d'onglet).

### 5. `journal/page.tsx` et `dynamic`

Pas de `export const dynamic` explicite. Mais la page utilise `await
searchParams`, qui est une API de requête ("Request-time API") : dans le
modèle de cache "Previous Model" utilisé ici (`cacheComponents: false`, le
défaut de cette version — confirmé dans `config-shared.js`), l'usage de
`searchParams` force déjà la route entière en rendu dynamique côté serveur.
Confirmé après build : `next build` liste `ƒ /journal` (Dynamic,
server-rendered à chaque requête), pas `○` (Static).
→ **Non causal** (déjà dynamique par le comportement implicite), mais ajout
de `force-dynamic` fait en Phase 2 par mesure de clarté/robustesse (cf.
ci-dessous).

### Conclusion de la Phase 1

La cause racine restante est le **point 4** : aucun mécanisme ne force un
refresh quand l'app repasse au premier plan sans navigation ni reload
complet (bfcache du navigateur, reprise PWA depuis l'arrière-plan). C'est
précisément le cas qu'aucun réglage serveur (cache Next, service worker) ne
peut couvrir, comme anticipé par le prompt initial.

## Phase 2 — Implémentation

### `src/components/AppResumeRefresh.tsx` (nouveau)

Petit composant client, monté une fois dans `src/app/layout.tsx` à côté de
`ServiceWorkerRegister`. Écoute :

- `visibilitychange` → si `document.visibilityState === "visible"`, appelle
  `router.refresh()` (couvre le cas le plus courant : app mise en
  arrière-plan puis reprise, sans que la page ait été déchargée).
- `pageshow` avec `event.persisted === true` → même appel (couvre la
  restauration bfcache du navigateur après une vraie navigation
  précédente/suivante).

`router.refresh()` invalide le Client Router Cache pour la route courante et
redemande un payload RSC frais au serveur, sans reload complet de la page
(pas de flash, scroll conservé).

### `src/app/(app)/journal/page.tsx`

Ajout de `export const dynamic = "force-dynamic";`, avec commentaire
expliquant qu'il documente un comportement déjà garanti par l'usage de
`searchParams`, en garde-fou explicite pour l'avenir (ex. si quelqu'un
retire l'usage de `searchParams` sans y penser).

### `src/app/layout.tsx`

Montage de `<AppResumeRefresh />` à côté de `<ServiceWorkerRegister />`.

### Non modifié (et pourquoi)

- `next.config.ts` : `staleTimes.dynamic` est déjà `0` par défaut sur cette
  version de Next — l'ajouter explicitement n'aurait aucun effet, et
  aucune route n'a de `loading.tsx` à mettre dans le bucket `static`.
- Pas de `middleware.ts`/`proxy.ts` recréé : plus de session/RLS à
  rafraîchir depuis la suppression de l'auth (`39b2587`).
- `public/sw.js` : déjà network-first, aucune régression constatée, pas de
  bump de `CACHE_NAME` nécessaire puisque le fichier n'a pas changé.

## Phase 3 — Vérifications

- `npm install` (le repo était cloné sans `node_modules`).
- `npm run build` : succès, `/journal` bien listé `ƒ` (Dynamic).
- `npx tsc --noEmit` : aucune erreur.
- `npm run lint` : aucune erreur.

### Test manuel (insertion directe en base + reprise sans reload)

Testé avec Playwright (Chromium headless) contre le serveur de prod buildé
localement (`next start`), en insérant une ligne directement dans
`journal_repas` via les outils MCP Supabase (même mécanisme qu'une écriture
directe par une session Claude Code) **après** le chargement initial de la
page, puis en simulant la reprise de l'app (`visibilitychange` → `hidden`
→ `visible`, sans navigation ni reload — le tas JS de la page est resté
vivant tout du long, vérifié par un marqueur `window.__testMarker`).

Résultat confirmé côté mécanique client :
- Le listener se déclenche bien à la reprise (`visibilitychange -> visible`).
- `router.refresh()` est bien appelé et déclenche une vraie requête réseau
  vers le serveur avec un jeton `_rsc` différent à chaque fois (donc pas
  servie depuis un cache client) — réponse HTTP 200 reçue.
- Confirmé aussi que `router.refresh()` **contourne** le Client Router
  Cache : le payload est redemandé au serveur à chaque reprise, jamais
  réutilisé tel quel.

**Limite de vérification rencontrée** : dans cet environnement d'exécution
sandboxé, le serveur Next.js (process Node) n'a pas d'accès réseau sortant
vers le projet Supabase (`vsmtkopkqasrdnjceegp.supabase.co`) — confirmé par
un `curl` direct renvoyant `403 Host not in allowlist`, et par le fait qu'un
`curl` tout frais vers `/journal` (sans aucun cache impliqué, requête HTTP
brute) affichait déjà "Aucun repas enregistré pour ce jour." alors que la
base contenait 14 lignes pour aujourd'hui. Ce n'est donc pas un problème de
cache : c'est une restriction réseau propre à ce bac à sable, qui empêche de
vérifier de bout en bout que la nouvelle ligne s'affiche réellement à
l'écran dans *cet* environnement. Le mécanisme client (refresh déclenché,
requête réseau fraîche envoyée à chaque reprise, route serveur bien
dynamique à chaque requête) est en revanche entièrement vérifié et
fonctionne comme attendu ; en production, où le serveur a un accès réseau
normal vers Supabase, chaque `router.refresh()` déclenché à la reprise ira
bien chercher les données à jour.

Les deux lignes de test insérées directement en base (`quantite` 42 et 777,
sur la date du jour) ont été supprimées après le test.

## Livrable

Fichiers modifiés :
- `src/app/(app)/journal/page.tsx` (+`force-dynamic`)
- `src/app/layout.tsx` (montage de `AppResumeRefresh`)

Fichier créé :
- `src/components/AppResumeRefresh.tsx`

Aucune modification de `next.config.ts`, `public/sw.js`, ni création de
`middleware.ts`/`proxy.ts` : ces trois pistes ont été explorées et écartées
en Phase 1 (déjà correctes ou devenues sans objet).
