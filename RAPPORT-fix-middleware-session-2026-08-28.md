# Rapport — Investigation "Journal vide de façon aléatoire"

Branche : `claude/remove-nutrition-sections-bqtd9b`

## Contexte

Le ticket initial partait du diagnostic suivant : `src/lib/supabase/middleware.ts` exporte `updateSession()`, censée rafraîchir le token de session Supabase à chaque requête, mais **aucun fichier `middleware.ts` n'existe à la racine ni dans `src/`** — donc cette fonction ne serait jamais appelée, et une session invalide au moment d'une requête ferait échouer silencieusement la lecture RLS, expliquant un Journal vide de façon aléatoire.

## Écart signalé avant codage (Étape 0)

**Le diagnostic du ticket est incorrect.** Ce projet tourne sur **Next.js 16.3.3**, et `AGENTS.md` prévient explicitement que cette version a des conventions différentes du Next.js "classique", à vérifier dans `node_modules/next/dist/docs/` avant tout code.

En lisant `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md` et `middleware.md` :

> "The `middleware` file convention is deprecated and has been renamed to `proxy`." (depuis **Next.js v16.0.0**) — "All functionality remains the same — only the file and export names have changed."

Le fichier attendu dans cette version n'est donc plus `middleware.ts` mais **`proxy.ts`**, avec une fonction exportée nommée `proxy` (pas `middleware`), placé au même niveau que `app/` — donc `src/proxy.ts` puisque ce projet utilise `src/app/`.

**Or ce fichier existe déjà et est déjà branché correctement** (`src/proxy.ts`, non modifié par ce fix) :

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

C'est exactement la structure que le ticket demandait de créer : import de `updateSession`, exécution + retour de sa réponse sur chaque requête, matcher excluant assets statiques/manifest/sw/icônes. Preuve d'exécution réelle : chaque `npm run build` de ce repo affiche `ƒ Proxy (Middleware)` dans la liste des routes, confirmant que Next.js reconnaît et exécute ce mécanisme.

**Décision validée avec l'utilisateur** : ne pas créer de `middleware.ts` (redondant/sans effet dans cette version), et investiguer la vraie cause du bug "Journal vide" à la place.

## Cause réelle identifiée : cache du service worker (`public/sw.js`)

Cette app est une PWA avec un service worker actif, enregistré dans `src/app/layout.tsx` (root layout, donc sur toutes les pages) via `ServiceWorkerRegister`.

Son handler `fetch` appliquait cette logique :
```js
if (request.mode === "navigate") {
  // network-first
}
// sinon (tout le reste des requêtes same-origin) → cache-first
```

Le commentaire d'origine visait sans doute les assets JS/CSS buildés, mais **la navigation client-side de Next.js App Router (clic sur un `<Link>`, ex. la bottom nav) ne déclenche pas une requête `mode: "navigate"`** : c'est un `fetch()` interne du routeur pour récupérer le payload RSC de la page, avec `mode: "cors"` par défaut. Cette requête tombait donc dans la branche **cache-first**.

Conséquence concrète :
1. La première fois que `/journal` est chargé côté client dans une session, le SW met en cache le payload RSC de ce moment précis (potentiellement avant l'ajout d'un repas).
2. Toute navigation client-side ultérieure vers `/journal` (retour depuis "Recettes" via la bottom nav, sans rechargement complet) **sert cette version en cache**, quel que soit ce qui a changé en base depuis.
3. `revalidatePath("/journal")` (appelé par les Server Actions du site) purge le cache serveur Next.js mais n'a **aucun effet** sur le Cache Storage du navigateur géré par le service worker — encore moins quand les entrées sont ajoutées directement via Supabase (par Claude), qui ne passe par aucune Server Action.

Ceci explique bien mieux "vide de façon aléatoire, à toute heure" que la théorie du middleware : le symptôme dépend du **pattern de navigation** (revenir sur l'onglet Journal sans reload complet), pas de l'heure.

## Fichiers modifiés

- `public/sw.js` :
  - La branche network-first s'applique désormais à **tout ce qui n'est pas un asset statique versionné** (`/_next/static/...`) ou une icône (`/icons/...`), et non plus seulement aux requêtes `mode: "navigate"`. Ça couvre les pages ET les fetch RSC du routeur.
  - Cache-first conservé uniquement pour `_next/static/` et `/icons/` (assets immuables, sûrs à mettre en cache indéfiniment).
  - `CACHE_NAME` incrémenté (`v1` → `v2`) pour que le handler `activate` purge l'ancien cache déjà présent sur les appareils (via `caches.keys()` + suppression de tout ce qui n'est pas `v2`), évitant de laisser une version périmée traîner indéfiniment.

