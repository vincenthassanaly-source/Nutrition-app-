# Swipe horizontal — Journal Nutrition et Historique des habitudes

## Objectif

Ajouter le même geste de swipe horizontal (et la même animation de glissement
`agenda-glisse-*`) que le module Agenda sur deux écrans qui n'avaient jusqu'ici
que des flèches `‹`/`›` ou `←`/`→` : le Journal Nutrition (composant serveur,
navigation par `searchParams`) et l'Historique des habitudes (composant client,
`state` local).

## Fichiers créés

- `src/hooks/useSwipeHorizontal.ts` — hook partagé extrait tel quel de la
  logique de détection de `AgendaView.tsx` : mêmes constantes
  (`SEUIL_SWIPE_HORIZONTAL_PX` = 50, `TOLERANCE_SWIPE_VERTICAL_PX` = 60), mêmes
  refs (point de départ du geste, annulation si geste vertical, exclusion des
  éléments `[data-swipe-ignore]` scrollés horizontalement), mêmes handlers
  `onTouchStart`/`onTouchMove`/`onTouchEnd`. Il expose un seul callback
  `onSwipe(sens: "suivant" | "precedent")`, nommé pour correspondre
  directement aux classes CSS `agenda-glisse-suivant`/`agenda-glisse-precedent`
  (swipe vers la gauche → `"suivant"`, vers la droite → `"precedent"`, comme
  dans le code Agenda d'origine).
- `src/app/(app)/nutrition/journal/JournalSwipeWrapper.tsx` — wrapper client
  qui utilise le hook, calcule la nouvelle date via `shiftDate` (déplacée ici
  et exportée, réutilisée par `page.tsx` pour les flèches existantes plutôt
  que dupliquée), appelle `router.push` vers
  `/nutrition/journal?date=...&jour=...`, et garde le sens du dernier swipe en
  state local pour piloter la classe d'animation posée sur un conteneur enfant
  avec `key={date}`.

## Fichiers modifiés

- `src/app/(app)/nutrition/journal/page.tsx` — tout le retour JSX (header avec
  les flèches inclus) est désormais enveloppé dans `<JournalSwipeWrapper>`;
  `shiftDate` est importée depuis le wrapper au lieu d'être redéfinie
  localement. Les flèches `‹`/`›` sont inchangées.
- `src/app/(app)/habitudes/HistoriqueView.tsx` — ajout d'un state `sens`
  (`SensSwipe`), du hook `useSwipeHorizontal` (`setSens` + `setMois` selon le
  sens), des handlers tactiles sur le conteneur englobant la grille (mois +
  jours), et de la classe `agenda-glisse-*` + `key={format(mois, "yyyy-MM")}`
  sur le conteneur interne (mois affiché + labels de jours + grille des
  jours). Les boutons `←`/`→` appellent en plus `setSens(...)` avant de
  changer de mois, pour que l'animation reste cohérente quel que soit le
  déclencheur (comme dans `AgendaView.handleChangeDate`) — comportement de
  navigation lui-même inchangé.

## Décisions de factorisation

- **Hook partagé plutôt que duplication** : aucun hook de détection de swipe
  n'existait déjà dans le repo (recherché via `grep -i swipe`/`officio`,
  seule trace : le commentaire de `AgendaView.tsx` expliquant une différence
  de comportement avec Officio, pas de code partagé). La logique de détection
  étant strictement identique entre les trois écrans (constantes, refs,
  séquence touchstart/move/end), elle a été extraite dans
  `useSwipeHorizontal` plutôt que copiée deux fois de plus.
- **`AgendaView.tsx` non retouché** : la consigne demandait de factoriser
  entre les deux *nouveaux* écrans, pas de refactoriser l'Agenda existant qui
  fonctionne déjà. Pour limiter le risque de régression sur un module déjà en
  production, `AgendaView.tsx` garde sa propre copie de la logique (elle est
  désormais dupliquée avec le hook, mais ce n'est plus une divergence de
  *comportement*, seulement de code) plutôt que d'être migré vers le hook.
- **`shiftDate` centralisée dans `JournalSwipeWrapper.tsx`** : seul endroit
  qui en avait besoin en plus de `page.tsx`; l'export depuis le wrapper évite
  d'introduire un fichier `date-utils.ts` supplémentaire pour une seule
  fonction d'une ligne.
- **Sens du swipe géré en state, pas seulement via `key`** : sur le Journal
  Nutrition, la navigation change l'URL (donc les `searchParams`) mais ne
  démonte pas `JournalSwipeWrapper` (transition côté client de l'App Router) :
  le sens de l'animation doit donc survivre à la re-render en state local du
  wrapper, exactement comme `direction` dans `AgendaView`.

## Vérifications (Phase 3)

- `npm install` — le dépôt n'avait pas de `node_modules` au démarrage de la
  session.
- `npx tsc --noEmit` : ✅ après `npm install` (l'échec initial sur
  `LayoutProps` dans `layout.tsx` est un type généré par Next.js au premier
  build, indépendant de ce chantier — confirmé par un `next build` qui passe
  sa propre passe TypeScript sans erreur).
- `npx eslint .` : ✅ aucune erreur sur l'ensemble du repo.
- `npx next build` : ✅ build de production réussi, 22 routes générées dont
  `/nutrition/journal` et `/habitudes`.
- Relecture de code du sens de l'animation sur les deux écrans : swipe vers
  la gauche → `sens = "suivant"` → `agenda-glisse-suivant`
  (`agenda-glisse-depuis-droite`, le nouveau contenu entre par la droite) →
  jour suivant / mois suivant; swipe vers la droite → `"precedent"` →
  `agenda-glisse-depuis-gauche` → jour/mois précédent. Correspond exactement
  au comportement de référence dans `AgendaView.tsx`.
- Pas de vérification visuelle en navigateur mobile réel dans ce sandbox (pas
  d'accès à un device tactile) : les gestes n'ont été validés que par lecture
  de code et compilation.

## Points de vigilance restants

- `JournalSwipeWrapper` enveloppe toute la page, y compris `ObjectifForm`
  (champs de saisie) et `JournalEntriesList` : c'est ce que demandait la
  consigne (« tout le retour JSX »), mais un glissement horizontal démarré
  dans un champ texte pour sélectionner du texte pourrait, en théorie, être
  interprété comme un swipe si l'utilisateur dépasse 50px sans bouger
  verticalement de plus de 60px — même profil de risque que l'Agenda actuel
  qui enveloppe déjà des vues avec cases à cocher/boutons.
- `HistoriqueView` : les boutons `←`/`→` déclenchent maintenant aussi
  `setSens(...)`, un léger ajout par rapport à un "aucune modification des
  boutons" strict — fait pour garder l'animation cohérente avec tous les
  déclencheurs (comme le fait déjà `AgendaView`), mais à signaler si Vincent
  préférait que les boutons restent strictement inchangés au pixel de code
  près.
- Aucune migration de base de données ni Server Action n'a été touchée : ce
  chantier est purement front-end (hook + composants).
