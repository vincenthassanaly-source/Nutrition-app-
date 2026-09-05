"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSwipeHorizontal, type SensSwipe } from "@/hooks/useSwipeHorizontal";
import { useViewTransitionNavigate } from "@/hooks/useViewTransitionNavigate";
import { useNavigationEdit } from "@/lib/navigation/NavigationEditContext";

/**
 * Enrobe le `<main>` commun à toutes les pages de `(app)` pour détecter un
 * swipe horizontal entre les onglets épinglés en barre du bas. L'ordre suivi
 * est celui, dynamique et personnalisable, de `modulesBarreBasse`
 * (`NavigationEditContext`) — pas de notion d'ordre linéaire pour "Plus",
 * toujours exclu de ce tableau. Le hook de détection (`useSwipeHorizontal`,
 * déjà utilisé par Agenda et le Journal Nutrition pour naviguer entre dates)
 * n'est réellement branché sur `<main>` que sur les 4 routes exactes
 * présentes dans `modulesBarreBasse` : sur leurs sous-routes (/agenda,
 * /nutrition/journal, /nutrition/recettes...), les handlers ne sont pas
 * attachés du tout, pour ne jamais entrer en conflit avec le swipe
 * dates/semaines déjà présent sur ces écrans.
 */
export function TabSwipeWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navigate = useViewTransitionNavigate();
  const { modulesBarreBasse } = useNavigationEdit();

  const indexOngletActif = modulesBarreBasse.indexOf(pathname);
  const actif = indexOngletActif !== -1;

  function handleSwipe(sens: SensSwipe) {
    if (!actif) return;
    const prochainIndex = indexOngletActif + (sens === "suivant" ? 1 : -1);
    if (prochainIndex < 0 || prochainIndex >= modulesBarreBasse.length) return;
    navigate(modulesBarreBasse[prochainIndex]);
  }

  const swipeHandlers = useSwipeHorizontal(handleSwipe);

  return (
    <main
      className="flex-1 overflow-x-hidden overflow-y-auto px-4"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 64px)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 112px)",
        overscrollBehaviorY: "contain",
      }}
      {...(actif ? swipeHandlers : {})}
    >
      {children}
    </main>
  );
}
