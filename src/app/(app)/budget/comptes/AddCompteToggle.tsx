"use client";

import { AddCompteForm } from "./AddCompteForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddCompteToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter un compte
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCompteForm onDone={() => history.back()} />
      <button
        type="button"
        onClick={() => history.back()}
        className="mt-2 text-sm text-ink-2 underline"
      >
        Annuler
      </button>
    </div>
  );
}
