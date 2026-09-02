# Icône de badge des notifications push + bouton "Télécharger" sur la lightbox photo

## Résumé

Deux corrections indépendantes : (1) l'icône de badge des notifications push (barre de statut/tiroir Android) affichait un carré blanc plein car le service worker réutilisait l'icône couleur opaque `icon-192.png` comme `badge` — Android ne garde que le canal alpha de ce champ, donc une icône sans transparence devient un blob. (2) la lightbox photo générique (`ImageLightbox`) n'avait aucun moyen de sauvegarder l'image affichée.

## Phase 1 — Exploration

Vérifié avant modification :
- `public/sw.js` : le handler `push` utilisait `icon: "/icons/icon-192.png"` et `badge: "/icons/icon-192.png"` — même fichier couleur opaque pour les deux champs.
- `public/icons/` : `icon-192.png`/`icon-512.png` (couleur, pleins), `kilio-icon-maskable.svg` (le K avec dégradés/reflets), `kilio-logo.svg`. Aucune variante monochrome/transparente existante.
- `src/components/ImageLightbox.tsx` : composant générique (pas de dépendance au module Tâches), utilisé dans `TasksList.tsx`. Un seul bouton (fermeture) avant modification.

Pas de schéma Supabase concerné, conforme à ce qui était annoncé.

## Phase 2 — Implémentation

### 2.1 Icône de badge (`public/icons/icon-badge.png`)

- Le tracé du K a été extrait de `kilio-icon-maskable.svg` (le `<path id="letterK">`, viewBox `0 0 512 512`), recoloré en aplat blanc uni `#ffffff` (aucun dégradé/reflet — un badge doit être un silhouette simple), dans un SVG minimal généré dans le scratchpad, puis rasterisé en PNG 192×192 transparent via `sharp` (installé temporairement avec `npm install --no-save`, non ajouté à `package.json`/lockfile).
- Le tracé original du K occupe déjà environ 37 % de la largeur/hauteur du canevas 512×512 (marge native ~31 % de chaque côté), donc largement dans la fourchette de marge de sécurité demandée (15-20 % minimum) sans redimensionnement supplémentaire — vérifié visuellement en compositant le PNG sur un fond sombre (silhouette bien centrée, aucun recadrage visible).
- `public/sw.js` : dans le handler `push`, seul le champ `badge` a été changé vers `/icons/icon-badge.png` ; le champ `icon` reste `/icons/icon-192.png` (icône couleur, inchangée). `manifest.json` non touché.
- `/icons/icon-badge.png` ajouté à `APP_SHELL` pour la mise en cache offline, au même titre que les autres icônes.

### 2.2 Bouton "Télécharger" (`src/components/ImageLightbox.tsx`)

- Nouveau bouton rond `bg-black/40` avec icône flèche-vers-un-trait (`stroke="currentColor"` `strokeWidth="2"`), positionné juste à gauche du bouton × existant (`right-16` vs `right-4`), même taille/style.
- Au clic (`event.stopPropagation()` pour ne pas fermer la lightbox) :
  - `fetch(src)` → `blob()` → `URL.createObjectURL(blob)`.
  - `<a>` temporaire avec `download` = dernier segment du chemin de `src` (query string retirée), repli `kilio-photo-${Date.now()}.jpg` si l'extraction échoue ou est vide.
  - `.click()` puis `URL.revokeObjectURL(...)`.
  - En cas d'échec (`catch`) : repli `window.open(src, "_blank")`.
- État `downloading` (via `useState`) : bouton désactivé (`disabled`, `opacity-50`) pendant le fetch pour éviter les double-clics sur connexion lente ; le clic est aussi ignoré tant que `downloading` est vrai (garde en plus de `disabled`, au cas où l'attribut HTML serait contourné).
- Composant resté générique, aucune dépendance ajoutée au module Tâches.

## Phase 3 — Vérification

- `npx tsc --noEmit` : erreur préexistante et non liée (`src/app/layout.tsx(41,50): Cannot find name 'LayoutProps'`) — confirmée présente à l'identique sur `origin/kilio` avant toute modification (test via `git stash`). Aucune nouvelle erreur introduite par ce travail.
- `npx eslint .` : ✅ aucune erreur ni warning.
- `npm run build` : ✅ build de production réussi (Turbopack), TypeScript passe dans le contexte du build (types `.next` générés), toutes les routes compilent.

## Fichiers créés

- `public/icons/icon-badge.png`
- `reports/2026-09-02-icone-badge-notif-et-download-photo.md` (ce rapport)

## Fichiers modifiés

- `public/sw.js` (`badge` → `icon-badge.png`, ajout à `APP_SHELL`)
- `src/components/ImageLightbox.tsx` (bouton Télécharger)

## Limitations connues

- **Rendu réel du badge sur Android** : non testable dans cet environnement (pas d'accès à un appareil/émulateur Android ni à un vrai envoi push). La vérification s'est limitée à l'inspection visuelle du PNG généré (silhouette blanche nette, transparence correcte, marge suffisante) — comportement attendu conforme à la doc Android (le badge est recoloré par le système à partir du canal alpha), mais le rendu final dans la barre de statut/le tiroir de notifications reste à confirmer par Vincent sur un vrai push.
- **Téléchargement selon navigateur/OS** : le flux `fetch` → `blob` → `<a download>` fonctionne nativement sur Chrome/Edge desktop et Android (téléchargement direct dans le dossier Téléchargements). Sur iOS Safari (y compris en PWA installée), l'attribut `download` sur un lien est historiquement ignoré ou partiellement supporté selon la version d'iOS : le fichier peut s'ouvrir dans un nouvel onglet/la visionneuse Photos au lieu d'être téléchargé silencieusement — comportement du système d'exploitation, hors contrôle du code. Le repli `window.open` (en cas d'échec du `fetch`, ex. CORS) ouvre l'image dans un nouvel onglet, où l'utilisateur peut la sauvegarder manuellement (appui long → Enregistrer l'image). Non testé en conditions réelles sur un appareil physique dans cet environnement (pas de navigateur/PWA disponible pour test manuel).
- Le fetch de l'image suppose que `src` (bucket Supabase Storage public) autorise les requêtes CORS depuis l'origine de l'app ; si ce n'est pas le cas, le repli `window.open` prend le relais automatiquement.

## Fin

Pas de push automatique, conformément aux instructions. En attente de confirmation de Vincent avant de pousser sur `kilio`.
