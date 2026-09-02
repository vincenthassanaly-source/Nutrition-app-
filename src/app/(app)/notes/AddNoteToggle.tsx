"use client";

import { useState } from "react";
import { NoteForm } from "./NoteForm";
import { useBackClose } from "@/hooks/useBackClose";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";

export function AddNoteToggle({
  tags,
  defaultOpen = false,
}: {
  tags: Tables<"tags">[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useBackClose(open, () => setOpen(false));

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter une note
      </button>
    );
  }

  return (
    <div className={card}>
      <NoteForm tags={tags} onDone={() => setOpen(false)} />
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
        Annuler
      </button>
    </div>
  );
}
