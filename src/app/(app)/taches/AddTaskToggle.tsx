"use client";

import { AddTaskForm } from "./AddTaskForm";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

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
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={dashedAddButton}>
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
        onDone={() => history.back()}
      />
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
