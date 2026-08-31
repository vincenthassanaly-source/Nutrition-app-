# QuickAddFab : labels texte + bouton "Courses" — 2026-08-31

## Contexte

`QuickAddFab.tsx` (éventail du bouton "+" flottant) proposait jusqu'ici 2 actions ("Nouvelle tâche", "Nouvelle note"), affichées comme des boutons ronds icône-seule (48px), sans libellé texte, empilés au-dessus du bouton principal.

## 1. Labels texte à côté de chaque bouton rond

Chaque bouton secondaire ("Tâches", "Notes", et le nouveau "Courses") est maintenant un seul `<button>` englobant :
- un `<span>` pill à gauche (`rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink shadow-card`) portant le libellé texte,
- un `<span>` cercle à droite (48px, `border-line`/`bg-surface`/`shadow-card`, identique au style précédent) contenant l'icône SVG.

Le `<button>` reste le seul élément focusable/cliquable (accessibilité), garde son `aria-label` existant, et porte toujours les transitions `opacity`/`transform: translateY`/`pointerEvents` pilotées par `dialOpen`/`dialInteractive` — label et icône apparaissent/disparaissent donc strictement ensemble, comme avant.

## 2. Bouton "Courses"

Ajouté au type `Mode` (`null | "menu" | "tache" | "note" | "course"`) et dans les deux `useBackClose` (fermeture du dial, et remontée au menu depuis un formulaire).

Positionné juste après le bouton rond principal dans le DOM (avant "Tâches" et "Notes") : le conteneur étant en `flex-col-reverse`, c'est donc le bouton le plus proche du "+" central, avec "Tâches" et "Notes" au-dessus. Style rigoureusement identique aux 2 autres boutons (cercle 48px, mêmes transitions). Icône : panier de courses en SVG outline (`stroke="currentColor"` `strokeWidth="2.2"` `strokeLinecap="round"` `strokeLinejoin="round"`, `viewBox 0 0 24 24`), cohérente avec les icônes coche/crayon existantes.

## 3. Branchement du formulaire

```tsx
{mode === "course" && (
  <Modal title="Ajouter à la liste de courses" onClose={() => history.back()}>
    <AddCourseForm onDone={() => goBackSteps(2)} />
  </Modal>
)}
```

`AddCourseForm` (`src/app/(app)/courses/AddCourseForm.tsx`) n'attend que la prop `onDone` — il appelle directement la Server Action `createCourseItem(libelle)` (`src/app/actions/courses.ts`). Aucune prop supplémentaire nécessaire, contrairement à `AddTaskForm` (`listes`/`tags`).

`src/app/(app)/page.tsx` n'a pas été modifié : `QuickAddFab` continue de recevoir `listes` et `tags` comme avant.

## Fichiers modifiés

- `src/app/(app)/QuickAddFab.tsx` — seul fichier modifié (type `Mode`, `useBackClose`, nouveau bouton "Courses", labels texte sur les 3 boutons secondaires, branchement `AddCourseForm`).

## Vérifications (Phase 3)

- `npm install` : nécessaire au préalable, `node_modules/` absent dans l'environnement de session.
- `npx tsc --noEmit` : ✅ aucune erreur (une erreur `LayoutProps` dans `layout.tsx`, sans rapport avec ce changement, disparaît dès que les types générés par Next.js existent — régénérés par `npm run build`).
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` : ✅ build de production réussi, toutes les routes (dont `/`) compilées sans erreur.
- `git status` : seul `src/app/(app)/QuickAddFab.tsx` modifié, `AGENTS.md` inchangé.
- Non testé manuellement dans un navigateur (pas de vérification visuelle de l'animation/alignement des labels ni de soumission réelle du formulaire "Courses" via Supabase).

---

Souhaites-tu que je pousse ces changements sur la branche `kilio` ?
