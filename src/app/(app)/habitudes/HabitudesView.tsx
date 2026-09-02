"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getHabitudesDuJour } from "@/app/actions/habitudes";
import { queryKeys } from "@/lib/query/keys";
import { AddHabitudeToggle } from "./AddHabitudeToggle";
import { HabitudeCard } from "./HabitudeCard";
import { HistoriqueView } from "./HistoriqueView";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { errorText } from "@/lib/ui";

type ViewKey = "aujourdhui" | "historique";

const VIEWS: { key: ViewKey; label: string }[] = [
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "historique", label: "Historique" },
];

export function HabitudesView({ today }: { today: string }) {
  const [view, setView] = useState<ViewKey>("aujourdhui");
  const queryClient = useQueryClient();

  const { data: habitudes = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.habitudes(today),
    queryFn: () => getHabitudesDuJour(today),
  });

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
          <AddHabitudeToggle
            onSaved={() => queryClient.invalidateQueries({ queryKey: queryKeys.habitudes(today) })}
          />
          {isLoading ? (
            <ListItemSkeletonGroup count={3} withSubtitle />
          ) : isError ? (
            <p className={errorText}>Erreur de chargement des habitudes. Réessaie.</p>
          ) : habitudes.length === 0 ? (
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
