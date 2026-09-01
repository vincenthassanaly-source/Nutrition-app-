# Notifications de rappel sur les tâches à échéance (module Agenda)

## Résumé

Le module Agenda supporte désormais les événements "toute la journée" et un rappel par notification push (5/15/30 min avant l'heure d'une tâche), avec un bouton flottant dédié pour créer rapidement une tâche/événement depuis l'Agenda. Toute la chaîne de notification push a été construite : abonnement côté client, stockage de l'abonnement en base, planification pg_cron/pg_net et envoi via une Edge Function (VAPID/Web Push).

## Phase 1 — État de la base au moment de l'implémentation

Vérifié via `mcp__Supabase__list_tables` / `list_extensions` (projet `vsmtkopkqasrdnjceegp`) avant toute migration : pas de table `push_subscriptions`, pas de colonnes `toute_la_journee`/`rappel_minutes`/`rappel_envoye_le` sur `taches`, `pg_net` et `pg_cron` non installées — conforme à ce qui était annoncé dans le prompt. Aucun écart.

## Phase 2 — Implémentation

### 2.1 Migration base de données

`scripts/migration-taches-notifications-2026-09-01.sql` (+ `-revert.sql`), appliquée via `mcp__Supabase__apply_migration` puis vérifiée :
- `taches` : ajout `toute_la_journee boolean not null default false`, `rappel_minutes integer null` (contrainte `check` sur 5/15/30), `rappel_envoye_le timestamptz null`.
- Table `push_subscriptions` (`id`, `endpoint` unique, `p256dh`, `auth`, `created_at`), pas de RLS/`user_id` (mono-utilisateur, même pattern que le reste de Kilio).
- `create extension if not exists pg_net;`

