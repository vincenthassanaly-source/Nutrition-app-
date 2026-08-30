"use client";

import { useState } from "react";
import type { RecurrenceAvecRelations } from "@/app/actions/transactions-recurrentes";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { RecurrenceForm } from "./RecurrenceForm";
import { RecurrenceVirementForm } from "./RecurrenceVirementForm";

type Mode = "depense" | "revenu" | "virement";

const TABS: { value: Mode; label: string }[] = [
  { value: "depense", label: "Dépense" },
  { value: "revenu", label: "Revenu" },
  { value: "virement", label: "Virement" },
];

export function RecurrenceModeForm({
  recurrence,
  comptes,
  categories,
  onDone,
}: {
  recurrence?: RecurrenceAvecRelations;
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
  onDone?: () => void;
}) {
  const [mode, setMode] = useState<Mode>(recurrence?.type ?? "depense");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5 rounded-xl bg-surface-alt p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setMode(tab.value)}
            className={`flex-1 rounded-lg py-1.5 text-[13px] font-semibold transition-colors ${
              mode === tab.value ? "bg-surface text-ink shadow-card" : "text-ink-2"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode === "virement" ? (
        <RecurrenceVirementForm
          recurrence={recurrence?.type === "virement" ? recurrence : undefined}
          comptes={comptes}
          onDone={onDone}
        />
      ) : (
        <RecurrenceForm
          key={mode}
          recurrence={recurrence?.type === mode ? recurrence : undefined}
          typeMouvement={mode}
          comptes={comptes}
          categories={categories}
          onDone={onDone}
        />
      )}
    </div>
  );
}
