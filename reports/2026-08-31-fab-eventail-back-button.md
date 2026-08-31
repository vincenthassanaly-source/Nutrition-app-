# Éventail du FAB "+" et bouton retour matériel — 2026-08-31

## Ancien comportement

Le bouton "+" de l'accueil (`QuickAddFab.tsx`) ouvrait un `Modal` bottom sheet titré "Ajouter" avec 2 boutons texte pleine largeur ("Nouvelle tâche" / "Nouvelle note"). Choisir l'un des deux ouvrait un second `Modal` (le formulaire correspondant). `mode` (`null | "menu" | "tache" | "note"`) était mis à jour directement par les gestionnaires de clic (`setMode(...)`), sans aucune interaction avec `history` : aucun état de l'UI ne poussait d'entrée dans l'historique navigateur, donc le bouton retour matériel du téléphone fermait directement l'app dès qu'on l'utilisait pendant que le FAB, l'éventail ou un formulaire était ouvert.

## Nouveau design — éventail (speed dial)

`mode === "menu"` n'ouvre plus de `Modal` : il affiche 2 petits boutons ronds (48px, `border-line`/`bg-surface`/`shadow-card`, cohérents avec les cartes de l'app) empilés verticalement au-dessus du bouton "+" (56px), via un conteneur `fixed` en `flex flex-col-reverse` (le "+" reste en bas, "tâche" juste au-dessus, "note" au-dessus de "tâche"). Icônes SVG seules (`stroke="currentColor"` `strokeWidth="2.2"` `strokeLinecap="round"`, cohérent avec le "+" existant) : coche pour tâche, crayon pour note — pas de texte.

- Le "+" pivote à 45° (transition CSS 200ms) en croix quand `mode !== null`, standard confirmé absent de `src/lib/ui.ts` (aucune contre-indication trouvée).
- Ouverture/fermeture animée par `opacity` + `translateY` (200ms, `ease-out`) sur les 2 boutons — toujours montés dans le DOM, seuls `opacity`/`transform`/`pointer-events` changent, pour permettre l'animation de fermeture (une version qui les démontait conditionnellement avant l'animation a été essayée puis abandonnée : elle provoquait un bug de `setState` pendant le rendu qui empêchait les boutons d'apparaître — cf. tests plus bas).
- Overlay transparent plein écran (`fixed inset-0`, sans fond ni blur) derrière l'éventail : clic dessus → ferme (uniquement cliquable, `pointer-events`, quand `mode === "menu"`).
- Sélectionner "tâche"/"note" passe `mode` au formulaire correspondant, toujours affiché via `Modal.tsx` (bottom sheet inchangé).

## Bouton retour matériel — solution technique

### Hook `useBackClose` (`src/hooks/useBackClose.ts`)

Hook réutilisable `useBackClose(active: boolean, onBack: () => void)` : tant que `active` est vrai, pousse une entrée d'historique taguée d'un token unique (`useId()`). Quand cette entrée n'est plus l'entrée courante (retour matériel, ou tout `history.back()` déclenché ailleurs — y compris par une autre instance du hook empilée par-dessus), `onBack()` est appelé. Plusieurs instances peuvent être empilées (menu, puis formulaire par-dessus) : chacune ne réagit qu'une fois que *sa propre* entrée a été quittée.

`QuickAddFab` empile 2 instances :
```ts
useBackClose(mode !== null, () => setMode(null));
useBackClose(mode === "tache" || mode === "note", () =>
  setMode((m) => (m === "tache" || m === "note" ? "menu" : m))
);
```
La 2ᵉ utilise une mise à jour fonctionnelle (`setMode(m => ...)`) pour rester un no-op si la 1ʳᵉ a déjà tout fermé.

`mode` n'est modifié que par ces deux callbacks `onBack` (donc uniquement en réaction à un événement `popstate`), jamais directement par les boutons de fermeture de l'UI : "+" pour refermer l'éventail, clic hors éventail, bouton X du `Modal`, clic sur l'overlay du `Modal`, et `onDone` après soumission réussie appellent tous `history.back()` (ou `goBackSteps(2)`, voir plus bas) — jamais `setMode(null)` en direct.

