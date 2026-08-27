"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createRecette,
  updateRecette,
  type RecetteFormState,
} from "@/app/actions/recettes";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: RecetteFormState = { error: null };

export function RecetteForm({
  recette,
  onDone,
}: {
  recette?: Tables<"recettes">;
  onDone?: () => void;
}) {
  const action = recette ? updateRecette : createRecette;
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
      {recette && <input type="hidden" name="id" value={recette.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" name="nom" required defaultValue={recette?.nom} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={recette?.description ?? ""}
          className={input}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="temps_prepa_min" className={labelClass}>
            Préparation (min)
          </label>
          <input
            id="temps_prepa_min"
            name="temps_prepa_min"
            type="number"
            min="0"
            step="1"
            defaultValue={recette?.temps_prepa_min ?? ""}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="portions" className={labelClass}>
            Portions
          </label>
          <input
            id="portions"
            name="portions"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={recette?.portions ?? 1}
            className={input}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="source" className={labelClass}>
          Source
        </label>
        <select id="source" name="source" defaultValue={recette?.source ?? "manuel"} className={input}>
          <option value="manuel">Manuel</option>
          <option value="hellofresh">HelloFresh</option>
        </select>
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : recette ? "Enregistrer" : "Créer la recette"}
      </button>
    </form>
  );
}
