"use client";

import { useState } from "react";
import { ObjectifForm } from "./ObjectifForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddObjectifToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter un objectif
      </button>
    );
  }

  return (
    <div className={card}>
      <ObjectifForm onDone={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