### Bug trouvé en testant : listeners `popstate` empilés qui se désenregistrent entre eux

Premier design : le `popstate` listener de chaque instance était (dés)enregistré en même temps que l'entrée d'historique, sur l'effet dépendant de `active`. Testé en conditions réelles (voir "Vérifications" ci-dessous), un cas précis cassait : fermeture complète en un seul saut à 2 niveaux (`history.go(-2)`, utilisé par `onDone`). La réaction de la 1ʳᵉ instance à l'événement `popstate` déclenchait un rendu React qui démontait synchroniquement l'effet d'écoute de la 2ᵉ instance *avant* que le navigateur n'ait fini d'appeler tous les listeners `popstate` enregistrés pour ce même événement — la 2ᵉ instance ne recevait donc jamais l'événement et son nettoyage la faisait "rattraper" en poussant un `history.back()` supplémentaire, non désiré (l'app finissait par sortir de la page).

Fix en deux temps :
1. Le listener `popstate` de chaque instance est maintenant enregistré pour toute la durée de vie du composant (effet séparé, dépendant uniquement du token, jamais de `active`) — il n'est plus jamais retiré puis remis en fonction de `mode`, donc plus jamais désenregistré au milieu de la diffusion d'un même événement.
2. `onDone` (fermeture complète après succès, qui doit sauter le niveau éventail) n'utilise plus `history.go(-2)` : un helper `goBackSteps(n)` exporté par `useBackClose.ts` enchaîne `n` `history.back()` strictement séquentiels (chacun attend son propre `popstate` avant de déclencher le suivant), pour ne jamais provoquer plus d'un saut par événement `popstate` — le chemin à un seul niveau est celui qui a été validé exhaustivement.

## Fichiers modifiés

- `src/app/(app)/QuickAddFab.tsx` — éventail + intégration `useBackClose`/`goBackSteps` (remplace l'ancien menu en `Modal`)
- `src/hooks/useBackClose.ts` (nouveau) — hook `useBackClose` + helper `goBackSteps`
- `src/components/Modal.tsx` — inchangé, comme prévu (seuls les `onClose` passés par `QuickAddFab` ont changé)
- `src/app/(app)/taches/AddTaskForm.tsx`, `src/app/(app)/notes/NoteForm.tsx` — inchangés (leur prop `onDone` existante suffisait)

## Vérifications

- `npx tsc --noEmit` : ✅ aucune erreur (dans les fichiers modifiés — une erreur préexistante et sans rapport dans `layout.tsx` disparaît dès que le cache de types Next.js est régénéré par `next dev`/`next build`).
- `npx eslint .` : ✅ aucune erreur.
- `npm run build` : ✅ build de production réussi, aucune route affectée.
- Tests manuels via un serveur `next dev` local + Playwright headless (page de test temporaire, supprimée avant de terminer) :
  - "+" → éventail visible (2 icônes, animation), entrée d'historique poussée.
  - Tap icône tâche → formulaire "Nouvelle tâche" (bottom sheet), 2ᵉ entrée poussée.
  - Retour matériel (1) → formulaire fermé, éventail réaffiché (même token qu'à l'ouverture).
  - Retour matériel (2) → éventail fermé, accueil, app toujours ouverte (jamais de sortie d'app à aucune étape).
  - "+" pour refermer l'éventail, clic hors éventail (overlay), X du `Modal` : chacun ferme le bon niveau via `history.back()`.
  - Fermeture complète simulée (2 niveaux d'un coup, via `goBackSteps(2)`) : atterrit proprement sur l'accueil, sans navigation parasite.
  - 5 cycles ouverture/fermeture répétés : longueur de l'historique stable (pas de fuite d'entrées).
  - Démontage avec formulaire ouvert (navigation complète vers une autre URL) : pas de crash, pas d'entrée orpheline détectée.
  - Aucune erreur console (`pageerror`) sur l'ensemble des scénarios.
- Non testé : soumission réussie réelle d'un formulaire (`createTache`/`createNote` via Supabase) — l'environnement de session n'a pas d'accès direct à la base ; le comportement de `onDone` a été validé en simulant l'appel `goBackSteps(2)` qu'il déclenche.

---

Souhaites-tu que je pousse ces changements sur la branche `kilio` ?
