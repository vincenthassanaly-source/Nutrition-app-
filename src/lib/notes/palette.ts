import type { CSSProperties } from "react";

// Palette de couleurs pastel pour les notes, façon Google Keep. Chaque clé
// est la valeur stockée en base (notes.couleur) ; le rendu s'appuie sur les
// variables --note-<clé> définies dans globals.css (paires light/dark, même
// pattern que les tokens --accent-*), pour ne jamais coder une couleur brute
// dans le TSX et rester theme-aware sans logique JS.

export type NoteCouleur =
  | "sauge"
  | "peche"
  | "lavande"
  | "ciel"
  | "rose"
  | "citron"
  | "menthe"
  | "argile";

export const NOTE_PALETTE: { cle: NoteCouleur; label: string }[] = [
  { cle: "sauge", label: "Sauge" },
  { cle: "peche", label: "Pêche" },
  { cle: "lavande", label: "Lavande" },
  { cle: "ciel", label: "Ciel" },
  { cle: "rose", label: "Rose" },
  { cle: "citron", label: "Citron" },
  { cle: "menthe", label: "Menthe" },
  { cle: "argile", label: "Argile" },
];

const PALETTE_CLES = new Set<string>(NOTE_PALETTE.map((c) => c.cle));

export function estCouleurValide(couleur: string): couleur is NoteCouleur {
  return PALETTE_CLES.has(couleur);
}

export function noteBackgroundStyle(couleur: string | null): CSSProperties | undefined {
  if (!couleur || !estCouleurValide(couleur)) return undefined;
  return { backgroundColor: `var(--note-${couleur})` };
}
