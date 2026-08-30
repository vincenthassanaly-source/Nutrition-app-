"use client";

import {
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/lib/supabase/types";
import { ghostButton } from "@/lib/ui";
import { parseISODate, sortByHeure } from "./date-utils";

type Tache = Tables<"taches">;

export function WeekView({
  taches,
  selectedDate,
  onChangeDate,
  onSelectDay,
}: {
  taches: Tache[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onSelectDay: (date: Date) => void;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

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

      <div className="grid grid-cols-7 gap-1.5">
        {days.map((day) => {
          const dayTaches = taches
            .filter((t) => t.echeance && isSameDay(parseISODate(t.echeance), day))
            .sort(sortByHeure);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex min-h-24 flex-col gap-1 rounded-xl border p-1.5 text-left ${
                isToday(day) ? "border-agenda" : "border-line"
              } bg-surface`}
            >
              <span className="text-[11px] font-semibold text-ink-2">
                {format(day, "EEE d", { locale: fr })}
              </span>
              <div className="flex flex-col gap-0.5">
                {dayTaches.slice(0, 3).map((t) => (
                  <span key={t.id} className="truncate text-[10.5px] text-ink">
                    {t.heure ? `${t.heure.slice(0, 5)} ` : ""}
                    {t.titre}
                  </span>
                ))}
                {dayTaches.length > 3 && (
                  <span className="text-[10.5px] text-ink-2">+{dayTaches.length - 3}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
