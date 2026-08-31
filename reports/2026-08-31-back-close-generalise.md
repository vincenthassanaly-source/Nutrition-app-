# Généraliser la fermeture au bouton retour — 2026-08-31

## Contexte

`useBackClose` (`src/hooks/useBackClose.ts`) n'était branché que dans `QuickAddFab.tsx`. Objectif : appliquer le même mécanisme à tous les autres panneaux d'ajout/édition inline de l'app, pour qu'un appui sur retour (matériel Android, geste retour) ferme le panneau ouvert au lieu de naviguer ailleurs — fermeture immédiate, sans confirmation, comme un clic sur "Annuler".

## Helper ajouté : `useBackCloseToggle`

Le pattern `useState(false)` + `useBackClose(état, () => setÉtat(false))` était identique dans les ~24 composants concernés (un booléen ouvert par un bouton "+ Ajouter"/"Modifier"/"Éditer", fermé par "Annuler"/le backdrop/`onDone`). Plutôt que de dupliquer ces 2 lignes partout, `src/hooks/useBackClose.ts` exporte maintenant :

```ts
export function useBackCloseToggle(): [boolean, () => void] {
  const [open, setOpen] = useState(false);
  useBackClose(open, () => setOpen(false));
  return [open, () => setOpen(true)];
}
```

Usage :
```tsx
const [open, show] = useBackCloseToggle();
// bouton d'ouverture : onClick={show}
// tout ce qui ferme (Annuler, backdrop, onDone) : onClick={() => history.back()}
```

Le comportement reste identique à `useBackClose` — seule la fermeture directe (`setOpen(false)` en dehors du callback `onBack`) est retirée partout : toute fermeture passe par `history.back()`, jamais par un appel direct au setter, exactement comme dans `QuickAddFab.tsx`.

`useBackClose` et `goBackSteps` (le hook et le helper existants) ne sont pas modifiés. `QuickAddFab.tsx` n'a pas été touché.

## Composants traités (24)

Aucun cas d'empilement réel (panneau ouvert dans un panneau déjà ouvert) n'a été trouvé dans le code actuel en dehors de `QuickAddFab.tsx` — chaque panneau ci-dessous est un niveau unique, donc `useBackCloseToggle` suffit partout ; `goBackSteps` n'a été utile nulle part de plus qu'il ne l'était déjà. Voir "Écarts" ci-dessous pour le détail (notamment `AddSousCategorieToggle`, cité dans la demande comme exemple d'empilement, mais qui ne l'est pas dans le code réel).

**Toggles "+ Ajouter" (13)**
- `taches/AddTaskToggle.tsx`
- `taches/listes/AddListeToggle.tsx`
- `taches/listes/AddTagToggle.tsx`
- `notes/AddNoteToggle.tsx`
- `courses/AddCourseToggle.tsx`
- `habitudes/AddHabitudeToggle.tsx`
- `objectifs/AddObjectifToggle.tsx`
- `nutrition/recettes/AddRecetteToggle.tsx`
- `budget/comptes/AddCompteToggle.tsx`
- `budget/categories/AddCategorieToggle.tsx`
- `budget/categories/AddSousCategorieToggle.tsx`
- `budget/transactions/AddTransactionToggle.tsx`
- `budget/recurrentes/AddRecurrenceToggle.tsx`

**États d'édition inline dans les listes (11)**
- `taches/TasksList.tsx` (`TaskCard.editing`)
- `notes/NotesList.tsx` (`NoteCard.editing`)
- `budget/comptes/ComptesList.tsx` (`CompteCard.editing`)
- `budget/transactions/TransactionsList.tsx` (`TransactionRow.editing`)
- `budget/recurrentes/RecurrencesList.tsx` (`RecurrenceRow.editing`)
- `habitudes/HabitudeCard.tsx` (`editing`)
- `objectifs/ObjectifCard.tsx` (`editing`)
- `objectifs/[id]/ObjectifHeader.tsx` (`editing`)
- `nutrition/recettes/[id]/RecetteHeader.tsx` (`editing`)
- `nutrition/recettes/[id]/IngredientManager.tsx` (`IngredientLine.editing`, édition inline de la quantité)
- `taches/listes/ListesManager.tsx` (`ListeRow.editing`)

Pour chacun : le bouton d'ouverture (`+ Ajouter`, `Modifier`, `Éditer`) appelle désormais le `show`/`edit` renvoyé par `useBackCloseToggle` ; tous les points de fermeture (`Annuler`, `onDone` du formulaire) appellent `history.back()` au lieu de `setOpen(false)`/`setEditing(false)`.

## Composants volontairement exclus

