# Lazy-loading des formulaires lourds

## Contexte

Audit préalable : 4 formulaires volumineux étaient importés statiquement
dans des pages liste/vue alors qu'ils ne sont nécessaires qu'à l'ouverture
(ajout/édition) :

- `AddTaskForm` (420 lignes)
- `NoteForm` (354 lignes)
- `RecurrenceForm` (194 lignes)
- `RecetteForm` (204 lignes)

Objectif : les convertir en `next/dynamic({ ssr: false })`, sans composant
`loading` (aucun indicateur visible, décision de Vincent — composants
suffisamment légers pour un chargement perçu comme instantané).

## Phase 1 — Vérification de l'audit

Repo resynchronisé (`git fetch origin kilio` — la branche de travail
`claude/kilio-lazy-load-forms-jqne2t` était déjà à jour avec `origin/kilio`,
commit `e231eb4`). Tous les fichiers et tailles de l'audit se sont confirmés
exacts, sans écart :

| Formulaire | Lignes | Export | Points d'import |
|---|---|---|---|
| `AddTaskForm.tsx` | 420 | nommé (`AddTaskForm`) | `TasksList.tsx`, `AddTaskToggle.tsx`, `AgendaView.tsx`, `QuickAddFab.tsx` |
| `NoteForm.tsx` | 354 | nommé (`NoteForm`) | `AddNoteToggle.tsx`, `NoteCard.tsx`, `QuickAddFab.tsx` |
| `RecurrenceForm.tsx` | 194 | nommé (`RecurrenceForm`) | `RecurrenceModeForm.tsx` |
| `RecetteForm.tsx` | 204 | nommé (`RecetteForm`) | `AddRecetteToggle.tsx`, `RecetteHeader.tsx` |

Tous les exports sont **nommés**, pas par défaut (l'exemple du prompt
supposait un export nommé — confirmé, pattern appliqué tel quel avec
`.then((m) => m.NomDuComposant)`).

Tous les points d'import sont bien des composants `"use client"`, et dans
chaque cas le formulaire n'est monté qu'après une interaction (état
`editing`/`open`/`fabOpen`/`mode`), jamais au rendu initial — confirmé par
lecture de chaque fichier.

**Écart non signalé dans l'audit** : `RecurrenceModeForm.tsx` importe à la
fois `RecurrenceForm` et un formulaire voisin non mentionné dans le prompt,
`RecurrenceVirementForm.tsx`. Seul `RecurrenceForm` fait partie du périmètre
des 4 formulaires ciblés ; `RecurrenceVirementForm` (5e formulaire, hors
périmètre) a été laissé en import statique, sans modification.

**`Modal.tsx`** : 45 lignes seulement, jugé trop léger pour justifier un
`next/dynamic` séparé — non modifié, conformément à la marge d'appréciation
laissée par le prompt.

## Phase 2 — Implémentation

Remplacement de l'import statique par `next/dynamic({ ssr: false })`, sans
`loading`, à chacun des 9 points d'import (4 formulaires × leurs points
d'usage respectifs) :

- `src/app/(app)/taches/TasksList.tsx`
- `src/app/(app)/taches/AddTaskToggle.tsx`
- `src/app/(app)/agenda/AgendaView.tsx`
- `src/app/(app)/QuickAddFab.tsx` (2 formulaires : `AddTaskForm` + `NoteForm`)
- `src/app/(app)/notes/AddNoteToggle.tsx`
- `src/app/(app)/notes/NoteCard.tsx`
- `src/app/(app)/budget/recurrentes/RecurrenceModeForm.tsx`
- `src/app/(app)/nutrition/recettes/AddRecetteToggle.tsx`
- `src/app/(app)/nutrition/recettes/[id]/RecetteHeader.tsx`

Aucune autre logique touchée (props, comportement, state identiques).

## Phase 3 — Vérifications

- `npx tsc --noEmit` (après `npm install`, `node_modules` absent au
  démarrage) → **OK**, aucune erreur de type sur les fichiers modifiés.
- `npm run lint` → **OK**, aucune erreur ESLint.
- `npm run build` → build réussi (Turbopack et `--webpack`), toutes les
  routes concernées compilent sans erreur.

### Taille des chunks avant/après

Le build par défaut (Turbopack) n'affiche plus de table "First Load JS"
dans cette version de Next.js. Mesure faite via `next build --webpack`
(avant = `git stash` des 9 fichiers, après = HEAD de travail), en comparant
les chunks JS effectivement émis pour chaque route.

**Le vrai signal n'est pas la taille du chunk `page.js` lui-même (bruitée
par le rehashage global des chunks), mais l'emplacement du code du
formulaire** — recherché par une chaîne de caractères propre à chaque
formulaire (ex. `"urgent, maison"` pour `AddTaskForm`, `"perso, idées"` pour
`NoteForm`, `categorie_id` pour `RecurrenceForm`, `hellofresh` pour
`RecetteForm`) :

