# Cartes de tâches teintées par couleur de liste dans l'Agenda

Date : 2026-09-05

## Contexte

Dans le module Agenda, les cartes de tâches (`TaskCard`, `src/app/(app)/taches/TasksList.tsx`) utilisaient `listCard` (`bg-surface` + `border-line`), quasi identique au fond de l'écran, ce qui les rendait peu visibles en thème sombre. Objectif : reprendre la couleur de la liste de la tâche (`tache.liste.couleur`) pour teinter la carte, **uniquement dans l'Agenda** — la page `/taches` (module Tâches) ne doit pas changer.

## État des couleurs de liste en base (Phase 1)

Vérifié via `mcp__Supabase__execute_sql` (projet `vsmtkopkqasrdnjceegp`, table `listes_taches`) :

| Liste | Couleur |
|---|---|
| Déco appartement | `#ffff00` |
| Général | `null` |
| Kilio | `#00ff00` |
| Officio | `#4f7cff` |
| These | `#00ff00` |
| Vendre | `#ff0000` |

5 des 6 listes ont une couleur définie. Seule **"Général"** n'a pas de couleur (`null`). Ce n'est pas un problème significatif (une seule liste concernée, et c'est justement la liste "par défaut" pour laquelle un fond neutre reste cohérent) — pas de couleur de repli arbitraire ajoutée : dans ce cas la carte garde simplement son style actuel (`bg-surface`/`border-line`), comme demandé.

## Changement apporté (Phase 2)

### `TaskCard` (`src/app/(app)/taches/TasksList.tsx`)

- Nouveau prop optionnel **`colorByListe?: boolean`** (défaut `false`) — sans impact quand non passé, donc la page `/taches` (usages directs dans `SortableTachesList` et `TasksList`) est strictement inchangée.
- Nouvelle fonction `carteAccentStyle(couleur)`, sur le même principe que `couleurStyle()` déjà utilisée pour les pills :
  ```ts
  function carteAccentStyle(couleur: string | null | undefined): React.CSSProperties | undefined {
    if (!couleur) return undefined;
    return { backgroundColor: `${couleur}1a`, borderColor: `${couleur}4d` };
  }
  ```
  - Fond très clair (`1a` ≈ 10 % d'opacité, identique aux pills existants).
  - Bordure plus marquée (`4d` ≈ 30 % d'opacité) pour un effet "accent" visible sans être criard en thème sombre.
  - Retourne `undefined` si `tache.liste?.couleur` est absent → la carte garde son style par défaut (`bg-surface`/`border-line` de la classe `listCard`), aucune couleur arbitraire imposée.
- Le style est calculé une fois (`const accentStyle = colorByListe ? carteAccentStyle(tache.liste?.couleur) : undefined`) puis appliqué en `style` inline sur le conteneur racine de la carte, en conservant les classes `listCard` (forme/ombre) — sur les deux variantes de rendu (statique `motion.li`, et réordonnable `motion.div` dans le `<li>` dnd-kit).

### Points d'appel modifiés — `colorByListe` passé à `true`

- `src/app/(app)/agenda/DayView.tsx` (1 appel)
- `src/app/(app)/agenda/ListView.tsx` (2 appels : tâches datées + "Sans date")
- `src/app/(app)/agenda/ArchivedTasksSection.tsx` (1 appel)

### Non touché

- Les appels de `TaskCard` dans `TasksList.tsx` lui-même (`SortableTachesList` et liste non réordonnable, utilisés par la page `/taches`) n'ont pas reçu `colorByListe` → comportement visuel strictement identique à avant.
- `DashboardTaskItem.tsx` (page d'accueil) ne rend pas `TaskCard` (juste une mention en commentaire) — non concerné.

## Lisibilité (contraste)

Avec les couleurs actuelles en base (jaune, vert, bleu, rouge), le fond à 10 % d'opacité reste très clair/sombre-neutre selon le thème : le texte (`text-ink`/`text-ink-2`), les pills et les boutons Modifier/Supprimer gardent leurs couleurs actuelles (non affectées par le style inline, qui ne touche que `backgroundColor`/`borderColor` du conteneur) et restent lisibles. Le pill de liste (`couleurStyle`) utilise déjà la même opacité de fond (`1a`) que la carte, donc pas de clash visuel entre pill et fond de carte.

## Rendu attendu (Phase 3, description — pas de rendu visuel capturé)

- **Tâche avec liste colorée** (ex. liste "Kilio", `#00ff00`) dans Jour/Liste/Archivées : carte avec un léger fond teinté vert très clair et une bordure verte plus visible que `border-line`, se détachant du fond d'écran en thème sombre.
- **Tâche sans liste ou liste "Général" (`couleur` null)** : carte identique à l'existant (`bg-surface`/`border-line`), aucun changement visuel.
- Page `/taches` : aucun changement, `colorByListe` n'y est jamais passé.

## Vérifications

- `npm install` (dépendances absentes en début de session — 394 paquets, 0 vulnérabilité).
- **`npx tsc --noEmit`** : propre après `next build` (première passe isolée signalait une erreur pré-existante et non liée, `LayoutProps` non généré avant build).
- **`npx eslint`** sur les 4 fichiers modifiés : 0 erreur, 0 warning.
- **`npx next build`** (Next.js 16.3.3 / Turbopack) : compilation et build réussis, 22 routes générées, y compris `/agenda` et `/taches`.

## Fichiers touchés

- `src/app/(app)/taches/TasksList.tsx` (prop `colorByListe`, fonction `carteAccentStyle`, application du style)
- `src/app/(app)/agenda/DayView.tsx`
- `src/app/(app)/agenda/ListView.tsx`
- `src/app/(app)/agenda/ArchivedTasksSection.tsx`
