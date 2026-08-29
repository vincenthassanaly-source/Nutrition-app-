# Renommage "Nutricio" → "Kilio" + logo (N → K) — 2026-08-29

## Résumé

L'app a été renommée de "Nutricio" à "Kilio" partout où le nom apparaît côté
code et configuration, et le glyphe "N" du logo a été redessiné en "K" dans
les deux SVG sources, dans les mêmes bounding box, dégradés, filtres et
structure de calques que l'original.

## Fichiers modifiés

**Nom de l'app :**
- `src/app/layout.tsx` — `metadata.title` et `metadata.appleWebApp.title` : "Nutricio" → "Kilio"
- `src/app/(app)/layout.tsx` — texte du header : "Nutricio" → "Kilio"
- `src/lib/ui.ts` — commentaire d'en-tête (cosmétique)
- `public/manifest.json` — `name` et `short_name`
- `package.json` — `name: "nutricio"` → `"kilio"`
- `package-lock.json` — régénéré via `npm install` (seul le champ `name` change, 2 lignes)

**Logo (SVG) :**
- `public/icons/nutricio-logo.svg`
- `public/icons/nutricio-icon-maskable.svg`

Dans les deux fichiers, `id="letterN"` a été renommé `id="letterK"`, et le
path a été redessiné en "K" géométrique (barres droites uniquement, pas de
courbes), dans la bounding box exacte de l'ancien "N" :

- `nutricio-logo.svg` (bounding box x:146→366, y:140→372) :
  - Barre verticale gauche inchangée : `M146,140 L206,140 L206,372 L146,372 Z`
  - Deux bandes diagonales (parallélogrammes de largeur constante 60px en x,
    même technique que les diagonales du N original) partant du milieu de la
    barre verticale (y=256) vers les coins supérieur-droit et inférieur-droit
    de la bounding box.
- `nutricio-icon-maskable.svg` (bounding box x:162→350, y:168→376, safe zone
  ~14% plus petite) : même construction, largeur de bande 54px, jonction à
  y=272.

Aucun autre élément n'a été touché : dégradés (`bgGrad`, `metalGrad`,
`rimGrad`, `vignette`, `glossStreak`, `letterHighlight`), filtres
(`softBlur`, `tightBlur`), squircle, opacités, structure des calques —
tout est identique à l'original, seules les références `#letterN` →
`#letterK` ont été mises à jour.

**Icônes raster (PNG) — hors périmètre initial mais nécessaires :**
- `public/icons/icon-192.png`, `public/icons/icon-512.png` — régénérés depuis `nutricio-logo.svg`
- `src/app/apple-icon.png` (180×180) — **découvert en Phase 5**, non listé
  dans le prompt initial. Ce fichier est une convention Next.js (icône iOS
  home-screen / apple-touch-icon) et contenait le même logo "N" au format
  raster indépendant. Régénéré depuis le SVG modifié pour rester cohérent.
- `src/app/favicon.ico` (16×16, 32×32, 48×48, entrées PNG) — même
  découverte, même raison. Régénéré depuis le SVG modifié (reconstruction
  manuelle du conteneur ICO, structure identique à l'original : mêmes 3
  tailles, mêmes profondeurs de couleur).

## Décision : renommage des fichiers SVG (non fait)

Comme demandé, le renommage optionnel de `nutricio-logo.svg` /
`nutricio-icon-maskable.svg` en `kilio-logo.svg` / `kilio-icon-maskable.svg`
n'a **pas** été effectué silencieusement. Je le signale ici comme option
restante : cela impliquerait de mettre à jour les références dans les
scripts de génération (`icon-192.png`, `icon-512.png`, `apple-icon.png`,
`favicon.ico` en dépendent tous) et de repasser par les mêmes étapes de
rasterisation. À faire seulement si souhaité.

## Régénération des PNG/ICO

Aucun script de génération d'icônes n'existe dans le repo (`scripts/` ne
contient que des migrations SQL), et `sharp`/`svgexport` n'étaient pas des
dépendances du projet. `sharp` a été installé temporairement en local
(`npm install --no-save sharp`) pour rastériser les SVG modifiés en PNG,
puis utilisé pour extraire les tailles nécessaires au `favicon.ico`
(reconstruit manuellement en conteneur ICO). Cette dépendance n'a pas été
ajoutée à `package.json`/`package-lock.json` (installation `--no-save`,
`node_modules` non versionné) : le projet reste sans dépendance de
rastérisation.

## Vérification

- `npm run build` : ✅ compile sans erreur TypeScript.
- `npm run lint` (ESLint) : ✅ aucune erreur.
- Rendu visuel confirmé :
  - `icon-512.png` et la version maskable : le "K" chrome s'affiche
    proprement dans le squircle, dégradés et reflets intacts, cohérent avec
    le style anguleux existant.
  - `apple-icon.png` et `favicon.ico` (extrait 48×48 vérifié) : "K" correct.
  - App lancée en dev (`npm run dev`) et capturée via navigateur headless
    sur `/journal` : le header affiche bien "Kilio", le titre d'onglet
    (`<title>`) est "Kilio". (Le petit rond noir avec un "N" visible en bas
    à gauche sur la capture est l'indicateur de dev Next.js lui-même — logo
    Next.js, hors périmètre, pas un résidu du rebranding.)
- Recherche de résidus "Nutricio"/"nutricio" dans le code : un seul résultat
  restant, dans `reports/2026-08-29-suppression-auth.md` — un rapport daté
  antérieur, laissé tel quel car c'est un historique d'une décision passée,
  pas du contenu applicatif.

## Écart constaté par rapport au prompt initial

Le prompt listait `nutricio-logo.svg` et `nutricio-icon-maskable.svg` comme
seules sources du logo, plus les rasters `icon-192.png`/`icon-512.png`
qu'elles génèrent. En Phase 5, la vérification visuelle de l'app a révélé
deux fichiers raster supplémentaires non mentionnés — `src/app/apple-icon.png`
et `src/app/favicon.ico` — qui affichaient encore l'ancien "N" (convention
de fichiers Next.js pour l'icône iOS et le favicon d'onglet, indépendante du
`manifest.json`). Ils ont été régénérés dans la foulée pour éviter une
incohérence visuelle (logo "K" partout sauf l'onglet du navigateur et
l'écran d'accueil iOS).
