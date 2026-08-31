"use client";

import { HabitudeForm } from "./HabitudeForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddHabitudeToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter une habitude
      </button>
    );
  }

  return (
    <div className={card}>
      <HabitudeForm onDone={() => history.back()} />
      <button type="button" onClick={() => history.back()} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
