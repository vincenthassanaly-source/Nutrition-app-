# Généraliser la fermeture par bouton retour (Android) à toutes les modales

## Résumé

`useBackClose` (déjà utilisé dans `QuickAddFab.tsx`) a été ajouté aux deux seuls composants du repo qui ouvrent une véritable couche overlay (`Modal` partagé ou `fixed inset-0`) via un `useState` local : le nouvel événement de `AgendaView.tsx` et le lightbox photo `ImageLightbox.tsx`. Tous les autres composants listés dans la consigne comme candidats potentiels ont été audités et exclus : ils affichent leur formulaire d'ajout/édition **en ligne** (une `card` qui remplace le bouton ou la ligne dans le flux normal de la page), pas dans une couche superposée — le bouton retour matériel n'a donc pas vocation à les fermer différemment d'une navigation classique.

## Phase 1 — Audit exhaustif

Recherche systématique de tout usage de `<Modal` (le composant partagé) et de la classe `fixed inset-0` (overlay plein écran) dans `src/**/*.tsx`, en plus de la relecture individuelle de chacun des ~29 fichiers listés dans la consigne.

Résultat de la recherche exhaustive :
- `<Modal` : seulement `QuickAddFab.tsx` (référence, non touché) et `agenda/AgendaView.tsx`.
- `fixed inset-0` : seulement `components/Modal.tsx`, `components/ImageLightbox.tsx` et `QuickAddFab.tsx`.

Aucun autre composant du repo ne rend une couche overlay/plein écran contrôlée par un état local — la prémisse de la consigne (une liste de ~25 modales candidates) ne correspond pas à l'état actuel du code : tous les toggles "Ajouter"/"Modifier" listés affichent leur formulaire **dans le flux de la page** via la classe `card` (`rounded-[22px] border ... bg-surface p-4`, définie dans `src/lib/ui.ts`), sans `position: fixed` ni superposition — ce sont des sections qui remplacent un bouton ou une ligne de liste, pas des modales.

## Composants modifiés

