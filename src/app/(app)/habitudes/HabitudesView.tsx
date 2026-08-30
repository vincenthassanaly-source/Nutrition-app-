"use client";

import { useState } from "react";
import type { HabitudeDuJour } from "@/app/actions/habitudes";
import { AddHabitudeToggle } from "./AddHabitudeToggle";
import { HabitudeCard } from "./HabitudeCard";
import { HistoriqueView } from "./HistoriqueView";

type ViewKey = "aujourdhui" | "historique";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "historique", label: "Historique" },
];

export function HabitudesView({
  habitudes,
  today,
}: {
  habitudes: HabitudeDuJour[];
  today: string;
}) {
  const [view, setView] = useState<ViewKey>("aujourdhui");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-2xl border border-line bg-surface p-1">
        {VIEWS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setView(v.key)}
            className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors ${
              view === v.key ? "bg-habitudes text-white" : "text-ink-2"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === "aujourdhui" && (
        <div className="flex flex-col gap-4">
          <AddHabitudeToggle />
          {habitudes.length === 0 ? (
            <p className="text-ink-2">Aucune habitude pour l&apos;instant.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {habitudes.map((habitude) => (
                <HabitudeCard key={habitude.id} habitude={habitude} date={today} />
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "historique" && <HistoriqueView habitudes={habitudes} />}
    </div>
  );
}
