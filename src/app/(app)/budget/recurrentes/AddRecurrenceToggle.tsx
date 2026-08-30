"use client";

import { useState } from "react";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";
import { RecurrenceModeForm } from "./RecurrenceModeForm";

export function AddRecurrenceToggle({
  comptes,
  categories,
}: {
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  const [open, setOpen] = useState(false);

  if (comptes.length === 0 || categories.length === 0) {
    return null;
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une récurrence
      </button>
    );
  }

  return (
    <div className={card}>
      <RecurrenceModeForm comptes={comptes} categories={categories} onDone={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-sm text-ink-2 underline"
      >
        Annuler
      </button>
    </div>
  );
}