- **`app/(app)/GlobalSearchBar.tsx`** — le booléen `ouvert` pilote un dropdown d'autocomplétion qui s'ouvre au *focus* du champ de recherche (pas un bouton "+ Ajouter"/"Modifier") et se ferme au clic extérieur, à Échap, ou à la sélection d'un résultat. Ce n'est pas un panneau d'ajout/édition : pousser une entrée d'historique à chaque focus du champ serait surprenant (retour matériel fermerait le clavier/dropdown au lieu de suivre le comportement standard d'un champ de recherche) et n'a pas de rapport avec la demande. Exclu.
- **`TasksList.tsx` — `expanded` (affichage des sous-tâches)** — ce booléen est ouvert par un badge affichant le nombre de sous-tâches (`+ sous-tâches` / `x/y`), pas par un bouton "+ Ajouter"/"Modifier" : c'est un accordéon d'affichage de contenu existant, pas un panneau d'ajout/édition. Le mini-formulaire "+ Sous-tâche" qu'il révèle est toujours monté (pas de propre état ouvert/fermé) — il n'y a donc rien à brancher sur `useBackClose`. Exclu ; seul `TaskCard.editing` (le vrai panneau d'édition de tâche) est traité.
- **Formulaire de budget cible dans `CategorieProgressCard.tsx`** — champ + bouton "Définir" toujours visible en ligne, sans état ouvert/fermé. Exclu (pas un panneau).

## Écart avec la demande initiale

La demande citait deux cas d'empilement à gérer avec `goBackSteps` :
- *"`AddSousCategorieToggle` à l'intérieur d'une catégorie en cours d'édition"* : dans le code actuel, `AddSousCategorieToggle` est rendu directement dans `CategorieProgressCard`/`CategorieRevenuRow` (`budget/categories/CategoriesList.tsx`, `CategorieProgressCard.tsx`), qui n'ont **pas** d'état d'édition propre (le formulaire de budget cible y est toujours affiché en ligne). Il n'y a donc pas d'empilement réel à cet endroit.
- *"l'ajout de sous-tâche dans une tâche déjà en édition"* : `AddTaskForm.tsx` (le formulaire d'édition de tâche) ne gère pas les sous-tâches — la gestion des sous-tâches (`SousTachesList`) est un composant séparé, affiché uniquement en mode lecture (`expanded`), jamais à l'intérieur du formulaire d'édition.

Dans les deux cas, un seul niveau de panneau est réellement ouvert à la fois dans le code existant ; `useBackCloseToggle` (un seul niveau) suffit donc partout, sans avoir besoin de `goBackSteps`. Aucun autre écart avec le pattern de référence de `QuickAddFab.tsx`.

## Vérifications

- `npx tsc --noEmit` (via `next build`, qui régénère les types de routes Next.js) : ✅ aucune erreur.
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` (`next build`) : ✅ build de production réussi, mêmes 23 routes qu'avant, aucune route cassée.
- Test manuel via `next dev` local (clé Supabase `publishable`/anon récupérée via MCP Supabase pour permettre le rendu, `.env.local` non commité) + Playwright headless, sur une page de test temporaire montant `AddTaskToggle`, `NotesList` (avec une note factice) et `AddCategorieToggle` — représentatifs des deux familles de composants traités (page et fichiers de test supprimés avant de terminer) :
  - Ouverture (`+ Ajouter`/`Modifier`) → panneau affiché, entrée d'historique poussée.
  - Retour navigateur (`page.goBack()`) → panneau fermé immédiatement, retour à la vue précédente (bouton/carte), **sans navigation hors de la page**.
  - "Annuler" → ferme aussi bien que le retour navigateur (passe par `history.back()`), y compris avec un champ de saisie commencé (pas de confirmation).
  - Après fermeture par retour, un 2ᵉ retour navigateur quitte réellement la page — donc pas d'entrée d'historique orpheline, pas de double-push.
  - Aucune erreur console/page (`pageerror`) sur l'ensemble des scénarios.
- **Non testé automatiquement** : le rendu complet des pages réelles de l'app (`/taches`, `/notes`, `/budget/...`, etc.) est bloqué dans cet environnement sandboxé — l'egress réseau vers le projet Supabase (`vsmtkopkqasrdnjceegp.supabase.co`) est refusé ("Host not in allowlist"), donc les server actions qui chargent les données réelles échouent (erreur 500). Le test ci-dessus contourne ce blocage avec des composants montés directement sur des données factices, ce qui valide le mécanisme (hook + wiring) mais **pas** chacun des 24 fichiers un par un en conditions réelles, ni sur mobile. **Un test manuel de Vincent sur mobile (ou Chrome DevTools en émulation mobile) reste nécessaire** pour confirmer visuellement, module par module, que le bouton retour ferme bien chaque panneau listé ci-dessus sans navigation intempestive — en particulier `IngredientManager` (édition inline de quantité, cas le plus différent du pattern de référence) et les toggles avec early-return (`AddTransactionToggle`, `AddRecurrenceToggle`).

## Fichiers modifiés

25 fichiers : les 24 composants listés ci-dessus + `src/hooks/useBackClose.ts` (ajout de `useBackCloseToggle`, aucune modification de `useBackClose`/`goBackSteps` existants).

---

Souhaites-tu que je pousse ces changements sur la branche `kilio` ?
