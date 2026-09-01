"use client";

import { useRef } from "react";
import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/lib/supabase/types";
import { ghostButton } from "@/lib/ui";
import { parseISODate } from "./date-utils";
import {
  computeInitialScrollMinutes,
  getTacheBlockStyle,
  GRID_HEIGHT,
  HourLines,
  TimeGutter,
  useInitialScroll,
  WorkHoursBand,
} from "./TimeGrid";

type Tache = Tables<"taches">;

// Largeur minimale par colonne pour rester lisible (titre + heure) plutôt
// que de comprimer 7 colonnes dans les ~380px d'un écran mobile : la grille
// défile horizontalement (overflow-x-auto) au lieu de tout tasser.
const DAY_COLUMN_WIDTH = 96;

const PRIORITE_BLOCK_CLASS: Record<Tache["priorite"], string> = {
  aucune: "bg-surface-alt text-ink",
  basse: "bg-agenda/15 text-agenda",
  moyenne: "bg-carbs/15 text-carbs",
  haute: "bg-alert/15 text-alert",
};

function TacheBlock({ tache }: { tache: Tache }) {
  const style = getTacheBlockStyle(tache);
  if (!style) return null;

  return (
    <div
      className={`absolute inset-x-0.5 overflow-hidden rounded-md px-1 py-0.5 text-[10px] leading-tight font-semibold ${PRIORITE_BLOCK_CLASS[tache.priorite]} ${tache.fait ? "opacity-50 line-through" : ""}`}
      style={{ top: style.top, height: style.height }}
    >
      <span className="block truncate">{tache.heure?.slice(0, 5)} {tache.titre}</span>
    </div>
  );
}

export function WeekView({
  taches,
  horaires,
  selectedDate,
  onChangeDate,
  onSelectDay,
}: {
  taches: Tache[];
  horaires: Tables<"horaires_travail">[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onSelectDay: (date: Date) => void;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const today = new Date();
  const weekContainsToday = days.some((d) => isSameDay(d, today));

  const scrollRef = useRef<HTMLDivElement>(null);
  const horaireSelectedJour = horaires.find((h) => h.jour_semaine === getDay(selectedDate));
  useInitialScroll(
    scrollRef,
    computeInitialScrollMinutes({ showCurrentTime: weekContainsToday, horaire: horaireSelectedJour })
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChangeDate(subWeeks(selectedDate, 1))}
          className={ghostButton}
          aria-label="Semaine précédente"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-ink">
          {format(weekStart, "d MMM", { locale: fr })} – {format(weekEnd, "d MMM yyyy", { locale: fr })}
        </span>
        <button
          type="button"
          onClick={() => onChangeDate(addWeeks(selectedDate, 1))}
          className={ghostButton}
          aria-label="Semaine suivante"
        >
          →
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div ref={scrollRef} className="max-h-[65vh] overflow-auto">
          <div className="flex" style={{ width: 34 + days.length * DAY_COLUMN_WIDTH }}>
            <div className="sticky left-0 z-20 bg-surface">
              <div className="h-11 border-b border-line" />
              <TimeGutter />
            </div>

            {days.map((day) => {
              const horaireJour = horaires.find((h) => h.jour_semaine === getDay(day));
              const dayTachesAvecHeure = taches.filter(
                (t) => t.echeance && isSameDay(parseISODate(t.echeance), day) && t.heure
              );
              const dayTachesSansHeure = taches.filter(
                (t) => t.echeance && isSameDay(parseISODate(t.echeance), day) && !t.heure
              );

              return (
                <div
                  key={day.toISOString()}
                  className="flex shrink-0 flex-col border-l border-line"
                  style={{ width: DAY_COLUMN_WIDTH }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className={`sticky top-0 z-10 flex h-11 flex-col items-center justify-center gap-0 border-b border-line bg-surface text-center ${
                      isToday(day) ? "text-agenda" : "text-ink"
                    }`}
                  >
                    <span className="text-[11px] font-semibold">{format(day, "EEE", { locale: fr })}</span>
                    <span className="text-[10px] text-ink-2">{format(day, "d MMM", { locale: fr })}</span>
                  </button>

                  {dayTachesSansHeure.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onSelectDay(day)}
                      className="flex flex-wrap gap-0.5 border-b border-line/60 px-0.5 py-0.5"
                    >
                      {dayTachesSansHeure.slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className="truncate rounded bg-surface-alt px-1 py-0.5 text-[9.5px] font-medium text-ink-2"
                        >
                          {t.titre}
                        </span>
                      ))}
                      {dayTachesSansHeure.length > 2 && (
                        <span className="text-[9.5px] text-ink-2">+{dayTachesSansHeure.length - 2}</span>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectDay(day)}
                    className="relative block w-full text-left"
                    style={{ height: GRID_HEIGHT }}
                    aria-label={`Voir le ${format(day, "EEEE d MMMM", { locale: fr })}`}
                  >
                    <HourLines />
                    <WorkHoursBand horaire={horaireJour} />
                    {dayTachesAvecHeure.map((t) => (
                      <TacheBlock key={t.id} tache={t} />
                    ))}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