| Formulaire | Avant | Après |
|---|---|---|
| `AddTaskForm` | Bundlé dans **un chunk partagé de 14,5 Ko**, référencé par le `client-reference-manifest` de **32 pages** (quasiment toute l'app — `QuickAddFab` étant rendu dans le layout partagé) | Extrait en 2 chunks à la demande (11,7 Ko + 10,6 Ko), **plus référencé par aucune page** — chargé uniquement à l'ouverture du formulaire |
| `NoteForm` | Bundlé dans **un chunk partagé de 11,9 Ko**, référencé par **27 pages** | Extrait en 2 chunks à la demande (7,4 Ko + 6,8 Ko), plus dans aucun chunk de page |
| `RecurrenceForm` | Inline dans `budget/recurrentes/page.js` (14,3 Ko) | Retiré du chunk de page (11,3 Ko après, soit -3,4 Ko) ; extrait dans son propre chunk à la demande (3,8 Ko) |
| `RecetteForm` | Inline dans `nutrition/recettes/page.js` (9,9 Ko) **et** `nutrition/recettes/[id]/page.js` (22 Ko) | Retiré des deux chunks de page (8,4 Ko et 20,9 Ko après) ; extrait dans 2 chunks à la demande (4,3 Ko + 4,6 Ko) |

Constat le plus significatif : `AddTaskForm` et `NoteForm` n'étaient pas
seulement alourdis sur `/taches`, `/agenda` ou `/notes` — leur code
(bundlé ensemble via `QuickAddFab`, rendu dans le layout de l'app) était
téléchargé sur **la quasi-totalité des pages de Kilio**, y compris
`/reglages`, `/plus`, `/habitudes`, `/courses`, etc. qui n'affichent jamais
ces formulaires. Le lazy-loading supprime entièrement ces ~14,5 Ko + 11,9 Ko
du chargement initial de toute page, au profit d'un chargement à la
demande uniquement quand l'utilisateur ouvre effectivement le formulaire.

### Test manuel (dev server)

Serveur de dev lancé avec les vraies clés Supabase (projet `kilio`,
`vsmtkopkqasrdnjceegp`, via l'outil MCP Supabase) et vérifié via Playwright
(Chromium headless) :

- **`/taches`** → clic sur "+ Ajouter une tâche" → `AddTaskForm` s'affiche
  intégralement et instantanément (Titre, Liste, Priorité, Échéance, Heure,
  Notes, Images, tags, bouton Créer), **aucun indicateur de chargement
  visible**. ✅
- **`/notes`** → clic sur "+ Ajouter une note" → `NoteForm` s'affiche
  intégralement et instantanément (Texte/Checklist, Titre, Contenu,
  Couleur, tags, bouton Créer la note), **aucun indicateur de chargement
  visible**. ✅
- **`/agenda`** et **`/nutrition/recettes`** → non vérifiables visuellement
  dans cet environnement : ces deux pages font planter le rendu React côté
  client (`getTachesAvecRelations` / requête recettes) car l'hôte Supabase
  du projet n'est pas dans la liste d'hôtes sortants autorisée par la
  sandbox réseau de cet environnement (`Host not in allowlist`) — restriction
  de la sandbox, sans rapport avec le changement de lazy-loading (le crash
  a lieu dans le fetch de données de la page, pas dans le composant
  différé). Le point rassurant : la vérification par build (chunks séparés,
  `tsc`/`lint`/`build` propres) couvre ces deux formulaires de la même
  façon que les deux testés visuellement, et le pattern appliqué est
  strictement identique aux deux cas validés en direct.

## Fichiers modifiés

- `src/app/(app)/taches/TasksList.tsx`
- `src/app/(app)/taches/AddTaskToggle.tsx`
- `src/app/(app)/agenda/AgendaView.tsx`
- `src/app/(app)/QuickAddFab.tsx`
- `src/app/(app)/notes/AddNoteToggle.tsx`
- `src/app/(app)/notes/NoteCard.tsx`
- `src/app/(app)/budget/recurrentes/RecurrenceModeForm.tsx`
- `src/app/(app)/nutrition/recettes/AddRecetteToggle.tsx`
- `src/app/(app)/nutrition/recettes/[id]/RecetteHeader.tsx`

## Écarts par rapport au prompt

1. Tous les exports sont nommés (pas de composant par défaut) — le pattern
   `.then((m) => m.NomDuComposant)` a été appliqué partout, sans variante.
2. `RecurrenceVirementForm.tsx`, non mentionné dans l'audit, importe
   également `RecurrenceForm` en tant que voisin dans `RecurrenceModeForm.tsx`
   — hors périmètre, laissé tel quel.
3. `Modal.tsx` jugé trop léger (45 lignes) pour justifier un `next/dynamic`
   séparé, conformément à la marge de jugement laissée par le prompt.
4. Le build Turbopack par défaut n'affiche plus de table de tailles
   "First Load JS" dans cette version de Next.js — la mesure de tailles de
   chunks a été faite via `next build --webpack` (mesure uniquement, aucun
   changement de configuration de build livré).
5. Test manuel visuel limité à 2 des 4 formulaires (`/taches`, `/notes`) à
   cause d'une restriction réseau de la sandbox (voir ci-dessus) — pas un
   écart de comportement, une limite de l'environnement de vérification.

## Statut

Changements prêts sur la branche `claude/kilio-lazy-load-forms-jqne2t`,
**pas encore poussés sur `kilio`** — confirmation de Vincent requise avant
push, conformément à la consigne du prompt.