Aucun fichier `middleware.ts` créé — il n'était pas nécessaire (cf. écart ci-dessus). `src/lib/supabase/middleware.ts`, `src/proxy.ts` et tout le reste : non touchés.

## Ce qui a été vérifié comme n'étant pas la cause (pour mémoire)

- Le mécanisme de rafraîchissement de session (`updateSession` via `src/proxy.ts`) est actif et suit le pattern officiel Supabase/Next.js (mutation de `request.cookies` + `NextResponse.next({ request })`), confirmé par `ƒ Proxy (Middleware)` dans chaque build.
- `src/lib/supabase/server.ts` lit les cookies via `next/headers` de façon standard.
- Le rendu de `/journal` est dynamique (`ƒ`, pas `○`) car il lit `searchParams` — pas de Full Route Cache Next.js en jeu côté serveur.
- `next.config.ts` ne configure aucun cache `fetch` particulier.

## Vérifications

- `npx tsc --noEmit` → OK, aucune erreur (fichier modifié est du JS pur, hors périmètre TS, mais le reste du projet reste sain).
- `npx eslint public/sw.js` → OK, aucune erreur/warning.
- `npm run build` → OK, compile et type-check passent, `ƒ Proxy (Middleware)` toujours présent dans la sortie (confirme que le proxy existant n'a pas été affecté).
- **Vérification comportementale réelle** (Playwright + Chromium headless, contre `npm run dev`) :
  1. Navigation complète vers `/login` → le service worker s'enregistre et s'active (confirmé via `navigator.serviceWorker.getRegistration()`).
  2. `fetch("/login", { mode: "cors" })` (simulant un fetch RSC de navigation client-side) → **résultat : `/login` n'apparaît pas dans le Cache Storage** après ce fetch. Avant le fix, l'ancienne logique (`request.mode === "navigate"` uniquement) aurait mis cette réponse en cache.
  3. `fetch()` d'un vrai asset statique (`/_next/static/media/*.woff2`, status 200) → **résultat : bien présent dans le Cache Storage** après coup, confirmant que le cache-first est préservé pour les assets buildés (pas de régression sur les capacités offline de la PWA pour ces fichiers).

## Limites de la vérification

- Le test Playwright a été fait sur `/login` (page publique, sans authentification) plutôt que sur `/journal` directement, car aucune session Supabase de test n'était disponible dans ce container pour se connecter. La logique du service worker ne distingue pas les routes entre elles (elle ne regarde que si le chemin commence par `/_next/static/` ou `/icons/`), donc le comportement vérifié sur `/login` s'applique identiquement à `/journal`.
- Le test valide que le service worker ne met plus en cache les pages/payloads RSC — il ne peut pas, dans cet environnement, reproduire "à l'identique" le scénario original (ajout d'un repas par Claude en base, puis navigation stale côté utilisateur sur son téléphone), faute d'accès à un vrai appareil/session utilisateur.
- Les utilisateurs ayant déjà installé la PWA avant ce fix ont un service worker `v1` actif avec du contenu potentiellement caché en mémoire jusqu'à leur prochaine visite ; le bump vers `v2` déclenchera la purge automatique de l'ancien cache à ce moment-là (comportement standard `skipWaiting`/`clients.claim` déjà en place, non modifié).

## Point relevé en passant, non corrigé (hors périmètre)

- `src/app/layout.tsx` (`metadata.description`) contient encore `"Liste de courses, recettes, suivi calorique et placard"`, une description obsolète depuis la suppression de Courses/Placard (voir `RAPPORT-suppression-aliments-placard-courses-2026-08-28.md`, qui avait déjà corrigé `public/manifest.json` mais pas cette métadonnée-ci). Non touché ici conformément à la consigne "ne rien toucher d'autre que nécessaire à ce fix" — à traiter séparément si souhaité.
