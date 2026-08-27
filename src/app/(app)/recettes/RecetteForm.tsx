"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createRecette,
  updateRecette,
  type RecetteFormState,
} from "@/app/actions/recettes";
import type { Tables } from "@/lib/supabase/types";

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
        <label htmlFor="nom" className="text-sm font-medium">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          required
          defaultValue={recette?.nom}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={recette?.description ?? ""}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="temps_prepa_min" className="text-sm font-medium">
            Préparation (min)
          </label>
          <input
            id="temps_prepa_min"
            name="temps_prepa_min"
            type="number"
            min="0"
            step="1"
            defaultValue={recette?.temps_prepa_min ?? ""}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="portions" className="text-sm font-medium">
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
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="source" className="text-sm font-medium">
          Source
        </label>
        <select
          id="source"
          name="source"
          defaultValue={recette?.source ?? "manuel"}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="manuel">Manuel</option>
          <option value="hellofresh">HelloFresh</option>
        </select>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-700 px-4 py-2.5 text-white font-medium disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : recette ? "Enregistrer" : "Créer la recette"}
      </button>
    </form>
  );
}
