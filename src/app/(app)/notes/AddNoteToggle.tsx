"use client";

import { NoteForm } from "./NoteForm";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddNoteToggle() {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
        + Ajouter une note
      </button>
    );
  }

  return (
    <div className={card}>
      <NoteForm onDone={() => history.back()} />
      <button type="button" onClick={() => history.back()} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
