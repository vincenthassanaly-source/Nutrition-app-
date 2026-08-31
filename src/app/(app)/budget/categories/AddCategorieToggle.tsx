"use client";

import { AddCategorieForm } from "./AddCategorieForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddCategorieToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter une catégorie
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCategorieForm onDone={() => history.back()} />
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
