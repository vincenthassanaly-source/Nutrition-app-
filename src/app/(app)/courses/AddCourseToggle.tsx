"use client";

import { AddCourseForm } from "./AddCourseForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddCourseToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter un article
      </button>
    );
  }

  return (
    <div className={card}>
      <AddCourseForm onDone={() => history.back()} />
      <button type="button" onClick={() => history.back()} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
