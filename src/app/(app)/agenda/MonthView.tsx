"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/lib/supabase/types";
import { getCreneauxDuJour } from "@/lib/agenda/planning-travail";
import { ghostButton } from "@/lib/ui";
import { toISODate } from "./date-utils";

type Tache = Tables<"taches">;

const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function MonthView({
  taches,
  creneaux,
  selectedDate,
  onChangeDate,
  onSelectDay,
}: {
  taches: Tache[];
  creneaux: Tables<"horaires_travail_creneaux">[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
  onSelectDay: (date: Date) => void;
}) {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const countByDay = new Map<string, number>();
  for (const t of taches) {
    if (!t.echeance) continue;
    countByDay.set(t.echeance, (countByDay.get(t.echeance) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChangeDate(subMonths(selectedDate, 1))}
          className={ghostButton}
          aria-label="Mois précédent"
        >
          ←
        </button>
        <span className="text-sm font-semibold capitalize text-ink">
          {format(selectedDate, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          type="button"
          onClick={() => onChangeDate(addMonths(selectedDate, 1))}
          className={ghostButton}
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-2">
        {WEEKDAY_LABELS.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const iso = toISODate(day);
          const count = countByDay.get(iso) ?? 0;
          const inMonth = isSameMonth(day, selectedDate);
          const jourTravaille = getCreneauxDuJour(creneaux, day).length > 0;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border text-[13px] ${
                isToday(day) ? "border-agenda" : "border-line"
              } ${inMonth ? "text-ink" : "text-ink-3"} ${jourTravaille ? "" : "bg-surface"}`}
              style={jourTravaille ? { backgroundColor: "var(--accent-planning-travail-soft)" } : undefined}
            >
              <span>{format(day, "d")}</span>
              {count > 0 && <span className="h-1.5 w-1.5 rounded-full bg-agenda" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