`src/lib/supabase/types.ts` régénéré via `mcp__Supabase__generate_typescript_types` (plutôt que retapé à la main comme pour de précédentes migrations — l'outil était disponible cette fois).

### 2.2 Server actions (`src/app/actions/taches.ts`)

- `parseTacheInput` étendu avec `toute_la_journee` (checkbox) et `rappel_minutes` (valeurs 5/15/30 uniquement, toute autre valeur — y compris vide — ramenée silencieusement à `null`, même logique que `recurrence_fin`).
- Si `toute_la_journee` est coché, le serveur force `heure = null` et `rappel_minutes = null` (ne fait pas confiance au client).
- `updateTache` : charge l'`echeance`/`heure`/`rappel_minutes` existants avant la mise à jour ; si l'un des trois diffère de la nouvelle valeur, `rappel_envoye_le` est remis à `null` dans le même `update`.

### 2.3 Server action abonnements push (`src/app/actions/notifications.ts`, nouveau)

- `saveSubscription({ endpoint, keys })` → upsert dans `push_subscriptions` sur `endpoint`.
- `deleteSubscription(endpoint)` → suppression de la ligne.

### 2.4 Formulaire de tâche (`AddTaskForm.tsx`)

- Case "Toute la journée" : masque le champ Heure et le sélecteur Rappel quand cochée (état `touteLaJournee`).
- Champ Heure rendu contrôlé (`heure`/`setHeure`, était en `defaultValue` auparavant) pour piloter la visibilité du sélecteur Rappel.
- Sélecteur "Rappel" (Aucun / 5 / 15 / 30 min avant), affiché seulement si une heure est renseignée et que "Toute la journée" n'est pas coché.

### 2.5 Bouton dédié sur l'Agenda (`AgendaView.tsx`)

Bouton flottant rond ("+"), fixe en bas à droite (`bottom: calc(env(safe-area-inset-bottom) + 90px)`, au-dessus de la `BottomNav`), couleur `--accent-agenda` pour le distinguer du `QuickAddFab` (couleur kcal) déjà présent sur l'accueil. Ouvre `AddTaskForm` dans le composant `Modal` existant (déjà utilisé par `QuickAddFab`), avec `defaultEcheance` pré-rempli sur `selectedDate` (la date actuellement affichée, quelle que soit la vue Jour/Semaine/Mois/Liste active). Ouverture/fermeture en `useState` simple (comme `AddTaskToggle`), sans intégration au bouton retour du navigateur (contrairement à `QuickAddFab` qui utilise `useBackClose` pour son éventail à plusieurs choix — non nécessaire ici, un seul formulaire).

### 2.6 Service worker (`public/sw.js`)

Ajout des listeners `push` (affiche la notification via `self.registration.showNotification`) et `notificationclick` (focus un onglet existant sur l'URL cible ou en ouvre un nouveau) tels que spécifiés. Le reste du fichier (cache-first/network-first) n'a pas été touché.

### 2.7 Abonnement push côté client

`src/lib/push/subscribe.ts` (nouveau, client-only) :
- `isPushSupported()`, `getExistingSubscription()`.
- `subscribeToPush()` : demande la permission, récupère `navigator.serviceWorker.ready`, s'abonne via `pushManager.subscribe` (conversion base64url → `Uint8Array` de `NEXT_PUBLIC_VAPID_PUBLIC_KEY`), envoie l'abonnement à `saveSubscription`.
- `unsubscribeFromPush()` : `deleteSubscription(endpoint)` puis `subscription.unsubscribe()`.

`NotificationsRow.tsx` réécrit : toggle branché sur ces fonctions, état initial déterminé de façon asynchrone (non supporté → `PushManager` absent ; `Notification.permission !== "granted"` → off ; sinon vérifie un abonnement actif via `getExistingSubscription`), message d'erreur affiché sous le toggle en cas d'échec (permission refusée, navigateur non compatible, clé VAPID manquante). La logique async est encapsulée dans une fonction interne à l'effet (pattern "fetch au montage" avec flag `cancelled`) pour respecter la règle ESLint du projet `react-hooks/set-state-in-effect`, qui interdit un `setState` synchrone directement dans le corps d'un effet.

### 2.8 Clés VAPID

**Non générées** dans cette session (pas d'accès réseau sortant vers l'extérieur dans cet environnement — voir Limitations). Variables à configurer manuellement par Vincent, en générant une paire avec `npx web-push generate-vapid-keys` (ou équivalent) :
- Vercel (projet Kilio), exposée au client : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- Secrets de l'Edge Function Supabase (`supabase secrets set` ou Dashboard → Edge Functions → Secrets) : `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (ex. `mailto:vincent@...`)

Aucune vraie valeur générée ou committée.

### 2.9 Edge Function d'envoi (`supabase/functions/envoyer-rappels-taches/index.ts`)

Déployée via `mcp__Supabase__deploy_edge_function` (`verify_jwt: true`, cohérent avec l'appel authentifié par la clé publishable depuis pg_cron).

- Sélectionne les tâches candidates (`fait = false`, `toute_la_journee = false`, `heure`/`rappel_minutes` non nuls, `rappel_envoye_le is null`) via le client `supabase-js`, puis calcule côté TypeScript si chacune est due (plutôt qu'une expression SQL dans le `select`, cf. Écart ci-dessous).
- Pour chaque tâche due, envoie un push (titre = titre de la tâche, corps = `"dans {rappel_minutes} min"`) à tous les abonnements de `push_subscriptions`, signé VAPID via `npm:web-push@3.6.7`.
- Sur erreur 404/410 d'un abonnement, la ligne `push_subscriptions` correspondante est supprimée.
- `rappel_envoye_le = now()` posé sur la tâche après la boucle d'envoi, même si certains envois individuels ont échoué (pour ne pas spammer en boucle).
- Si les secrets VAPID ne sont pas encore configurés, répond `200` avec un message d'erreur explicite plutôt que de crasher (`WORKER_ERROR`) — comportement observé et corrigé pendant cette session (voir Vérification).

**Écart par rapport au prompt** : le filtrage "l'instant `echeance + heure - rappel_minutes` tombe dans `[now - 1 min, now]`" est fait en TypeScript (conversion `Europe/Paris` → UTC via `Intl.DateTimeFormat`, gère automatiquement l'heure d'été/hiver) plutôt qu'en SQL. Le mono-utilisateur de Kilio est en France, `echeance`/`heure` sont saisis via des `<input date>`/`<input time>` qui reflètent l'heure locale du navigateur — donc l'heure de Paris, pas UTC — et PostgREST/`supabase-js` ne permet pas d'exprimer une expression arithmétique sur des colonnes dans un filtre `.select()` sans ajouter une fonction SQL dédiée (non demandée par le prompt). Faire ce calcul en TypeScript évite d'ajouter un objet SQL supplémentaire non spécifié, tout en gérant correctement le fuseau horaire (une gestion naïve en UTC aurait décalé les rappels d'1h à 2h selon la saison).

### 2.10 Planification pg_cron (`scripts/migration-cron-rappels-taches-2026-09-01.sql`)

Appliquée via `mcp__Supabase__apply_migration` :
- `create extension if not exists pg_cron with schema pg_catalog;` + `grant usage`/`grant all privileges` sur le schéma `cron` à `postgres` (pattern documenté par Supabase).
- `vault.create_secret` pour `project_url` et `publishable_key` (la clé anon/publishable — pas la `service_role` — puisqu'elle suffit à passer la vérification JWT de la fonction et qu'elle est déjà publique côté client via `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).
- `cron.schedule('rappels-taches', '* * * * *', ...)` appelant `net.http_post` vers `envoyer-rappels-taches` toutes les minutes.

Vérifié : `cron.job` contient bien `rappels-taches` (`active: true`), et `cron.job_run_details`/`net._http_response` confirment que l'appel HTTP part effectivement chaque minute.

## Phase 3 — Vérification

- `npx tsc --noEmit` : ✅ aucune erreur après `npm install` (le repo n'avait pas `node_modules`, installé dans cette session) et `npm run build` (génère `.next/types`, nécessaire pour l'erreur préexistante `Cannot find name 'LayoutProps'` dans `src/app/layout.tsx`, sans rapport avec ce travail). `tsconfig.json` : ajout de `supabase/functions` à `exclude` (code Deno avec des spécificateurs `npm:`/global `Deno`, incompatible avec la config TS du projet Next.js — sinon `tsc` échouait aussi sur l'Edge Function).
- `npx eslint .` : ✅ aucune erreur ni warning. Un aller-retour a été nécessaire sur `NotificationsRow.tsx` : la première version appelait `setState` directement et synchrone dans le corps de l'effet (règle `react-hooks/set-state-in-effect`) — corrigé en encapsulant la logique dans une fonction async interne à l'effet (pattern "fetch au montage" avec flag `cancelled`).
- `npm run build` : ✅ build de production réussi, toutes les routes compilent (`/agenda` inclus).
- **Edge Function** : déployée et testée en conditions réelles de cron (secrets VAPID non configurés à ce stade) :
  - 1er déploiement : crash `WORKER_ERROR` au premier appel pg_cron (`webpush.setVapidDetails` levait une exception au chargement du module, faute de `VAPID_SUBJECT`).
  - Correction : garde `vapidConfigured` avant d'appeler `setVapidDetails`, réponse `200` explicite si les secrets manquent. Redéployé, confirmé par `net._http_response` (`status_code: 200`, message clair) sur les deux minutes suivantes.
  - Ce test confirme au passage que l'import `npm:web-push@3.6.7` et `npm:@supabase/supabase-js@2` se charge correctement dans l'Edge Runtime (Deno) — la partie signature VAPID/envoi effectif (`webpush.sendNotification`) n'a en revanche **pas** pu être exercée (pas de clés VAPID, pas d'abonnement `push_subscriptions` existant).
- **UI (Agenda, formulaire)** : pas de test visuel en navigateur possible dans cet environnement — `npm run dev` démarre, mais toute page qui interroge Supabase (dont `/agenda`) échoue avec `Host not in allowlist: vsmtkopkqasrdnjceegp.supabase.co` (politique réseau sortant de ce sandbox, qui n'autorise que les appels via les outils MCP Supabase, pas un accès HTTP direct/navigateur). Relecture attentive du code à la place : le flux checkbox → masquage heure/rappel, `defaultEcheance` du FAB, et le câblage `Modal`/`AddTaskForm` sont cohérents avec le pattern déjà utilisé par `QuickAddFab`/`AddTaskToggle`.

## Fichiers créés

- `scripts/migration-taches-notifications-2026-09-01.sql` (+ `-revert.sql`)
- `scripts/migration-cron-rappels-taches-2026-09-01.sql` (+ `-revert.sql`)
- `src/app/actions/notifications.ts`
- `src/lib/push/subscribe.ts`
- `supabase/functions/envoyer-rappels-taches/index.ts`
- `reports/2026-09-01-notifications-taches.md` (ce rapport)

## Fichiers modifiés

- `src/lib/supabase/types.ts` (régénéré : `taches` étendu, `push_subscriptions` ajouté)
- `src/app/actions/taches.ts` (`toute_la_journee`/`rappel_minutes`, reset `rappel_envoye_le`)
- `src/app/(app)/taches/AddTaskForm.tsx` (case "Toute la journée", sélecteur Rappel, champ Heure contrôlé)
- `src/app/(app)/agenda/AgendaView.tsx` (FAB + `Modal` + `AddTaskForm`)
- `public/sw.js` (listeners `push`/`notificationclick`)
- `src/app/(app)/reglages/NotificationsRow.tsx` (toggle branché sur `subscribe.ts`)
- `tsconfig.json` (exclusion de `supabase/functions`)

## Limitations connues

- **web-push en Deno** : `npm:web-push@3.6.7` est utilisé pour la signature VAPID et le chiffrement `aes128gcm` du payload (dépend de `node:crypto` — `createECDH`, `createCipheriv`, `createSign` — supporté par la compatibilité NPM des Supabase Edge Functions). Le chargement du module a été confirmé fonctionnel en conditions réelles (cf. Vérification), mais l'envoi effectif d'une notification (`webpush.sendNotification`) n'a pas pu être testé de bout en bout faute de clés VAPID et d'abonnement enregistré — à vérifier par Vincent lors du premier test manuel. Aucune librairie Deno-native équivalente à jour n'a été identifiée ; c'est donc le choix retenu.
- **Réseau sortant de cet environnement** : bloqué vers `*.supabase.co` en dehors des outils MCP dédiés — impossible de tester l'app en conditions réelles dans un navigateur (`npm run dev` + Supabase) ou d'invoquer l'Edge Function directement en HTTP depuis ce sandbox. Toute vérification "live" (page Agenda, formulaire, réception effective d'un push) reste à faire par Vincent après déploiement sur Vercel.
- **Fuseau horaire** : le calcul de l'échéance du rappel suppose que Vincent est en France (`Europe/Paris`), cohérent avec le reste de l'app qui ne gère aucun fuseau explicitement.

## Instructions pour tester manuellement

1. Configurer les variables d'environnement (Vercel + secrets Supabase Edge Functions, cf. 2.8) avec une vraie paire de clés VAPID générée localement (`npx web-push generate-vapid-keys`).
2. Aller dans Réglages → activer le toggle "Notifications" (accepter la demande de permission du navigateur).
3. Créer une tâche avec une heure dans les 2 prochaines minutes et un rappel "5 min avant" (ou ajuster l'heure/le rappel pour que l'échéance du rappel tombe dans la minute qui suit).
4. Attendre l'exécution du cron (`* * * * *`, donc au plus 1 minute) et vérifier la réception de la notification push (sur mobile : app fermée ou en arrière-plan, pour bien tester le push et pas juste un toast in-app).
5. Vérifier en base que `taches.rappel_envoye_le` a bien été renseigné après envoi (`select titre, rappel_envoye_le from taches where id = '...'`).
6. Vérifier qu'un déplacement de la tâche (nouvelle heure) remet `rappel_envoye_le` à `null` et redéclenche un rappel au nouveau moment.

## Fin

Pas de push automatique, conformément aux instructions. En attente de confirmation de Vincent avant de pousser sur `kilio`.
