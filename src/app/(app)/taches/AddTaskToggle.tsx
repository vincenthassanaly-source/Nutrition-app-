"use client";

import { useState } from "react";
import { AddTaskForm } from "./AddTaskForm";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";

export function AddTaskToggle({
  listes,
  tags,
  defaultListeId,
  defaultEcheance,
  defaultHeure,
  label = "+ Ajouter une tâche",
}: {
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  defaultListeId?: string;
  defaultEcheance?: string;
  defaultHeure?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        {label}
      </button>
    );
  }

  return (
    <div className={card}>
      <AddTaskForm
        listes={listes}
        tags={tags}
        defaultListeId={defaultListeId}
        defaultEcheance={defaultEcheance}
        defaultHeure={defaultHeure}
        onDone={() => setOpen(false)}
      />
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
