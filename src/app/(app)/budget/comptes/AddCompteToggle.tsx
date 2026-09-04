"use client";

import { useState } from "react";
import { AddCompteForm } from "./AddCompteForm";
import { addCard, addCardIcon, card } from "@/lib/ui";

export function AddCompteToggle() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={addCard}>
        <div
          className={addCardIcon}
          style={{
            background:
              "linear-gradient(150deg, color-mix(in oklch, var(--color-kcal) 85%, white 15%), var(--color-kcal))",
            boxShadow: "0 3px 8px color-mix(in oklch, var(--color-kcal) 45%, transparent)",
          }}
        >
          +
        </div>
        <div className="flex flex-col gap-[1px]">
          <span className="font-display text-[14.5px] font-bold tracking-tight text-ink">Ajouter un compte</span>
          <span className="text-xs font-medium text-ink-3">Nouveau compte</span>
        </div>
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
