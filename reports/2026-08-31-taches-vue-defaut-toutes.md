# Onglet "Toutes" par défaut sur /taches — 2026-08-31

## Constats de la Phase 1

- Branche `kilio` resynchronisée (`git fetch origin kilio && git reset --hard origin/kilio`, HEAD à `b6ba173`) avant toute modification.
- `const [vue, setVue] = useState<VueKey>("aujourdhui")` localisé dans `src/app/(app)/taches/TachesView.tsx:30`.
- Vérification qu'aucune autre logique ne dépend de la valeur initiale de `vue` :
  - État purement local (`useState`), aucune synchronisation avec l'URL ni `localStorage`.
  - `grep -n "aujourdhui" src/app/(app)/taches/**` ne remonte que les usages internes au fichier : la clé `"aujourdhui"` du type `VueKey`, son libellé dans le tableau `VUES`, et la branche de filtrage `if (vue === "aujourdhui") return tache.echeance === today;` dans `useMemo`.
  - Le filtrage pour `vue === "toutes"` retourne déjà `true` sans condition (`TachesView.tsx:43`), donc aucune adaptation du `useMemo` n'était nécessaire.
  - Ordre des onglets, libellés et comportement de sélection (`onClick={() => setVue(v.key)}`) inchangés — seule la valeur initiale du state est concernée.

## Fichier modifié

`src/app/(app)/taches/TachesView.tsx`, ligne 30 :

```diff
-  const [vue, setVue] = useState<VueKey>("aujourdhui");
+  const [vue, setVue] = useState<VueKey>("toutes");
```

Avant : l'écran `/taches` s'ouvrait sur l'onglet "Aujourd'hui" (`echeance === today`), masquant les tâches sans échéance.
Après : l'écran `/taches` s'ouvre sur l'onglet "Toutes" (aucun filtre sur `echeance`), toutes les tâches (avec ou sans échéance) sont visibles au premier rendu. L'utilisateur peut toujours basculer manuellement vers "Aujourd'hui" ou "7 jours".

## Phase 3 — Vérification

- `npx tsc --noEmit` : aucune erreur (après `npm install`, `node_modules` absent au démarrage de la session).
- `npx eslint` sur le fichier modifié : aucune erreur.
- `npx next build` : build de production réussi (Next.js 16.3.3 / Turbopack), toutes les routes compilent, y compris `/taches`.
- Vérification par lecture du code (pas de serveur `next dev` lancé pour cette modification ponctuelle) : `VUES[2]` (`{ key: "toutes", label: "Toutes" }`) correspond bien à la nouvelle valeur initiale de `vue`, donc la classe active (`bg-carbs text-white`) s'applique au bouton "Toutes" dès le premier rendu, et `filtered` renvoie l'ensemble des tâches de la liste sélectionnée sans filtre d'échéance.

## Écarts par rapport au prompt

Aucun. Seule la valeur initiale du state a été modifiée, comme demandé.
