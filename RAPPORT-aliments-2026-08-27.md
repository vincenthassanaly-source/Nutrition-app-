# Rapport — Scaffolding projet + Étape 1 : CRUD Aliments

Date : 2026-08-27

## Scaffolding du projet

- Next.js 16 (App Router, TypeScript, Turbopack), Tailwind CSS v4, ESLint.
- `@supabase/supabase-js` + `@supabase/ssr` installés.
- Clients Supabase : `src/lib/supabase/client.ts` (browser), `src/lib/supabase/server.ts`
  (Server Components / Server Actions), `src/lib/supabase/middleware.ts` (rafraîchissement de
  session), branché dans `src/proxy.ts` (convention `proxy` de Next 16, remplace `middleware`).
- `src/lib/supabase/types.ts` : types générés automatiquement depuis le schéma Supabase réel
  (`mcp__Supabase__generate_typescript_types`), à régénérer après chaque migration.
- Auth minimale email/mot de passe : `/login` (inscription + connexion), `src/app/actions/auth.ts`
  (`signIn`, `signUp`, `signOut`), `requireUser()` dans `src/lib/supabase/auth.ts` qui protège tout
  le groupe de routes `src/app/(app)/*` et redirige vers `/login` si non connecté.
- PWA : `public/manifest.json`, `public/sw.js` (app shell en cache, network-first sur la
  navigation), icônes `public/icons/icon-{192,512}.png`, enregistrement du service worker via
  `src/components/ServiceWorkerRegister.tsx`.
- Bottom nav mobile-first (`src/components/BottomNav.tsx`) avec les 5 sections V1 : Aliments,
  Recettes, Courses, Placard, Journal. Pages placeholder créées pour les 4 dernières (arrivent aux
  prochaines étapes).

## Backend Supabase

- Nouveau projet Supabase dédié créé (isolé de tout projet existant sur le compte) :
  `nutrition-app`, région `eu-west-3`, plan gratuit (0 €/mois).
- Les 8 migrations validées ont été appliquées dans l'ordre via `mcp__Supabase__apply_migration`
  et sont versionnées dans `/scripts` :
  1. `migration-aliments-2026-08-27.sql`
  2. `migration-recettes-2026-08-27.sql`
  3. `migration-recette-ingredients-2026-08-27.sql`
  4. `migration-placard-2026-08-27.sql`
  5. `migration-listes-courses-2026-08-27.sql`
  6. `migration-listes-courses-items-2026-08-27.sql`
  7. `migration-objectifs-nutritionnels-2026-08-27.sql`
  8. `migration-journal-repas-2026-08-27.sql`
- Un avertissement de sécurité (`function_search_path_mutable` sur `set_updated_at`) détecté par
  les Security Advisors a été corrigé immédiatement (`set search_path = ''` sur la fonction, appliqué
  en base et répercuté dans le fichier de migration source). Plus aucun avertissement de sécurité
  ou de performance à ce stade.
- `.env.local` (non versionné) et `.env.local.example` (versionné, sans secret sensible — seule la
  clé publishable, faite pour être exposée côté client) créés avec l'URL et la clé du nouveau projet.

## Étape 1 — CRUD Aliments

- **Server actions** (`src/app/actions/aliments.ts`) : `createAliment`, `updateAliment`,
  `deleteAliment`. Validation des champs (nom requis, unité dans l'enum, valeurs nutritionnelles
  ≥ 0), authentification obligatoire via `requireUser()`, messages d'erreur explicites si une
  tentative de modification/suppression porte sur un aliment partagé (non permis par la RLS —
  détecté via `count` retourné par Supabase plutôt que de laisser échouer silencieusement).
- **Page** `src/app/(app)/aliments/page.tsx` (Server Component) : charge la liste des aliments
  visibles par l'utilisateur (les siens + les partagés), triée par nom.
- **Composants client** : `AlimentForm` (formulaire réutilisé pour créer/éditer, avec
  `useActionState`), `AddAlimentToggle` (formulaire d'ajout repliable), `AlimentsList` /
  `AlimentRow` (édition inline, suppression avec gestion d'erreur, badge « partagé » sur les
  aliments non modifiables par l'utilisateur courant).

## Tests effectués

- `npx eslint src` : aucun avertissement.
- `npm run build` : compilation et vérification TypeScript strictes OK, toutes les routes
  générées correctement (`/`, `/login`, `/aliments`, `/recettes`, `/courses`, `/placard`,
  `/journal`).
- **RLS vérifiée directement en base** (via SQL, avec simulation de deux utilisateurs distincts en
  local role `authenticated` + `request.jwt.claim.sub`) :
  - Un aliment global (`user_id null`) est visible par tous les utilisateurs authentifiés.
  - Un aliment personnel n'est visible que par son propriétaire.
  - Un utilisateur B ne peut ni modifier ni supprimer un aliment global, ni un aliment personnel
    appartenant à l'utilisateur A (0 ligne affectée, aucune donnée altérée).
  - Le propriétaire d'un aliment personnel peut bien l'éditer puis le supprimer.
  - Données de test entièrement nettoyées après vérification.

### ⚠️ Limite de test importante

Le bac à sable dans lequel je travaille a une politique réseau qui **bloque les appels HTTPS
sortants vers l'hôte du projet Supabase** (`*.supabase.co`) — confirmé via un test direct
(`403 Host not in allowlist`). Résultat concret : impossible de lancer le serveur Next.js dans cet
environnement et de dérouler le parcours complet dans un vrai navigateur (inscription → CRUD →
déconnexion), alors que l'outil MCP Supabase, lui, passe par un canal différent et fonctionne
normalement.

Ce que j'ai donc pu valider ici : le code compile et type-check sans erreur, et la logique RLS
et serveur a été vérifiée directement en base (ci-dessus). Ce que je n'ai **pas** pu valider dans
cet environnement : le rendu réel des pages et le parcours utilisateur en conditions live
(cookies de session, redirections, formulaires) dans un navigateur.

Deux options pour lever cette limite :
1. Tu ajoutes `vsmtkopkqasrdnjceegp.supabase.co` (et plus généralement `*.supabase.co`) à la liste
   blanche réseau de cet environnement Claude Code (réglages de l'environnement sur claude.ai/code),
   et je relance un test navigateur complet.
2. Tu testes toi-même en local (`npm run dev` avec le `.env.local` fourni) une fois le code
   récupéré — l'app n'a aucune dépendance à cet environnement bac à sable, elle tournera
   normalement partout ailleurs.

## Prochaine étape

Étape 2 : CRUD recettes + association d'ingrédients (aliments + quantités).
