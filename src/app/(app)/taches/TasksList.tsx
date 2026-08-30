"use client";

import { useState, useTransition } from "react";
import { deleteTache, toggleTache } from "@/app/actions/taches";
import { AddTaskForm } from "./AddTaskForm";
import type { Tables } from "@/lib/supabase/types";
import { card, dangerButton, ghostButton, listCard, metaText, nameText } from "@/lib/ui";

function formatEcheance(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function TaskCard({ tache }: { tache: Tables<"taches"> }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <AddTaskForm tache={tache} onDone={() => setEditing(false)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className={listCard}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={tache.fait}
          disabled={isPending}
          onChange={() => startTransition(() => toggleTache(tache.id))}
          className="mt-0.5 h-5 w-5 shrink-0 accent-kcal"
        />
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <p className={`${nameText} ${tache.fait ? "text-ink-2 line-through" : ""}`}>
              {tache.titre}
            </p>
          </div>
          {tache.echeance && (
            <span className={metaText}>Échéance : {formatEcheance(tache.echeance)}</span>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteTache(tache.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}

export function TasksList({ taches }: { taches: Tables<"taches">[] }) {
  if (taches.length === 0) {
    return <p className="text-ink-2">Aucune tâche pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {taches.map((tache) => (
        <TaskCard key={tache.id} tache={tache} />
      ))}
    </ul>
  );
}
