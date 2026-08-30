"use client";

import { useState } from "react";
import { AddCourseForm } from "./AddCourseForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddCourseToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter un article
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCourseForm onDone={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
