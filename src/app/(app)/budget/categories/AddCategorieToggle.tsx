"use client";

import { useState } from "react";
import { AddCategorieForm } from "./AddCategorieForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddCategorieToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une catégorie
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCategorieForm onDone={() => setOpen(false)} />
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
