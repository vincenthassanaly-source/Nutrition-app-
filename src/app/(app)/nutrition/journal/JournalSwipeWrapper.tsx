"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useSwipeHorizontal, type SensSwipe } from "@/hooks/useSwipeHorizontal";
import { shiftDate } from "./date-utils";

/**
 * Ajoute le swipe horizontal (même geste/tolérances que l'Agenda, voir
 * `useSwipeHorizontal`) au Journal Nutrition — un composant serveur dont
 * chaque changement de jour recharge via `searchParams` (`date`, `jour`).
 * Le sens du swipe est gardé en state ici (ce wrapper client n'est pas
 * démonté par la navigation) pour piloter l'animation `agenda-glisse-*`
 * rejouée via la `key` posée sur `date` quand le contenu (children) change.
 */
export function JournalSwipeWrapper({
  date,
  jourType,
  children,
}: {
  date: string;
  jourType: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [sens, setSens] = useState<SensSwipe>("suivant");

  const swipeHandlers = useSwipeHorizontal((sensSwipe) => {
    setSens(sensSwipe);
    const nouvelleDate = shiftDate(date, sensSwipe === "suivant" ? 1 : -1);
    router.push(`/nutrition/journal?date=${nouvelleDate}&jour=${jourType}`);
  });

  return (
    <div {...swipeHandlers}>
      <div
        key={date}
        className={sens === "suivant" ? "agenda-glisse-suivant" : "agenda-glisse-precedent"}
      >
        {children}
      </div>
    </div>
  );
}
