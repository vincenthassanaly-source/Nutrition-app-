# Navigation par swipe horizontal dans l'Agenda — 2026-09-02

## Résumé

Ajout du swipe horizontal (gauche/droite) sur les vues Jour/Semaine/Mois du
module Agenda pour changer de période, en reproduisant à l'identique le
pattern déjà utilisé sur Officio (`src/components/agenda/agenda.tsx`),
adapté à l'architecture Kilio (state local, pas de `router.replace`/URL).

## Fichiers modifiés

- `src/app/(app)/agenda/AgendaView.tsx` : toute la logique (détection du
  geste, direction, wrapper animé) a été ajoutée ici, comme demandé — aucune
  modification de DayView.tsx/MonthView.tsx.
- `src/app/(app)/agenda/WeekView.tsx` : ajout de l'attribut
  `data-swipe-ignore` sur le conteneur scrollable de la grille (voir
  "Écarts / points d'attention" ci-dessous).
- `src/app/globals.css` : ajout des classes `agenda-glisse-suivant` /
  `agenda-glisse-precedent` et de leurs `@keyframes`, copiées telles quelles
  depuis Officio (aucun conflit de nom trouvé).

## Choix d'implémentation

### Détection du geste

Constantes `SEUIL_SWIPE_HORIZONTAL_PX = 50` et
`TOLERANCE_SWIPE_VERTICAL_PX = 60`, deux refs (`toucheDebutRef`,
`swipeAnnulePourGesteRef`) et handlers `onTouchStart`/`onTouchMove`/
`onTouchEnd` posés sur un wrapper qui n'englobe que le bloc Jour/Semaine/Mois
(pas Liste — ses handlers ne sont donc jamais montés quand `view === "liste"`,
conformément à la Phase 2.3 du prompt). Aucun `preventDefault` n'est appelé :
le scroll vertical natif de la page reste intact dans tous les cas.

### Direction partagée entre swipe et flèches

Plutôt que de dupliquer la logique de sens ou de faire remonter un state
depuis chaque vue, `AgendaView` intercepte le point d'entrée commun :
`onChangeDate` passé à `DayView`/`WeekView`/`MonthView` est maintenant
`handleChangeDate`, qui compare la nouvelle date à `selectedDate` avant de
l'appliquer et met à jour `direction` (`1` si la nouvelle date est
postérieure, `-1` sinon). Les flèches `‹`/`›` de chaque vue continuent
d'appeler `onChangeDate` avec `addDays/subDays` etc. sans aucune
modification — elles traversent simplement ce même point d'interception, donc
la même transition CSS se joue qu'on utilise le doigt ou les flèches (ainsi
que le bouton "Aujourd'hui" de DayView, qui passe par le même chemin).

Le swipe lui-même calcule la date cible selon `view` (jour → `addDays`/
`subDays` ±1, semaine → `addWeeks`/`subWeeks` ±1, mois → `addMonths`/
`subMonths` ±1) puis appelle `handleChangeDate`, qui déduit la direction —
pas de logique de sens dupliquée entre swipe et flèches.

### Animation

Le conteneur qui enveloppe la vue active a une `key` qui change à chaque
période affichée (`periodKey(view, selectedDate)` : date ISO du jour pour
Jour, lundi de la semaine pour Semaine, `yyyy-MM` pour Mois), ce qui force
React à le remonter et rejoue l'animation `agenda-glisse-suivant` /
`agenda-glisse-precedent` définie dans `globals.css`, avec repli
`prefers-reduced-motion` identique à Officio.

## Écarts / points d'attention par rapport au prompt

