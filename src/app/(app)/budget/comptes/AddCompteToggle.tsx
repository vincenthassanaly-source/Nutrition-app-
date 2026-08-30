"use client";

import { useState } from "react";
import { AddCompteForm } from "./AddCompteForm";
import { card, dashedAddButton } from "@/lib/ui";

export function AddCompteToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter un compte
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCompteForm onDone={() => setOpen(false)} />
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
