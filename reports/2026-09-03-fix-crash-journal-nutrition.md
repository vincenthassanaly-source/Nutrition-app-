# Correctif crash serveur — Journal Nutrition

## Contexte

Depuis le 3 septembre, `/nutrition/journal` renvoyait systématiquement une
erreur serveur ("This page couldn't load — A server error occurred"). Le
dernier commit avant l'apparition du bug, `1d06424` ("Ajoute le swipe
horizontal au Journal Nutrition et à l'Historique des habitudes"), était le
suspect n°1.

## Cause racine (confirmée par reproduction locale)

Les logs runtime Vercel n'étaient pas accessibles depuis cet environnement :
le projet Vercel `kilio` n'apparaît pas dans l'équipe/le compte connecté ici
(seul `officio` était listé par `list_projects`). Reproduction locale en
mode production (`npm run build && npm run start`) à la place.

En visitant `/nutrition/journal` (avec ou sans `searchParams`), le serveur
loggait systématiquement :

```
⨯ Error: Attempted to call shiftDate() from the server but shiftDate is on
the client. It's not possible to invoke a client function from the server,
it can only be rendered as a Component or passed to props of a Client
Component.
```

**Cause** : le commit `1d06424` a déplacé la fonction utilitaire pure
`shiftDate` (calcul de date -1/+1 jour) depuis `page.tsx` (Server Component)
vers `JournalSwipeWrapper.tsx`, un fichier marqué `"use client"`. Or
`page.tsx` continuait d'importer `shiftDate` depuis ce fichier client et de
l'appeler directement côté serveur, dans les `href` des liens Jour
précédent/suivant :

```ts
import { JournalSwipeWrapper, shiftDate } from "./JournalSwipeWrapper";
...
href={`/nutrition/journal?date=${shiftDate(date, -1)}&jour=${jourType}`}
```

Dans le modèle Server/Client Components, tout export d'un module `"use
client"` devient une référence client opaque : on peut le rendre en JSX ou
le passer en props, mais jamais l'appeler directement depuis du code
serveur. D'où le crash systématique — reproductible sur **toutes** les
dates (avec ou sans entrées), indépendamment du contenu de la base, ce qui
explique le caractère systématique du bug signalé.

`src/app/(app)/habitudes/HistoriqueView.tsx` (touché par le même commit)
n'est pas affecté : ce composant est lui-même entièrement `"use client"`
(pas un Server Component qui appelle une fonction d'un module client), donc
aucun appel serveur→client n'y existe. Testé en local (`/habitudes`, HTTP
200, aucune erreur en log) pour confirmer.

L'hypothèse initiale d'un plantage sur `nutritionRecette` avec des macros
nulles n'est pas la cause : dans `nutritionAliment`, une multiplication par
`null` donne `0` (coercion JS), pas une exception. Vérifié aussi que la
recette "Crêpes" du 2026-09-01 n'a aucun ingrédient avec macros nulles en
base, et qu'aucune entrée `journal_repas` n'est orpheline (sans `aliment_id`
ni `recette_id`) actuellement.

## Correctif appliqué

1. **Cause racine** : extraction de `shiftDate` dans un nouveau module sans
   directive `"use client"` (`src/app/(app)/nutrition/journal/date-utils.ts`),
   importé à la fois par `page.tsx` (serveur) et `JournalSwipeWrapper.tsx`
   (client). Le comportement du swipe horizontal est inchangé.
2. **Garde défensive** (demandée en Phase 2, en prévention) : dans
   `page.tsx`, les entrées `journal_repas` sans `aliment` ni `recette`
   (référence supprimée en base) sont désormais ignorées via un `.filter()`
   avant le `.map()`, plutôt que de risquer un crash sur
   `entry.recette!.nom` si un tel cas survenait un jour.

Fichiers modifiés :
- `src/app/(app)/nutrition/journal/date-utils.ts` (nouveau)
- `src/app/(app)/nutrition/journal/JournalSwipeWrapper.tsx`
- `src/app/(app)/nutrition/journal/page.tsx`

## Vérifications (Phase 3)

- `npx tsc --noEmit` → OK, aucune erreur.
- `npx eslint .` → OK, aucune erreur.
- `npx next build` → build réussi.
- Test manuel en mode production (`npm run start`, pas `next dev`) :
  - Avant correctif : `/nutrition/journal` (avec et sans `searchParams`,
    dates avec/sans entrées) → HTTP 200 mais `⨯ Error: Attempted to call
    shiftDate()...` loggé côté serveur à chaque requête (le crash affiché à
    l'utilisateur).
  - Après correctif : mêmes requêtes (`/nutrition/journal`,
    `?date=2026-09-01&jour=repos`, `?date=2026-09-01&jour=entrainement`,
    `?date=2026-09-05&jour=entrainement`) → HTTP 200, **aucune erreur** dans
    les logs serveur.
  - `/habitudes` → HTTP 200 avant et après, aucune erreur (confirme la
    page non affectée).

**Limite de vérification** : l'accès réseau sortant de cet environnement
est restreint à une liste d'hôtes autorisés, qui n'inclut pas
`vsmtkopkqasrdnjceegp.supabase.co`. Le serveur Next.js local n'a donc pas pu
réellement interroger Supabase (erreur `Host not in allowlist` remontée par
le client `supabase-js`), et les pages testées ci-dessus se sont donc
affichées avec des données vides plutôt qu'avec le contenu réel (recette
"Crêpes" du 2026-09-01, objectifs, etc.). Cela n'affecte pas la validité du
diagnostic : le crash reproduit avant correctif se produisait au moment du
rendu des liens Jour précédent/suivant, **avant** même toute dépendance aux
données Supabase — il était donc garanti de se reproduire de façon
identique en production avec des données réelles. Un test en conditions
réelles (production Vercel) reste recommandé après déploiement pour
confirmation finale.

## Statut

Correctif prêt sur la branche `claude/nutrition-journal-server-error-cz7vha`,
pas encore poussé sur `kilio`.
