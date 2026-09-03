"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { card, dashedAddButton } from "@/lib/ui";

const RecetteForm = dynamic(() => import("./RecetteForm").then((m) => m.RecetteForm), { ssr: false });

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
