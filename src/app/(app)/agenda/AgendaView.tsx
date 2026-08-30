"use client";

import { useState } from "react";
import { startOfToday } from "date-fns";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { ListView } from "./ListView";

type ViewKey = "jour" | "semaine" | "mois" | "liste";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "jour", label: "Jour" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "liste", label: "Liste" },
];

export function AgendaView({
  taches,
  listes,
  tags,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  const [view, setView] = useState<ViewKey>("jour");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  function selectDay(date: Date) {
    setSelectedDate(date);
    setView("jour");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-2xl border border-line bg-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors ${
              view === v.key ? "bg-agenda text-white" : "text-ink-2"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "jour" && (
        <DayView
          taches={taches}
          listes={listes}
          tags={tags}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
        />
      )}
      {view === "semaine" && (
        <WeekView
          taches={taches}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onSelectDay={selectDay}
        />
      )}
      {view === "mois" && (
        <MonthView
          taches={taches}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onSelectDay={selectDay}
        />
      )}
      {view === "liste" && <ListView taches={taches} listes={listes} tags={tags} />}
    </div>
  );
}
