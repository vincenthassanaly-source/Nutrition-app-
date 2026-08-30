# Rapport — Remplacement du dégradé du logo par un vert olive foncé

**Date :** 2026-08-30

## Fichiers modifiés

- `public/icons/kilio-logo.svg`
- `public/icons/kilio-icon-maskable.svg`

Seules les valeurs de couleur des dégradés `rimGrad` et `bgGrad` (et par ricochet `vignette`, laissée inchangée) ont été modifiées. Structure, opacités, filtres (`softBlur`, `tightBlur`), `stroke`, `rx`/`ry`, `clipPath`, `glossStreak`, `metalGrad` et `letterHighlight` sont strictement inchangés.

## Valeurs avant / après

| Dégradé | Stop | Avant | Après | Fichier(s) |
|---|---|---|---|---|
| `rimGrad` | 0% | `#0a4a35` | `#111C10` | `kilio-logo.svg` |
| `rimGrad` | 100% | `#011a10` | `#011a10` (inchangé) | `kilio-logo.svg` |
| `bgGrad` | 0% | `#7bf0c4` | `#5A7A4E` | les deux fichiers |
| `bgGrad` | 30% | `#22c58f` | `#3D5A32` | les deux fichiers |
| `bgGrad` | 62% | `#0e9468` | `#2B4023` | les deux fichiers |
| `bgGrad` | 100% | `#053e2c` | `#111C10` | les deux fichiers |
| `vignette` | — | `#011a10` | `#011a10` (inchangé) | les deux fichiers |

Le contraste du vert olive foncé (`#111C10`) avec le fond `vignette` (`#011a10`) reste cohérent visuellement (contrôle par rendu PNG), donc `#011a10` a été conservé tel quel pour la vignette et le stop final de `rimGrad`, comme prévu par la consigne en cas de contraste correct.

`kilio-icon-maskable.svg` ne possède pas de `rimGrad` (icône plein cadre sans bordure) : seul `bgGrad` y a été modifié.

## Vérifications effectuées

- **Phase 1** : `git fetch origin kilio && git reset --hard origin/kilio` effectué avant toute modification.
- **Recherche des hex ailleurs dans le repo** (`grep -rn` hors `node_modules`) : aucune autre occurrence trouvée en dehors des deux fichiers SVG (pas de manifest PWA, `theme_color`, config Tailwind ou composant React utilisant ces valeurs).
- **Historique Git** : un seul commit d'historique pour chacun des deux fichiers (renommage `nutricio-logo.svg → kilio-logo.svg`) ; aucune version antérieure avec un autre dégradé olive.
- **Validité XML** : les deux SVG ont été parsés avec succès (`xml.etree.ElementTree`), aucune balise cassée.
- **Contrôle visuel** : rendu des deux SVG en PNG via Chromium headless — le squircle, l'effet chrome de la lettre « K », le gloss streak, la vignette et les ombres sont intacts, seule la teinte de fond a changé (vert clair/forêt → vert olive foncé).

## Résultat du build

```
npm run build
```

✅ **Build réussi** (`next build`, Next.js 16.3.3, Turbopack) — compilation TypeScript et génération des 13 pages statiques/dynamiques sans erreur ni warning lié aux changements.

## Autres emplacements à mettre à jour manuellement

Aucun. La recherche de la Phase 1 n'a révélé aucune autre occurrence des valeurs hex du dégradé dans le repo (manifest PWA, `theme_color`, Tailwind, composants, CSS). Aucune action supplémentaire n'est nécessaire.

## Avant de pousser

⚠️ Conformément à la consigne, ces changements **n'ont pas été poussés** sur la branche `kilio`. Confirmation explicite de Vincent requise avant tout `git push`.
