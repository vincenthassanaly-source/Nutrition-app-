"use client";

import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";
import { RecurrenceModeForm } from "./RecurrenceModeForm";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddRecurrenceToggle({
  comptes,
  categories,
}: {
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  const [open, show] = useBackCloseToggle();

  if (comptes.length === 0 || categories.length === 0) {
    return null;
  }

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter une récurrence
      </button>
    );
  }

  return (
    <div className={card}>
      <RecurrenceModeForm comptes={comptes} categories={categories} onDone={() => history.back()} />
      <button
        type="button"
        onClick={() => history.back()}
        className="mt-2 text-sm text-ink-2 underline"
      >
        Annuler
      </button>
    </div>
  );
}
