"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Enums } from "@/lib/supabase/types";
import { formatPeriode, periodeAdjacente, periodeParDefaut } from "@/lib/budget/compute";
import { ghostButton } from "@/lib/ui";

const ONGLETS: { value: Enums<"type_periode_budget">; label: string }[] = [
  { value: "hebdomadaire", label: "Semaine" },
  { value: "mensuel", label: "Mois" },
  { value: "annuel", label: "Année" },
];

export function PeriodeSelector({
  typePeriode,
  periode,
}: {
  typePeriode: Enums<"type_periode_budget">;
  periode: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function naviguer(nouveauTypePeriode: Enums<"type_periode_budget">, nouvellePeriode: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type_periode", nouveauTypePeriode);
    params.set("periode", nouvellePeriode);
    router.push(`/budget/categories?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5 rounded-xl bg-surface-alt p-1">
        {ONGLETS.map((onglet) => (
          <button
            key={onglet.value}
            type="button"
            onClick={() => naviguer(onglet.value, periodeParDefaut(onglet.value))}
            className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-colors ${
              typePeriode === onglet.value ? "bg-surface text-ink shadow-card" : "text-ink-2"
            }`}
          >
            {onglet.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => naviguer(typePeriode, periodeAdjacente(periode, typePeriode, -1))}
          className={ghostButton}
        >
          ← Précédent
        </button>
        <p className="text-[13px] font-semibold text-ink">{formatPeriode(periode, typePeriode)}</p>
        <button
          type="button"
          onClick={() => naviguer(typePeriode, periodeAdjacente(periode, typePeriode, 1))}
          className={ghostButton}
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
