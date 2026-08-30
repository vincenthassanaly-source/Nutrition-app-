"use client";

import { useState } from "react";
import { HabitudeForm } from "./HabitudeForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddHabitudeToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une habitude
      </button>
    );
  }

  return (
    <div className={card}>
      <HabitudeForm onDone={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
