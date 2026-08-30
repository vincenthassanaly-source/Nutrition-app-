"use client";

import { addDays, format, isSameDay, isToday, startOfToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/lib/supabase/types";
import { AddTaskToggle } from "../taches/AddTaskToggle";
import { TaskCard } from "../taches/TasksList";
import { ghostButton, sectionTitle } from "@/lib/ui";
import { parseISODate, sortByHeure, toISODate } from "./date-utils";

type Tache = Tables<"taches">;

export function DayView({
  taches,
  selectedDate,
  onChangeDate,
}: {
  taches: Tache[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
}) {
  // Les tâches sans heure sont regroupées après celles ayant une heure
  // (cohérent avec le tri "échéance nullsFirst: false" déjà utilisé par la
  // page Tâches).
  const dayTaches = taches
    .filter((t) => t.echeance && isSameDay(parseISODate(t.echeance), selectedDate))
    .sort(sortByHeure);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChangeDate(subDays(selectedDate, 1))}
          className={ghostButton}
          aria-label="Jour précédent"
        >
          ←
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className={sectionTitle}>
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
          {!isToday(selectedDate) && (
            <button
              type="button"
              onClick={() => onChangeDate(startOfToday())}
              className="text-xs font-semibold text-agenda underline"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChangeDate(addDays(selectedDate, 1))}
          className={ghostButton}
          aria-label="Jour suivant"
        >
          →
        </button>
      </div>

      <AddTaskToggle
        defaultEcheance={toISODate(selectedDate)}
        label="+ Ajouter une tâche ce jour-là"
      />

      {dayTaches.length === 0 ? (
        <p className="text-ink-2">Aucune tâche ce jour-là.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {dayTaches.map((tache) => (
            <TaskCard key={tache.id} tache={tache} />
          ))}
        </ul>
      )}
    </div>
  );
}
