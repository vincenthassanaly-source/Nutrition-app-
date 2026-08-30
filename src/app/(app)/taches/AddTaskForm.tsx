"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTache, updateTache, type TacheFormState } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: TacheFormState = { error: null };

export function AddTaskForm({
  tache,
  defaultEcheance,
  defaultHeure,
  onDone,
}: {
  tache?: Tables<"taches">;
  defaultEcheance?: string;
  defaultHeure?: string;
  onDone?: () => void;
}) {
  const action = tache ? updateTache : createTache;
  const [state, formAction, pending] = useActionState(action, initialState);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {tache && <input type="hidden" name="id" value={tache.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className={labelClass}>
          Titre
        </label>
        <input id="titre" name="titre" required defaultValue={tache?.titre} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="echeance" className={labelClass}>
          Échéance (optionnel)
        </label>
        <input
          id="echeance"
          name="echeance"
          type="date"
          defaultValue={tache?.echeance ?? defaultEcheance ?? ""}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="heure" className={labelClass}>
          Heure (optionnel)
        </label>
        <input
          id="heure"
          name="heure"
          type="time"
          defaultValue={tache?.heure?.slice(0, 5) ?? defaultHeure ?? ""}
          className={input}
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : tache ? "Enregistrer" : "Créer la tâche"}
      </button>
    </form>
  );
}
