# Fix overflow titre de tâche + bouton icône "Gérer les listes" — 2026-08-31

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : session synchronisée sur `origin/kilio` (`4a8882a`, "QuickAddFab : labels texte + bouton Courses"), aucun rattrapage nécessaire.
- Relecture de `TasksList.tsx` (`TaskCard`), `TachesView.tsx`, `src/lib/ui.ts`, `src/components/BottomNav.tsx` : l'état réel du code correspond exactement à ce qui était décrit dans le prompt, aucune divergence constatée. Les deux blocs cibles (titre de tâche dans `flex items-center justify-between gap-2`, rangée de filtres avec `Link` texte "Gérer les listes") étaient identiques au diagnostic fourni.

## Diagnostic du bug d'overflow

Le titre de tâche (`<p className={nameText} ...>`, où `nameText = "text-[14.5px] font-semibold text-ink truncate"`) est un enfant direct d'un conteneur `flex items-center justify-between gap-2`. En CSS flexbox, la valeur initiale de `min-width` d'un élément flex est `auto`, ce qui revient à `min-content` : l'enfant ne peut jamais être rétréci en dessous de la largeur nécessaire pour afficher tout son contenu, quelle que soit la classe `overflow: hidden` / `text-overflow: ellipsis` posée par `truncate`. Résultat : sur un titre long, le texte pousse hors du cadre au lieu d'être tronqué avec des points de suspension.

La correction consiste à forcer `min-width: 0` sur l'élément (`min-w-0`), ce qui autorise le flex item à se rétrécir sous sa largeur de contenu et laisse `truncate` s'appliquer normalement. `flex-1` est ajouté en complément pour que le titre occupe l'espace disponible face à l'icône de récurrence (`shrink-0`, déjà correcte) plutôt que de rester à sa largeur intrinsèque.

Vérification du reste du composant `TaskCard` et de `SousTachesList` : le seul autre texte potentiellement long dans un conteneur flex est le titre de sous-tâche (`<span className="flex-1 text-[13.5px] ...">{sousTache.titre}</span>`, `TasksList.tsx` ligne ~76-82) — mais cette classe n'inclut pas `truncate` (pas de `nameText` ni d'`overflow-hidden`), donc le même bug ne s'applique pas : un titre de sous-tâche long provoque un retour à la ligne naturel (`flex-1` sans `truncate`), pas un débordement horizontal. Aucun correctif supplémentaire nécessaire à cet endroit.

## Fichiers modifiés

### `src/app/(app)/taches/TasksList.tsx`

- Ajout de `min-w-0 flex-1` sur le `<p className={nameText} ...>` du titre de tâche dans `TaskCard`, comme spécifié dans le prompt.

### `src/app/(app)/taches/TachesView.tsx`

- Remplacement du `Link` texte "Gérer les listes" (`linkButton`) par un bouton icône rond (`h-7 w-7`, bordure `border-line`, fond `bg-surface`, icône `text-ink-2`, hover `bg-surface-alt`), déplacé en première position de la rangée de filtres (avant "Toutes les listes").
- Icône `LISTE_ICON` (3 traits horizontaux, `stroke="currentColor"`, `strokeWidth="1.8"`, `strokeLinecap/strokeLinejoin="round"`, viewBox `0 0 24 24`) définie en haut du fichier à côté des imports, dans le même style que les icônes SVG dessinées à la main de `BottomNav.tsx`.
- `aria-label` et `title="Gérer les listes"` conservés sur le `Link` pour l'accessibilité et le tooltip, en l'absence de libellé texte visible.
- Import de `linkButton` retiré de `@/lib/ui` (devenu inutilisé dans ce fichier après le remplacement) ; seul `pillTag` reste importé.
- `h-7 w-7` (28px) conservé sans ajustement : cohérent visuellement avec les `pillTag` voisins (`py-1 px-2.5` + `text-[11px]`, hauteur effective ~26-27px avec `leading` par défaut).

## Résultat des vérifications (Phase 3)

- `node_modules` absent au premier lancement de `npx tsc --noEmit` (dépendances jamais installées dans cet environnement) → `npm install` exécuté (382 paquets, 0 vulnérabilité) avant de relancer les vérifications.
- `npx tsc --noEmit` : **1 erreur préexistante**, `src/app/layout.tsx(41,50): error TS2304: Cannot find name 'LayoutProps'`, confirmée indépendante de ce travail (même erreur reproduite via `git stash` sur l'état d'avant modification). Aucune erreur TypeScript introduite par les changements de cette tâche.
- `npx eslint .` : aucune erreur, aucun warning.
- `npm run build` : build de production réussi (`✓ Compiled successfully`, `Finished TypeScript`, 18 routes générées sans erreur), y compris `/taches` et `/taches/listes`.

## Divergences avec le prompt

Aucune. L'état du repo au moment de l'implémentation correspondait exactement à la description du prompt (fichiers, blocs de code, classes partagées). Seul point notable hors divergence : `node_modules` n'était pas installé au démarrage de la Phase 3, ce qui a nécessité un `npm install` préalable pour pouvoir exécuter `tsc`/`eslint`/`build`.

## Fin

Changements **non poussés** sur `kilio`, conformément à la consigne. En attente de confirmation de Vincent pour pousser sur la branche.
