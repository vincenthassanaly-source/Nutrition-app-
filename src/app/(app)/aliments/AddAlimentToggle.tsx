"use client";

import { useState } from "react";
import { AlimentForm } from "./AlimentForm";

export function AddAlimentToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-green-700 py-2.5 text-green-700 font-medium"
      >
        + Ajouter un aliment
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-3">
      <AlimentForm onDone={() => setOpen(false)} />
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="mt-2 text-sm text-neutral-500 underline"
      >
        Annuler
      </button>
    </div>
  );
}
