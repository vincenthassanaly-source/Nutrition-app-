"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton } from "@/lib/ui";

const AddTaskForm = dynamic(() => import("./AddTaskForm").then((m) => m.AddTaskForm), { ssr: false });

export function AddTaskToggle({
  listes,
  tags,
  defaultListeId,
  defaultEcheance,
  defaultHeure,
  label = "+ Ajouter une tâche",
  onSaved,
}: {
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  defaultListeId?: string;
  defaultEcheance?: string;
  defaultHeure?: string;
  label?: string;
  onSaved?: () => void;
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
        onDone={() => {
          setOpen(false);
          onSaved?.();
        }}
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