| Fichier | Changement |
|---|---|
| `src/app/(app)/agenda/AgendaView.tsx` | Ajout de `useBackClose(fabOpen, () => setFabOpen(false))` : le retour ferme la modale "Nouvel événement" (`Modal` partagé) au lieu de quitter l'app/naviguer. Un seul niveau (pas de menu empilé comme dans `QuickAddFab`), donc pas de `goBackSteps` nécessaire — le bouton × et le clic sur le backdrop du `Modal` continuent d'appeler `setFabOpen(false)` sans changement, `useBackClose` nettoie automatiquement l'entrée d'historique dans tous les cas. |
| `src/components/ImageLightbox.tsx` | Ajout de `useBackClose(true, onClose)` directement dans le composant. Contrairement à `Modal.tsx` (partagé par plusieurs appelants, dont `QuickAddFab` qui gère déjà son propre empilement — y ajouter le hook doublerait ses entrées d'historique), `ImageLightbox` n'est monté que pendant qu'il est affiché : son `active` vaut donc toujours `true` tant qu'il existe dans l'arbre, et le hook est sans risque à appeler en interne. Le bouton × et le clic sur le backdrop restent inchangés (`onClick={onClose}` / `onClick={onClose}`) ; le retour matériel ferme désormais le lightbox au lieu de quitter l'app. Seul appelant actuel : `TasksList.tsx` (`TacheImagesRow`), non modifié — il passe déjà un `onClose` qui met à jour son état local, ce qui suffit. |

## Composants exclus (et pourquoi)

Tous les composants suivants affichent leur formulaire en ligne (`card` dans le flux normal, remplaçant le bouton "+ Ajouter…" ou la ligne "Modifier" — pas d'overlay `fixed`, pas de `Modal`) : le retour matériel s'en va normalement de la page comme pour n'importe quel contenu en ligne, il n'y a pas de couche à "fermer" au sens de la consigne.

- `taches/AddTaskToggle.tsx`, `taches/listes/AddListeToggle.tsx`, `taches/listes/AddTagToggle.tsx`, `notes/AddNoteToggle.tsx`, `objectifs/AddObjectifToggle.tsx`, `habitudes/AddHabitudeToggle.tsx`, `budget/transactions/AddTransactionToggle.tsx`, `budget/comptes/AddCompteToggle.tsx`, `budget/categories/AddCategorieToggle.tsx`, `budget/categories/AddSousCategorieToggle.tsx`, `budget/recurrentes/AddRecurrenceToggle.tsx`, `courses/AddCourseToggle.tsx`, `nutrition/recettes/AddRecetteToggle.tsx` — toggle "+ Ajouter…" → `card` en ligne, `Annuler` remet `open` à `false`.
- `taches/TasksList.tsx` (édition de tâche, `TaskCard`), `taches/listes/ListesManager.tsx` (édition de liste, `ListeRow`), `notes/NotesList.tsx` (édition de note, `NoteCard`), `objectifs/[id]/ObjectifHeader.tsx`, `objectifs/ObjectifCard.tsx`, `habitudes/HabitudeCard.tsx`, `budget/transactions/TransactionsList.tsx` (`TransactionRow`), `budget/comptes/ComptesList.tsx` (`CompteCard`), `budget/recurrentes/RecurrencesList.tsx` (`RecurrenceRow`), `nutrition/recettes/[id]/RecetteHeader.tsx` — même pattern : l'état `editing` remplace la carte/ligne par un formulaire en ligne (`card`), toujours dans le flux, jamais en overlay.
- `nutrition/recettes/[id]/IngredientsLibresManager.tsx`, `IngredientManager.tsx`, `EtapesManager.tsx` — édition inline ligne par ligne (`editing` bascule entre affichage et champs de saisie dans la même `<li>`), sans overlay ni `Modal`.
- `nutrition/recettes/[id]/RecetteMacros.tsx` — `detailOpen` est un simple accordéon (tableau nutritionnel détaillé qui s'affiche/se masque en ligne), assimilable aux "accordéons"/"dropdowns inline" explicitement exclus par la consigne.
- `GlobalSearchBar.tsx` — le panneau de résultats (`dropdownVisible`) est une liste déroulante positionnée en `absolute` sous le champ de recherche (pas `fixed inset-0`, pas de backdrop), qui se ferme déjà sur clic extérieur et sur `Échap` ; ce n'est pas un overlay plein écran/une modale, assimilable à un dropdown de recherche (`combobox`). Décision : exclu, cohérent avec le traitement des autres dropdowns inline.
- `reglages/NotificationsRow.tsx` — simple toggle de switch (cité en exemple d'exclusion par la consigne elle-même), vérifié : pas d'overlay.

## Phase 3 — Vérification

- `npx tsc --noEmit` : aucune erreur imputable aux changements (une seule erreur préexistante et non liée, `src/app/layout.tsx` `Cannot find name 'LayoutProps'`, présente à l'identique avant les changements — type généré par Next au build/dev, pas par `tsc` seul ; confirmée absorbée par le TypeScript check intégré à `next build`, qui passe sans erreur).
- `npx eslint` sur les deux fichiers modifiés : aucune erreur ni warning.
- `npm run build` : build de production complet, réussi (18 routes générées, aucune erreur).

## Comportement ambigu / décisions prises

- **`GlobalSearchBar`** : traitée mais exclue — ce n'est pas un overlay plein écran, juste un dropdown de résultats positionné sous le champ, avec fermeture déjà gérée (clic extérieur, `Échap`). Ajouter `useBackClose` dessus aurait un effet de bord discutable (consommer une entrée d'historique à chaque focus du champ de recherche, y compris sans résultat affiché) pour un gain UX marginal vis-à-vis d'un simple dropdown.
- **Périmètre plus restreint que prévu** : la liste de départ de la consigne supposait qu'un grand nombre de composants ouvraient une "modale" ; l'audit exhaustif (grep sur `<Modal` et `fixed inset-0` dans tout `src/`) montre que ce n'est le cas que pour `AgendaView.tsx` et `ImageLightbox.tsx` — tous les autres candidats listés utilisent un pattern d'édition/ajout en ligne (`card` dans le flux), volontairement laissé inchangé car hors du périmètre "modale/sheet/overlay" défini par la consigne elle-même.
- **`ImageLightbox.tsx`** : le hook a été ajouté à l'intérieur du composant lui-même (plutôt que dans `TasksList.tsx`, son seul appelant), car il est structurellement toujours monté-quand-actif — ce qui est explicitement permis par la consigne pour ce fichier (contrairement à `Modal.tsx`, qui reste interdit d'y toucher).

## Non fait

Push non effectué, conformément à la consigne — en attente de confirmation de Vincent avant de pousser sur `kilio`.
