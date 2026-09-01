"use client";

import { useState } from "react";
import { startOfToday } from "date-fns";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { AddTaskForm } from "../taches/AddTaskForm";
import { Modal } from "@/components/Modal";
import { DayView } from "./DayView";
import { WeekView } from "./WeekView";
import { MonthView } from "./MonthView";
import { ListView } from "./ListView";
import { HorairesForm } from "./HorairesForm";
import { toISODate } from "./date-utils";
import { iconButton } from "@/lib/ui";

type ViewKey = "jour" | "semaine" | "mois" | "liste";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "jour", label: "Jour" },
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "liste", label: "Liste" },
];

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function AgendaView({
  taches,
  listes,
  tags,
  horaires,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  horaires: Tables<"horaires_travail">[];
}) {
  const [view, setView] = useState<ViewKey>("jour");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [fabOpen, setFabOpen] = useState(false);
  const [horairesOpen, setHorairesOpen] = useState(false);

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

      {horairesOpen && (
        <Modal title="Heures de travail" onClose={() => setHorairesOpen(false)}>
          <HorairesForm horaires={horaires} onDone={() => setHorairesOpen(false)} />
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
        <button
          type="button"
          onClick={() => setHorairesOpen(true)}
          className={iconButton}
          aria-label="Régler les heures de travail"
        >
          <ClockIcon />
        </button>
      </div>

      {view === "jour" && (
        <DayView
          taches={taches}
          listes={listes}
          tags={tags}
          horaires={horaires}
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
        />
      )}
      {view === "semaine" && (
        <WeekView
          taches={taches}
          horaires={horaires}
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
