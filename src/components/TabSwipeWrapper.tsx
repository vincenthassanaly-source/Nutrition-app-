"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSwipeHorizontal, type SensSwipe } from "@/hooks/useSwipeHorizontal";
import { useViewTransitionNavigate } from "@/hooks/useViewTransitionNavigate";

// Ordre fixe des 4 onglets principaux à navigation linéaire : swipe à
// gauche va au suivant, à droite au précédent, sans wrap-around. "Plus" est
// exclu (pas de notion d'ordre linéaire, voir prompt de session).
const ONGLETS_ORDRE = ["/", "/nutrition", "/taches", "/habitudes"];

/**
 * Enrobe le `<main>` commun à toutes les pages de `(app)` pour détecter un
 * swipe horizontal entre les 4 onglets principaux. Le hook de détection
 * (`useSwipeHorizontal`, déjà utilisé par Agenda et le Journal Nutrition
 * pour naviguer entre dates) n'est réellement branché sur `<main>` que sur
 * les 4 routes exactes ci-dessus : sur leurs sous-routes (/agenda,
 * /nutrition/journal, /nutrition/recettes...), les handlers ne sont pas
 * attachés du tout, pour ne jamais entrer en conflit avec le swipe
 * dates/semaines déjà présent sur ces écrans.
 */
export function TabSwipeWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navigate = useViewTransitionNavigate();

  const indexOngletActif = ONGLETS_ORDRE.indexOf(pathname);
  const actif = indexOngletActif !== -1;

  function handleSwipe(sens: SensSwipe) {
    if (!actif) return;
    const prochainIndex = indexOngletActif + (sens === "suivant" ? 1 : -1);
    if (prochainIndex < 0 || prochainIndex >= ONGLETS_ORDRE.length) return;
    navigate(ONGLETS_ORDRE[prochainIndex]);
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
