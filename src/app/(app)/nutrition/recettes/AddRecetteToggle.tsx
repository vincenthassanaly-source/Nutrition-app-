"use client";

import { RecetteForm } from "./RecetteForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddRecetteToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter une recette
      </button>
    );
  }

  return (
    <div className={card}>
      <RecetteForm />
      <button type="button" onClick={() => history.back()} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
