# Bouton flottant "+" sur l'accueil — 2026-08-31

## Constats de la Phase 1

- Branche `kilio` resynchronisée (`git reset --hard origin/kilio`, HEAD à `11c19f3`) avant toute lecture : la session précédente était restée sur un état 30 commits en retard.
- Aucun composant modal/bottom-sheet existant (`grep -r "fixed inset-0" src` → aucun résultat) : `src/components/Modal.tsx` est bien un composant à créer, conformément au prompt.
- Schéma Supabase (projet `vsmtkopkqasrdnjceegp`) vérifié via `list_tables` + `information_schema.columns` : `taches`, `listes_taches`, `tags`, `notes` correspondent exactement au code du repo (colonnes, types) — aucun décalage repo/DB constaté cette fois.
- `notes` n'est toujours affichée nulle part sur l'accueil (`src/app/(app)/page.tsx` ne référence pas la table `notes`) : `revalidatePath("/")` dans `createNote` n'était donc pas nécessaire, conformément à l'hypothèse du prompt.
- `AddTaskForm` et `NoteForm` acceptent déjà tous deux une prop `onDone` (utilisée par `AddTaskToggle`/`AddNoteToggle`) : point d'intégration direct, sans aucune modification de ces deux fichiers ni des server actions `createTache`/`createNote`.

## Fichiers créés / modifiés

- `src/components/Modal.tsx` (créé) : bottom-sheet générique et réutilisable, `"use client"`.
  - Overlay `fixed inset-0 z-50`, fond `bg-black/40 backdrop-blur-sm`, fermeture au clic sur l'overlay (`onClick` sur le conteneur externe, `stopPropagation` sur le contenu).
  - Contenu en feuille remontant du bas (`items-end`, `rounded-t-[22px]`), qui redevient une carte centrée arrondie sur écran large (`sm:rounded-[22px] sm:mb-6`), `shadow-card` et `border-line` comme le reste du design system (`@/lib/ui`).
  - En-tête sticky avec titre + bouton croix (`aria-label="Fermer"`).
  - Zone de contenu `overflow-y-auto` avec `max-h-[85vh]` sur le conteneur parent, `padding-bottom: calc(env(safe-area-inset-bottom) + 20px)`.
  - Props : `title`, `onClose`, `children` — pas de dépendance externe.
- `src/app/(app)/QuickAddFab.tsx` (créé) : bouton flottant + logique du menu/modal, `"use client"`.
  - FAB rond `fixed right-4 z-40`, `bottom: calc(env(safe-area-inset-bottom) + 90px)`, fond `var(--accent-kcal)`, icône "+" blanche, `shadow-card`.
  - État `mode` (`null | "menu" | "tache" | "note"`) piloté en `useState`, un seul composant gère tout le flux (FAB → menu → formulaire).
  - Le menu ("Nouvelle tâche" / "Nouvelle note") est le premier écran du `Modal` (option choisie plutôt qu'un mini-menu flottant au-dessus du bouton, plus simple et cohérent avec le pattern bottom-sheet déjà utilisé pour les formulaires).
  - `AddTaskForm` et `NoteForm` intégrés tels quels (tous leurs champs actuels, aucune version allégée), avec `onDone={() => setMode(null)}` : la fenêtre se ferme après création réussie, sans redirection.
- `src/app/(app)/page.tsx` (modifié) :
  - Import de `getListes`/`getTags` (déjà exportées par `@/app/actions/taches`, utilisées telles quelles) et ajout de ces deux appels dans le `Promise.allSettled` existant, avec fallback `[]` en cas d'échec — même pattern de dégradation gracieuse que le reste de la page (une source en erreur ne casse pas l'accueil).
  - Ajout de `<QuickAddFab listes={listes} tags={tags} />` en fin de page. **Choix de structure** : fetch côté Server Component plutôt que `useEffect`/action dédiée côté client, pour rester cohérent avec le fait que `page.tsx` est déjà un Server Component qui agrège plusieurs sources en une seule passe — évite un aller-retour réseau supplémentaire après l'affichage initial.
- `src/app/actions/taches.ts` (modifié) : ajout de `revalidatePath("/")` dans `revalidateTachesPaths()`, appelée par `createTache` (et les autres mutations de tâches) — la tâche du jour créée depuis le bouton + apparaît immédiatement dans la carte "Aujourd'hui" de l'accueil.

## Écarts par rapport au prompt

- Aucun écart fonctionnel. Seul choix laissé libre par le prompt tranché : menu "Nouvelle tâche/Nouvelle note" rendu comme premier écran du modal plutôt que comme mini-menu flottant au-dessus du FAB.

## Phase 3 — Vérification

- `npx tsc --noEmit` : aucune erreur (après `npm install`, `node_modules` absent au démarrage de la session).
- `npx eslint .` : aucune erreur.
- `npm run build` : build de production réussi (Next.js 16.3.3 / Turbopack), toutes les routes compilent.
- Vérification manuelle via serveur `next dev` + Playwright (Chromium headless, viewport 390×844, `.env.local` temporaire pointé vers le projet Supabase `kilio` puis supprimé en fin de vérification) :
  - FAB bien positionné au-dessus de la `BottomNav`, aucun chevauchement visuel (capture d'écran vérifiée) ; pas de conflit avec le `ThemeToggle` (coins opposés de l'écran).
  - Menu "Ajouter" → bottom-sheet avec "Nouvelle tâche" / "Nouvelle note" : ouverture/fermeture OK.
  - Formulaire tâche complet affiché dans le modal (titre, liste, priorité, échéance, heure, notes, tags, nouveaux tags, récurrence) — bien scrollable, en-tête reste visible.
  - Formulaire note complet affiché (titre + contenu).
  - Fermeture testée par les 3 voies : clic sur l'overlay, clic sur la croix, et ré-ouverture du FAB après fermeture (toutes confirmées par script Playwright, comptage DOM avant/après).
  - **Limite de l'environnement de vérification** : cette session tourne dans un conteneur dont la politique réseau bloque tout accès sortant direct vers `*.supabase.co` (confirmé par un `curl` direct et par les logs `next dev` : `Host not in allowlist`). Le rendu à vide (dashboard "Rien de prévu aujourd'hui", listes/tags vides dans le modal) observé pendant les tests correspond donc à cette contrainte réseau du bac à sable, pas à un défaut du code — le `Promise.allSettled` dégrade proprement vers `[]`/valeurs par défaut comme conçu. Le test end-to-end réel (sélection d'une liste, soumission, fermeture automatique, apparition de la tâche sur l'accueil) n'a donc pas pu être validé avec de vraies données dans cette session ; la logique a été relue et suit exactement le pattern déjà en production dans `AddTaskToggle`/`AddNoteToggle` (mêmes props `onDone`, même `useActionState`).
  - Rappel (hors périmètre de cette tâche, déjà connu du projet) : l'avisory Supabase signale RLS désactivée sur toutes les tables — cohérent avec le choix assumé "mono-utilisateur, pas d'auth/RLS" documenté dans `AGENTS.md`.

## Prochaine étape

Poussée non effectuée — en attente de confirmation de Vincent avant `git push` sur `kilio`.
