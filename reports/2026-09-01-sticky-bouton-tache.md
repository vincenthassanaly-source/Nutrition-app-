# Bouton "Créer la tâche" collant dans AddTaskForm — 2026-09-01

## Constats de la Phase 1

- `git fetch origin kilio && git reset --hard origin/kilio` : session synchronisée sur `origin/kilio` (`b44138b`, recettes — recherche par ingrédients).
- Relecture de `src/app/(app)/taches/AddTaskForm.tsx` (formulaire `flex flex-col gap-3` : titre, liste, priorité, échéance, heure, notes, tags, nouveaux tags, récurrence, fin de récurrence, erreur, bouton submit).
- Relecture des 3 points d'usage :
  - `AddTaskToggle.tsx` : `<div className={card}>` (padding `p-4`) contenant `<AddTaskForm/>` puis un lien "Annuler" *après* le formulaire, dans le flux de `<main>`.
  - `TasksList.tsx` (`TaskCard`, ~ligne 152) : même pattern, `<li className={card}>` contenant `<AddTaskForm/>` puis "Annuler", toujours dans `<main>`.
  - `QuickAddFab.tsx` (~ligne 142) : `<AddTaskForm/>` directement dans les `children` de `<Modal>`, sans wrapper `card` — le parent direct est le `<div className="overflow-y-auto px-4 pt-4">` interne à la modale.
- `layout.tsx` : `<main className="flex-1 overflow-x-hidden overflow-y-auto px-4 pb-28" style={{paddingTop: "calc(env(safe-area-inset-top) + 64px)"}}>` — `pb-28` (112px) était une valeur **fixe**, sans terme `env(safe-area-inset-bottom)`.
- `BottomNav.tsx` : `fixed inset-x-0 bottom-0 z-40`, hauteur = contenu de la pastille nav (~80px) **+ `env(safe-area-inset-bottom)`** (dans son propre `padding-bottom`) — donc une hauteur qui *croît* avec la zone de sécurité, contrairement au `pb-28` fixe de `<main>`.
- `Modal.tsx` : le conteneur scrollable interne a déjà `paddingBottom: "calc(env(safe-area-inset-bottom) + 20px)"`, indépendant de `<main>`.

## Implémentation

### `AddTaskForm.tsx`

Le bloc erreur + bouton submit est sorti du flux `gap-3` classique et regroupé dans une barre :

```tsx
<div
  className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-line bg-surface pt-3"
  style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
>
  {state.error && <p className={errorText} role="alert">{state.error}</p>}
  <button type="submit" disabled={pending} className={primaryButton}>
    {pending ? "Enregistrement..." : tache ? "Enregistrer" : "Créer la tâche"}
  </button>
</div>
```

- `sticky bottom-0` (pas `fixed`) : se cale au bas du conteneur de scroll le plus proche à chaque usage — `<main>` pour `AddTaskToggle`/`TasksList`, le panneau interne de la `Modal` pour `QuickAddFab` — sans code spécifique par contexte, car c'est le même composant dans les 3 cas.
- `bg-surface` + `border-t border-line` : même fond que les `card`, séparateur visuel avec le contenu qui scrolle derrière.
- `z-10` : reste au-dessus du contenu du formulaire, mais nettement en dessous de `BottomNav` (`z-40`) et de `Modal` (`z-50`) — aucun conflit possible.
- `padding-bottom: calc(env(safe-area-inset-bottom) + 12px)` : évite que le bouton colle au bord physique de l'écran, même pattern que `BottomNav.tsx`/`Modal.tsx`. Comportement identique dans les 2 contextes (le composant ne sait pas où il est rendu) : léger surplus d'espace dans la modale (déjà couvert par le `paddingBottom` de `Modal.tsx`), utile dans `<main>` où rien d'autre ne gérait la zone de sécurité côté bouton.
- Aucun changement de comportement de soumission/validation/Server Actions.

### `layout.tsx` — ajustement de `<main>`

**Un chevauchement réel (mesuré, pas seulement visuel) a été trouvé et corrigé.**

Avant le changement, le bouton submit était le dernier élément du flux normal du formulaire, suivi (hors formulaire) du padding `p-4` de la `card` puis du lien "Annuler" puis de `pb-28`. Cette marge supplémentaire masquait un défaut préexistant : `pb-28` est une valeur **fixe** (112px) alors que `BottomNav` grandit avec `env(safe-area-inset-bottom)`. En rendant le bouton **sticky, collé exactement au bord de padding de `<main>`**, ce coussin de sécurité disparaît et expose ce défaut.