- **`data-swipe-ignore` ajouté sur `WeekView.tsx`, contrairement à
  l'hypothèse initiale du prompt — mais avec une sémantique différente
  d'Officio (correctif du 2026-09-02 suite à un retour utilisateur).** La
  Phase 1 demandait de vérifier si une zone à scroll/swipe horizontal
  interne existait déjà dans DayView/WeekView/MonthView avant d'ajouter cet
  attribut. C'est le cas dans `WeekView` : son conteneur scrollable
  (`overflow-auto`, ref `scrollRef`) devient réellement scrollable
  horizontalement dès que le zoom (pinch à 2 doigts, `useAgendaZoom`)
  dépasse le zoom minimal qui fait tenir les 7 colonnes à l'écran.

  Une première version reprenait le comportement exact d'Officio : ignorer
  entièrement le geste dès le `touchstart` s'il démarre sous
  `[data-swipe-ignore]` (`cible.closest(...)` → on annule immédiatement).
  Chez Officio, cet attribut ne couvre qu'un petit strip annexe (une rangée
  de jours cliquables) ; chez Kilio, le conteneur scrollable de `WeekView`
  couvre la quasi-totalité de la vue Semaine (gouttière + les 7 colonnes de
  la grille horaire), donc ignorer tout geste qui y démarre revenait à
  désactiver le swipe de semaine presque partout — régression remontée par
  Vincent (« ça marche pour jour et mois mais pas pour les semaines »).

  Correctif : `[data-swipe-ignore]` ne provoque plus d'annulation immédiate
  au `touchstart`. À la place, `AgendaView` retient l'élément le plus proche
  portant cet attribut et son `scrollLeft` au démarrage du geste, puis
  compare ce `scrollLeft` à celui du `touchend` : si la grille a réellement
  défilé horizontalement pendant le geste (delta > 2px), le changement de
  semaine est annulé (c'était un geste de défilement interne) ; sinon (la
  grille tient à l'écran, ou elle est déjà en butée de scroll dans la
  direction du geste) le swipe de semaine s'applique normalement. Ce
  mécanisme est générique (basé sur `scrollLeft`, pas spécifique à
  `WeekView`) et n'affecte ni Jour ni Mois, qui n'ont pas d'élément marqué
  `[data-swipe-ignore]`.

  DayView (une seule colonne `flex-1`, jamais plus large que son conteneur)
  et MonthView (grille statique sans overflow) n'ont pas ce problème et
  n'ont donc reçu aucun attribut, conformément à la consigne de ne pas
  l'ajouter inutilement.
- Aucun conflit constaté entre le pattern `.agenda-glisse-*` (transform
  `translateX` persistant via `animation-fill-mode: both`, qui devient le
  référentiel de positionnement des descendants `position: fixed`) et les
  modales de Kilio (`Modal.tsx`, `fixed inset-0` non porté vers
  `document.body`) : la seule modale montée à l'intérieur du wrapper animé
  est le formulaire d'ajout de tâche du FAB, qui est un frère du bloc animé
  dans `AgendaView.tsx`, pas un descendant — donc hors de portée de la
  transform. Point vérifié spécifiquement car Officio porte sa modale
  équivalente vers `document.body` pour cette raison exacte ; ce n'était pas
  nécessaire ici.
- Le reste suit le prompt sans écart : mêmes seuils, même CSS copié à
  l'identique, `ListView.tsx` non touché.

## Vérifications (Phase 3)

- `npx tsc --noEmit` : 0 erreur (après `npm install` + un premier
  `next build` pour générer les types de routes Next 16 — l'erreur
  `Cannot find name 'LayoutProps'` observée avant le build est préexistante
  et indépendante de ce changement, confirmée en stashant les modifications).
- `npx eslint .` : 0 erreur, 0 warning sur les fichiers modifiés (seul
  `globals.css` produit un warning neutre "File ignored", attendu — ESLint
  ne lint pas le CSS).
- `npx next build` : build de production réussi, toutes les routes
  compilées.
- Vérification manuelle du code : aucun `preventDefault` n'a été ajouté dans
  `onTouchMove`/`onTouchStart`/`onTouchEnd` — le scroll vertical de page
  reste 100 % natif, comme dans l'implémentation Officio de référence.
  (Test tactile réel sur appareil non effectué dans cet environnement sans
  navigateur mobile ; à valider par Vincent après déploiement.)

---

Poussez-vous ces changements sur la branche `kilio` ?
