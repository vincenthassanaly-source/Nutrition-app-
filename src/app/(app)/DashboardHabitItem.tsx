"use client";

import { useTransition } from "react";
import { enregistrerEntreeHabitude, type HabitudeDuJour } from "@/app/actions/habitudes";
import { ProgressRing } from "@/components/ProgressRing";

export function DashboardHabitItem({ habitude, date }: { habitude: HabitudeDuJour; date: string }) {
  const [isPending, startTransition] = useTransition();
  const valeur = habitude.entreeDuJour?.valeur ?? 0;
  const fait = valeur > 0;
  const pct =
    habitude.type === "quantifiee" && habitude.valeur_cible
      ? valeur / habitude.valeur_cible
      : fait
        ? 1
        : 0;

  function toggle() {
    if (habitude.type === "quantifiee") return;
    startTransition(() => enregistrerEntreeHabitude(habitude.id, date, fait ? 0 : 1));
  }

  return (
    <button
      type="button"
      disabled={isPending || habitude.type === "quantifiee"}
      onClick={toggle}
      className="flex w-[60px] shrink-0 flex-col items-center gap-1.5"
    >
      <ProgressRing size={50} strokeWidth={5} pct={pct} color="var(--accent-habitudes)">
        <span className="text-base leading-none">{habitude.icone || "✓"}</span>
      </ProgressRing>
      <span className="truncate text-[10px] font-semibold text-ink-2">{habitude.nom}</span>
      {habitude.type === "streak" && habitude.streak > 0 && (
        <span className="text-[9px] font-bold text-habitudes">🔥{habitude.streak}</span>
      )}
    </button>
  );
}