Vérifié par un test DOM headless (Chromium pré-installé + Playwright, reproduisant fidèlement les classes Tailwind et variables CSS réelles du projet via le CSS compilé de `next build`, viewport 390×480 pour forcer un vrai scroll) :

- Avec `pb-28` fixe et une zone de sécurité simulée à 34px (iPhone à encoche/Dynamic Island) : le bas de la barre collante déborde de **2px** sous le haut de `BottomNav` pendant tout le scroll "en cours" (barre effectivement stickée, pas juste en fin de page).
- Avec zone de sécurité à 0px (téléphone sans encoche) : pas de chevauchement, marge de 32px — donc régression invisible en dev/desktop, seulement sur mobile avec zone de sécurité.

Correction appliquée dans `src/app/(app)/layout.tsx` : remplacement de la classe Tailwind `pb-28` par un `paddingBottom` inline qui suit le même pattern que `paddingTop` juste au-dessus :

```tsx
<main
  className="flex-1 overflow-x-hidden overflow-y-auto px-4"
  style={{
    paddingTop: "calc(env(safe-area-inset-top) + 64px)",
    paddingBottom: "calc(env(safe-area-inset-bottom) + 112px)",
  }}
>
```

112px est conservé tel quel (aucune régression sur les appareils sans zone de sécurité, comportement identique à l'existant), et `env(safe-area-inset-bottom)` est ajouté en plus — exactement le terme qui manquait pour suivre la croissance de `BottomNav`. Revérifié avec le même test DOM :

| Zone de sécurité simulée | Marge barre collante ↔ `BottomNav` (état stické) |
|---|---|
| 0px | 32px |
| 34px | 32px |

Marge constante de 32px quel que soit l'appareil — le chevauchement est éliminé. Ce changement affecte `<main>` pour toutes les pages de l'app (le layout est partagé), mais uniquement en ajoutant un terme jusqu'ici absent ; aucun autre contenu existant ne s'appuyait sur une valeur `pb-28` strictement fixe.

## Phase 3 — Vérifications

- `npm install` (dépendances absentes au démarrage de la session, `node_modules` vide).
- `npx tsc --noEmit` : ✅ aucune erreur (après génération des types Next.js via un premier `next build` — l'erreur `LayoutProps` initiale était liée à `.next/types` non généré, sans rapport avec ce changement).
- `npx eslint` : ✅ aucune erreur.
- `npx next build` (Turbopack) : ✅ build complet réussi, 18 routes générées sans erreur.
- Vérification DOM/visuelle par navigateur headless (Chromium pré-installé, CSS compilé réel du projet, cf. ci-dessus) pour les 3 contextes :
  - **`<main>` (AddTaskToggle/TasksList)** : barre collante pinée au-dessus de `BottomNav`, contenu du formulaire scrollant visiblement derrière elle, marge constante de 32px avec la nav — capture d'écran à l'appui.
  - **Modal (QuickAddFab)** : barre collante pinée au bas du panneau de la modale (pas au bas de l'écran), marge de 54px avec le bord bas du panneau (comprenant le `padding-bottom` déjà présent dans `Modal.tsx` + celui de la barre) — capture d'écran à l'appui.
  - Le lien "Annuler" (hors `<form>`, après la `card`) reste un élément normal du flux, visible seulement une fois le formulaire entièrement scrollé — inchangé.
- Le réseau sortant vers Supabase n'était pas autorisé dans cet environnement (`Host not in allowlist`), empêchant un test manuel dans le navigateur avec de vraies données ; la vérification a donc été faite par reproduction fidèle du DOM/CSS réel du projet plutôt que par capture de l'app en conditions réelles.

## Fichiers modifiés

- `src/app/(app)/taches/AddTaskForm.tsx` : barre collante (erreur + bouton submit).
- `src/app/(app)/layout.tsx` : `pb-28` fixe → `paddingBottom: calc(env(safe-area-inset-bottom) + 112px)` sur `<main>`.

## Fin

Conformément à la consigne, la branche n'a **pas** été poussée automatiquement. À confirmer avec Vincent avant `git push -u origin claude/sticky-add-task-button-72co8d`.
