# Rapport — Vérification du bug "Journal vide après ajout d'un repas (double refresh)"

## Écart signalé avant toute action (Étape 0)

Deux hypothèses du ticket initial ne correspondent plus au code réel de cette branche :

1. **La fonctionnalité "saisie libre + estimation macros par l'API Claude" n'existe plus du tout.**
   Elle a été ajoutée (`91f4d39`, `6124879`) puis intégralement retirée (`07aa3e6`,
   *"Retire le log de repas en texte libre estimé par IA"*) — UI, server action
   `journal-ia.ts`, `addJournalEntryLibre`, migration SQL — car elle dépendait
   d'une clé `ANTHROPIC_API_KEY` payante non configurée. Confirmé par grep
   (`AddJournalEntryLibreForm`, `addJournalEntryLibre`, `estimateRepasLibre`,
   `journal-ia` : 0 occurrence dans `src/`) et par le schéma actuel de
   `journal_repas` (pas de colonnes `description`/`kcal`/.../`source`).

2. **Il n'existe aujourd'hui aucune UI pour ajouter un repas.** Le formulaire
   manuel "Ajout rapide" (`AddJournalEntryForm`, aliment/recette) a lui aussi
   été retiré (`726715f`). `src/app/actions/journal.ts` conserve `addJournalEntry`
   mais plus aucun composant ne l'appelle — seul `removeJournalEntry` (bouton
   "Suppr.") est encore branché à l'UI. Le seul moyen actuel d'insérer une ligne
   dans `journal_repas` est une écriture directe en base (ex. par un agent Claude
   via l'API Supabase), exactement le scénario décrit dans le commit de fix
   ci-dessous.

3. **Le bug décrit a déjà une cause racine identifiée et un correctif appliqué
   et poussé sur cette branche**, dans le commit `2d43eec`
   (*"Corrige le cache du service worker qui servait un Journal périmé"*),
   déjà `HEAD` de `claude/journal-empty-after-meal-ai-a4xbql` avant le début
   de cette tâche.

Ces trois points ont été signalés à l'utilisateur via `AskUserQuestion` ; il a
choisi de **re-vérifier le fix existant** plutôt que de documenter seulement ou
de réimplémenter la saisie IA. Ce rapport couvre cette re-vérification.

## Cause racine (rappel, non modifiée dans cette session)

Ce n'est **pas** un problème de `revalidatePath`/cache Next.js côté serveur :
`addJournalEntry` et `removeJournalEntry` appellent déjà correctement
`revalidatePath("/journal")` (`src/app/actions/journal.ts:77,88`), et `/journal`
est un rendu dynamique (`ƒ`, lit `searchParams`) sans cache `fetch` particulier.

La vraie cause, documentée dans `RAPPORT-fix-middleware-session-2026-08-28.md` :
le **service worker** (`public/sw.js`), enregistré globalement via
`ServiceWorkerRegister` (`src/app/layout.tsx`), appliquait du cache-first à
toute requête same-origin qui n'était pas `mode: "navigate"`. Or les fetch RSC
de navigation client-side Next.js (clic sur un `<Link>`, y compris la bottom
nav de l'app) sont en `mode: "cors"`, pas `"navigate"` — ils tombaient donc
dans la branche cache-first et servaient indéfiniment la version de `/journal`
vue lors de la première visite de la session, quel que soit ce qui avait changé
en base depuis (surtout des lignes insérées directement en base, sans passer
par une Server Action de ce site, donc sans jamais déclencher de
`revalidatePath`).

Correctif déjà en place (`public/sw.js`, commit `2d43eec`) :

```js
const isStaticAsset =
  url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");

if (!isStaticAsset) {
  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r || caches.match("/")))
  );
  return;
}
```

Network-first pour tout sauf les assets statiques versionnés (`_next/static/`)
et les icônes ; `CACHE_NAME` passé à `v2` pour purger l'ancien cache déjà
installé chez un utilisateur.

## Re-vérification effectuée dans cette session

### Limite d'environnement rencontrée

Ce sandbox n'a pas accès réseau au projet Supabase réel :

```
message: 'Host not in allowlist: vsmtkopkqasrdnjceegp.supabase.co.
Add this host to your network egress settings to allow access.'
```

Impossible donc de créer un compte de test (`signUp`), de lire le catalogue
`aliments`, ou d'insérer une ligne `journal_repas` réelle. Un test de bout en
bout "insertion réelle → navigation client-side → apparition dans l'UI" n'est
pas réalisable ici — même limite déjà rencontrée par la session précédente
(qui n'avait pu tester que `/login`, page publique, faute de session Supabase).

### Ce qui a pu être vérifié

Le mécanisme corrigé est indépendant des données : il s'agit uniquement de
savoir si une requête GET same-origin passe par cache-first ou network-first
selon son chemin. Ce comportement est testable sans Supabase. Script
Playwright (Chromium headless, contre `npm run dev`) :

1. Navigation vers `/login` (page publique, aucun appel Supabase au rendu) →
   le service worker s'enregistre et devient `active`.
2. Pour chacune des routes `/journal`, `/login`, `/recettes` : `fetch(path,
   { mode: "cors", credentials: "same-origin" })` (reproduit exactement le
   fetch RSC d'une navigation `<Link>`), puis vérification du `Cache Storage`
   (`nutrition-app-shell-v2`) pour cette clé.
3. Même vérification sur un asset statique réel (`/icons/icon-192.png`), pour
   confirmer l'absence de régression sur le cache-first des assets.

Résultat :

```
[OK] service worker registered and active
[fetch mode:cors] /journal -> status 200, cached after fetch: false
[fetch mode:cors] /login -> status 200, cached after fetch: false
[fetch mode:cors] /recettes -> status 200, cached after fetch: false
[fetch mode:cors] /icons/icon-192.png -> status 200, cached after fetch: true
PASS: pages are network-first (no stale cache), static assets remain cache-first.
```

**`/journal` lui-même** (la route au cœur du ticket, non testée par la session
précédente qui s'était limitée à `/login`) n'est **pas** mis en cache par un
fetch de navigation — la mécanique responsable du "Journal vide après un
refresh" est bien désactivée pour cette route précise. Les assets statiques
restent cache-first (pas de régression sur le fonctionnement offline de la PWA).

### Ce qui reste à valider manuellement par l'utilisateur

Aucun changement de code n'a été nécessaire dans cette session (le correctif
était déjà en place et fonctionne d'après la vérification ci-dessus). Reste
un test en conditions réelles, impossible depuis ce sandbox :

1. Ouvrir l'app en prod/preview (PWA installée ou navigateur), se connecter.
2. Faire ajouter une ligne à `journal_repas` pour la date du jour directement
   en base (ex. via l'éditeur SQL Supabase, ou un agent), pour reproduire le
   scénario exact du ticket (écriture hors Server Action).
3. Sans recharger complètement la page, naviguer vers un autre onglet puis
   revenir sur "Journal" via la bottom nav (navigation client-side) :
   le repas doit apparaître dès ce premier retour, sans second refresh.
4. Si un ancien service worker `v1` était déjà installé sur l'appareil de
   test, un premier chargement complet (hard refresh) est nécessaire pour
   qu'il soit remplacé par `v2` (purge automatique de l'ancien cache déjà en
   place, `skipWaiting`/`clients.claim`, non modifiés dans ce fix).

## Fichiers inspectés (cette session)

- `src/app/(app)/journal/page.tsx`, `JournalEntriesList.tsx`
- `src/app/actions/journal.ts`
- `public/sw.js`, `src/components/ServiceWorkerRegister.tsx`
- `src/lib/supabase/auth.ts`, `server.ts`, `src/proxy.ts`
- `src/app/login/page.tsx`, `src/app/actions/auth.ts`
- `next.config.ts`
- Historique git (`07aa3e6`, `91f4d39`, `6124879`, `726715f`, `2d43eec`) et
  rapports précédents (`RAPPORT-journal-repas-ia-2026-08-28.md`,
  `RAPPORT-retrait-ui-ajout-journal-2026-08-28.md`,
  `RAPPORT-fix-middleware-session-2026-08-28.md`)

## Conclusion

- Correctif déjà appliqué et confirmé fonctionnel pour la route `/journal`
  spécifiquement (nouveau test ciblé, absent de la vérification précédente).
- Aucune régression détectée sur le cache des assets statiques.
- Aucun code modifié dans cette session : rien à corriger de plus n'a été
  identifié.
- Point non couvert (limite d'environnement, pas de code) : test de bout en
  bout avec une vraie écriture Supabase + session utilisateur authentifiée,
  impossible depuis ce sandbox (accès réseau à Supabase bloqué par
  l'allowlist proxy). À faire par l'utilisateur en suivant les étapes
  ci-dessus.
- Point signalé en passant (hors périmètre de ce ticket) : il n'existe plus
  aucune UI pour ajouter un repas dans le Journal (ni saisie IA, ni "Ajout
  rapide" manuel) — seule la suppression est possible depuis l'interface.
