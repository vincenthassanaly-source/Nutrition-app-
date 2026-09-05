import type { ReactNode } from "react";
import { DEFAULT_MODULES_BARRE_BASSE, NAV_ITEMS } from "@/lib/navigation/registry";

export type AppModule = {
  href: string;
  label: string;
  description: string;
  icon: (color: string) => ReactNode;
  accentVar: string;
};

// Nutrition, Tâches et Habitudes vivent désormais dans la barre de
// navigation principale (voir BottomNav) : cette grille "Plus" ne liste que
// les modules secondaires, accessibles en un tap depuis l'onglet Plus.
//
// Sous-ensemble dérivé du registre unifié (src/lib/navigation/registry.ts) :
// tout item qui n'est pas un des 4 emplacements par défaut de la barre du
// bas. L'ordre affiché à Vincent est en réalité piloté par
// preferences_navigation.ordre_grille_plus (voir
// resolveOrdreGrillePlus dans src/app/actions/preferences-navigation.ts) ;
// cet export ne sert que d'ordre par défaut / de source de vérité pour les
// modules disponibles.
export const MODULES: AppModule[] = NAV_ITEMS.filter(
  (item) => !DEFAULT_MODULES_BARRE_BASSE.includes(item.href)
).map((item) => ({
  href: item.href,
  label: item.label,
  description: item.description ?? "",
  icon: item.icon,
  accentVar: item.accentVar,
}));
