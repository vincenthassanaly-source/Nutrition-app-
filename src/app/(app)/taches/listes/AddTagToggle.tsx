"use client";

import { useState } from "react";
import { AddTagForm } from "./AddTagForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddTagToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter un tag
      </button>
    );
  }

  return (
    <div className={card}>
      <AddTagForm onDone={() => setOpen(false)} />
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
