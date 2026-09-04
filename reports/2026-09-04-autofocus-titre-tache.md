# Autofocus sur le champ Titre à l'ouverture du formulaire de tâche — 2026-09-04

## Contexte / problème

À l'ouverture du formulaire d'ajout de tâche (`AddTaskForm.tsx`), le focus clavier n'était placé nulle part : l'utilisateur devait taper manuellement dans le champ **Titre** (`textarea#titre`) avant de pouvoir écrire, alors que c'est le premier champ du formulaire et celui que l'on remplit systématiquement en premier.

## Points d'entrée vérifiés

Recherche de `<AddTaskForm` dans tout `src/` : 4 points de montage.

| Fichier | Cas | Concerné par l'autofocus |
|---|---|---|
| `src/app/(app)/taches/AddTaskToggle.tsx` | Création, depuis `/taches` (bouton "+ Ajouter une tâche") | Oui |
| `src/app/(app)/agenda/AgendaView.tsx` | Création, depuis `/agenda` (DayView, dans une `<Modal>`) | Oui |
| `src/app/(app)/QuickAddFab.tsx` | Création, FAB global (dans une `<Modal>`) | Oui |
| `src/app/(app)/taches/TasksList.tsx` | Édition d'une tâche existante (`tache` fourni) | Non (volontairement) |

Le correctif est fait directement dans `AddTaskForm.tsx`, donc il s'applique automatiquement aux 3 cas de création sans toucher à leurs appelants.

## Solution appliquée

Ajout d'un `useEffect` au montage (dépendances `[]`) dans `AddTaskForm.tsx`, qui appelle `titreRef.current?.focus()` — réutilisation du `ref` déjà existant pour l'auto-resize du textarea, pas de nouveau `ref` ajouté.

```tsx
// Autofocus uniquement en création : ne vole pas le focus quand le formulaire sert à éditer une tâche existante.
useEffect(() => {
  if (!tache) titreRef.current?.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- ne doit s'exécuter qu'au montage
}, []);
```

Placé juste après l'effet d'auto-resize existant (`useEffect(..., [titre])`) : React exécute les effets d'un composant dans leur ordre de déclaration, donc le calcul de hauteur du textarea s'exécute toujours avant le `.focus()` au montage — `.focus()` ne déclenche pas de re-render et ne peut donc pas interférer avec ce calcul.

**Choix : création uniquement.** Le focus n'est posé que si `tache` n'est pas fourni (donc jamais en édition), pour ne pas surprendre l'utilisateur qui ouvre une tâche existante pour la consulter ou modifier un autre champ — comportement jugé le plus naturel, la consigne demandait de prioriser le cas création.

**`AddTaskToggle.tsx` et le `dynamic(..., { ssr: false })`** : le chargement dynamique ne pose pas de problème ici — `useEffect` se déclenche après le montage réel du composant chargé, que ce montage soit synchrone ou différé par un `import()` dynamique. Aucune modification nécessaire dans `AddTaskToggle.tsx`.

**Mobile / PWA** : `.focus()` seul ne garantit pas systématiquement l'ouverture du clavier virtuel selon le navigateur — comportement standard accepté, pas de hack supplémentaire ajouté (conforme à la consigne).

### Fichier modifié

- `src/app/(app)/taches/AddTaskForm.tsx` — ajout du `useEffect` d'autofocus (création uniquement)

## Vérifications effectuées

- `npx tsc --noEmit` : aucune erreur sur le fichier modifié (une erreur préexistante et non liée sur `src/app/layout.tsx` — `Cannot find name 'LayoutProps'` — disparaît après `next build`, qui génère les types de routes ; confirmé identique avant/après ce changement via `git stash`).
- `npx eslint` sur `AddTaskForm.tsx` : aucune erreur ni warning (le warning `react-hooks/exhaustive-deps` attendu sur un effet mount-only est supprimé via `eslint-disable-next-line`, pattern déjà utilisé ailleurs dans le repo — `RecettesList.tsx`, `TimeGrid.tsx`).
- `npx next build` : build réussi, aucune régression de route (`/taches` reste `○` statique, `/agenda` reste `ƒ` dynamique).
- Test manuel mental : ouverture du formulaire depuis `/taches` (`AddTaskToggle`) et depuis `/agenda` (`AgendaView`, DayView) → `titreRef.current?.focus()` s'exécute au montage dans les deux cas, le curseur est actif dans le champ Titre dès l'affichage du formulaire. Ouverture en édition depuis `TasksList` → pas de vol de focus, comportement inchangé.
