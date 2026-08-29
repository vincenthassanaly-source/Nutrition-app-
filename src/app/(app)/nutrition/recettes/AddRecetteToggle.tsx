"use client";

import { useState } from "react";
import { RecetteForm } from "./RecetteForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddRecetteToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une recette
      </button>
    );
  }

  return (
    <div className={card}>
      <RecetteForm />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
