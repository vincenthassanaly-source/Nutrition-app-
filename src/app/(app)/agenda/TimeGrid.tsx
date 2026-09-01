"use client";

import { useEffect, type RefObject } from "react";
import type { Tables } from "@/lib/supabase/types";
import { heureToMinutes } from "./date-utils";

// Grille horaire partagée entre WeekView et DayView : 24h pleines avec
// scroll vertical (pas de découpage arbitraire), 1 minute = HOUR_HEIGHT/60 px.
export const HOUR_HEIGHT = 56;
export const GRID_HEIGHT = HOUR_HEIGHT * 24;
// Une tâche avec heure mais sans heure_fin reste visible comme un bloc
// plutôt qu'un simple repère ponctuel : 30 min par défaut, cohérent avec
// les pas de rappel existants (5/15/30 min).
export const DEFAULT_TASK_DURATION_MINUTES = 30;
export const MIN_BLOCK_HEIGHT = 18;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function minutesToPx(minutes: number): number {
  return (minutes / 60) * HOUR_HEIGHT;
}

export function getTacheBlockStyle(tache: {
  heure: string | null;
  heure_fin: string | null;
}): { top: number; height: number } | null {
  const start = heureToMinutes(tache.heure);
  if (start === null) return null;

  const endRaw = heureToMinutes(tache.heure_fin);
  const end = endRaw !== null && endRaw > start ? endRaw : start + DEFAULT_TASK_DURATION_MINUTES;

  return {
    top: minutesToPx(start),
    height: Math.max(minutesToPx(end - start), MIN_BLOCK_HEIGHT),
  };
}

// Position du scroll initial : l'heure actuelle si le jour affiché (ou l'un
// des jours de la semaine affichée) est aujourd'hui, sinon le début des
// heures de travail du jour de référence — pour éviter d'atterrir sur une
// grille vide à minuit. Repli sur 8h si aucun horaire n'est configuré.
export function computeInitialScrollMinutes({
  showCurrentTime,
  horaire,
}: {
  showCurrentTime: boolean;
  horaire: Tables<"horaires_travail"> | undefined;
}): number {
  if (showCurrentTime) {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
  return heureToMinutes(horaire?.heure_debut ?? null) ?? 8 * 60;
}

export function useInitialScroll(
  containerRef: RefObject<HTMLDivElement | null>,
  targetMinutes: number
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = Math.max(minutesToPx(targetMinutes) - 80, 0);
    // Positionnement au montage uniquement : un re-scroll à chaque rendu
    // écraserait le scroll manuel de l'utilisateur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function TimeGutter() {
  return (
    <div className="relative shrink-0" style={{ width: 34, height: GRID_HEIGHT }}>
      {HOURS.map((h) => (
        <span
          key={h}
          className="absolute right-1 -translate-y-1/2 text-[10px] font-medium text-ink-2"
          style={{ top: minutesToPx(h * 60) }}
        >
          {String(h).padStart(2, "0")}h
        </span>
      ))}
    </div>
  );
}

export function HourLines() {
  return (
    <div className="pointer-events-none absolute inset-0" style={{ height: GRID_HEIGHT }}>
      {HOURS.map((h) => (
        <div
          key={h}
          className="absolute inset-x-0 border-t border-line/70"
          style={{ top: minutesToPx(h * 60) }}
        />
      ))}
    </div>
  );
}

// Bande "heures de travail" : variante plus claire de --accent-agenda (pas
// une nouvelle teinte). Un jour non travaillé (les deux heures à null) ne
// dessine aucune bande — option la plus simple, à défaut de retour de
// Vincent sur un repère "fermé" dédié.
export function WorkHoursBand({ horaire }: { horaire: Tables<"horaires_travail"> | undefined }) {
  const start = heureToMinutes(horaire?.heure_debut ?? null);
  const end = heureToMinutes(horaire?.heure_fin ?? null);
  if (start === null || end === null || end <= start) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 rounded-md"
      style={{
        top: minutesToPx(start),
        height: minutesToPx(end - start),
        backgroundColor: "var(--accent-agenda)",
        opacity: 0.1,
      }}
    />
  );
}
