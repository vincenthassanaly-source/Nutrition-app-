"use client";

import { useState } from "react";
import { startOfToday } from "date-fns";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { AddTaskForm } from "../taches/AddTaskForm";
import { Modal } from "@/components/Modal";
import { useBackClose } from "@/hooks/useBackClose";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { ListView } from "./ListView";
import { toISODate } from "./date-utils";

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
  creneaux,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  creneaux: Tables<"horaires_travail_creneaux">[];
}) {
  const [view, setView] = useState<ViewKey>("jour");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [fabOpen, setFabOpen] = useState(false);

  useBackClose(fabOpen, () => setFabOpen(false));

  function selectDay(date: Date) {
    setSelectedDate(date);
    setView("jour");
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => setFabOpen(true)}
        aria-label="Ajouter un événement"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card"
        style={{ background: "var(--accent-agenda)", bottom: "calc(env(safe-area-inset-bottom) + 90px)" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {fabOpen && (
        <Modal title="Nouvel événement" onClose={() => setFabOpen(false)}>
          <AddTaskForm
            listes={listes}
            tags={tags}
            defaultEcheance={toISODate(selectedDate)}
            onDone={() => setFabOpen(false)}
          />
        </Modal>
      )}

      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-2xl border border-line bg-surface p-1">
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
      </div>

      {view === "jour" && (
        <DayView
          taches={taches}
          listes={listes}
          tags={tags}
          creneaux={creneaux}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
        />
      )}
      {view === "semaine" && (
        <WeekView
          taches={taches}
          creneaux={creneaux}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onSelectDay={selectDay}
        />
      )}
      {view === "mois" && (
        <MonthView
          taches={taches}
          creneaux={creneaux}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          onSelectDay={selectDay}
        />
      )}
      {view === "liste" && <ListView taches={taches} listes={listes} tags={tags} />}
    </div>
  );
}
