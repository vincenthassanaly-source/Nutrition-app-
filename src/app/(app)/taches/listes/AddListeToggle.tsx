"use client";

import { useState } from "react";
import { AddListeForm } from "./AddListeForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddListeToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une liste
      </button>
    );
  }

  return (
    <div className={card}>
      <AddListeForm onDone={() => setOpen(false)} />
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
