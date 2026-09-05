# Agenda — masquer les tâches terminées dans une section "Archivées" repliable

Date : 2026-09-05

## Résumé

Dans les 4 vues de l'Agenda (`ListView`, `DayView`, `WeekView`, `MonthView`), les tâches cochées comme faites (`tache.fait === true`) n'apparaissent plus mélangées aux tâches actives. `ListView` et `DayView`, qui ont un espace de rendu adapté (liste sous la grille), regroupent désormais ces tâches dans une section "Tâches archivées (N)" repliable et fermée par défaut. `WeekView` et `MonthView`, au format grille compacte, filtrent simplement les tâches faites sans section dédiée (voir justification plus bas).

Aucune migration Supabase n'était nécessaire : `taches.fait` (boolean, `not null`, défaut `false`) est déjà en base et déjà utilisé côté UI. Vérifié via `mcp__Supabase__execute_sql` sur `information_schema.columns` avant toute modification — aucun décalage repo/DB.

## Fichier créé

**`src/app/(app)/agenda/ArchivedTasksSection.tsx`**

Composant réutilisable, même props que `TaskCard` (`taches`, `listes`, `tags`) :
- Ne rend rien si `taches.length === 0`.
- En-tête cliquable au style `sectionTitle` (cohérent avec les titres de section déjà utilisés dans `ListView`/`DayView`), avec un chevron (`▾`) qui pivote à 180° à l'ouverture via une simple classe Tailwind (`rotate-180` + `transition-transform`).
- État d'ouverture géré par un `useState(false)` local (fermé par défaut).
- Contenu animé en hauteur/opacité via `framer-motion` (`AnimatePresence` + `motion.div`), cohérent avec l'usage déjà présent dans `TasksList.tsx` (transition douce, pas de complexité ajoutée).
- Réutilise `TaskCard` telle quelle pour le rendu des tâches archivées (toggle de décochage, édition, suppression : comportement inchangé).
- Style de conteneur : classe `card` de `src/lib/ui.ts`, pas de nouvelle classe ad hoc introduite.

## Fichiers modifiés

### `src/app/(app)/agenda/ListView.tsx`
- Les groupes par date (`withDate`/`withoutDate`) sont désormais calculés à partir de `actives = taches.filter((t) => !t.fait)` uniquement.
- Nouveau tableau `archivees` : toutes les tâches `fait` de `taches` (toutes dates confondues), triées par échéance décroissante puis par heure décroissante (les plus récemment échues/faites en premier), via un tri par comparaison de chaînes ISO (`localeCompare` inversé, pas besoin de `date-fns` ici car les échéances sont déjà au format `yyyy-MM-dd`).
- Une unique `<ArchivedTasksSection>` ajoutée en bas de la vue, après le bloc "Sans date".
- Le message vide ("Aucune tâche pour l'instant.") tient maintenant compte de `archivees.length` pour ne pas s'afficher à tort quand il ne reste que des tâches archivées.

### `src/app/(app)/agenda/DayView.tsx`
- `dayTachesJour` (toutes les tâches du jour sélectionné) est scindé en `dayTaches` (actives, triées par heure) et `dayTachesArchivees` (faites, triées par heure).
- `dayTachesAvecHeure` (blocs de la grille horaire) dérive maintenant de `dayTaches` (actives) au lieu de l'ancien `dayTaches` non filtré : les tâches faites ne sont donc plus dessinées dans la grille.
- La classe `opacity-50 line-through` conditionnée à `tache.fait` dans `TacheBlock` est devenue inatteignable (plus aucune tâche `fait` n'entre dans `dayTachesAvecHeure`) : retirée.
- `<ArchivedTasksSection taches={dayTachesArchivees} ... />` ajoutée juste après la liste des tâches actives.
- Le message vide ("Aucune tâche ce jour-là.") tient compte à la fois de `dayTaches` et `dayTachesArchivees`.

### `src/app/(app)/agenda/WeekView.tsx`
- `dayTachesAvecHeure` et `dayTachesSansHeure` (calculés par colonne de jour) excluent désormais `t.fait` en amont du filtrage par jour (`!t.fait && t.echeance && isSameDay(...)`), donc avant tout tri/regroupement existant — pas de régression sur le tri déjà en place.
- Même retrait de la classe `opacity-50 line-through` désormais inatteignable dans `TacheBlock` (colonne grille).
- Pas de section "Archivées" ajoutée ici — voir justification ci-dessous.

### `src/app/(app)/agenda/MonthView.tsx`
- `countByDay` ignore maintenant les tâches `fait` (`if (!t.echeance || t.fait) continue;`) : le point de couleur par jour ne reflète que les tâches actives.

## Justification : pas de section repliable dans WeekView

`WeekView` affiche 7 colonnes de jour côte à côte dans une grille horaire compacte (largeur de colonne dynamique selon le zoom, `dayColumnWidth`), sans zone de liste en dessous de chaque colonne comme dans `DayView`. Ajouter une section "Archivées" par colonne :
- n'a pas d'espace disponible sans casser la mise en page compacte (7 sections repliables miniatures seraient illisibles au format déjà réduit — police 9.5–10px) ;
- une section globale unique (comme dans `ListView`) n'aurait pas de position naturelle cohérente avec la grille par jour ;
- l'usage de `WeekView` est avant tout une vue de survol/navigation (clic sur une colonne → `onSelectDay` renvoie vers `DayView`), où les tâches archivées ne sont de toute façon pas l'information prioritaire.

Le choix retenu est donc de simplement filtrer les tâches faites de l'affichage (comme demandé), sans section dédiée, en cohérence avec le format grille. Un utilisateur qui veut voir/décocher une tâche archivée d'un jour donné peut cliquer sur ce jour pour passer en `DayView`, qui expose la section complète.

## Vérifications (Phase 3)

- **`npx tsc --noEmit`** : `node_modules` absent au démarrage de la session → `npm install` effectué (394 paquets). Une première passe isolée signalait une erreur pré-existante et non liée (`src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'`, type généré par Next.js normalement produit par `next build`/`next dev`, absent avant toute génération). Après `npm run build` (qui génère `.next/types`), une seconde passe `tsc --noEmit` est **propre, 0 erreur**.
- **`npx eslint .`** : 0 erreur, 0 warning.
- **`npm run build`** (Next.js 16.3.3 / Turbopack) : compilation réussie, TypeScript interne au build passé (0 erreur), génération statique des 22 routes OK, y compris `/agenda`.

## Fichiers touchés

- `src/app/(app)/agenda/ArchivedTasksSection.tsx` (nouveau)
- `src/app/(app)/agenda/ListView.tsx`
- `src/app/(app)/agenda/DayView.tsx`
- `src/app/(app)/agenda/WeekView.tsx`
- `src/app/(app)/agenda/MonthView.tsx`
