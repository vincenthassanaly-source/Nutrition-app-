"use client";

import { useActionState, useState } from "react";
import { upsertObjectif, type ObjectifFormState } from "@/app/actions/objectifs";
import type { Enums, Tables } from "@/lib/supabase/types";

const initialState: ObjectifFormState = { error: null };

export function ObjectifForm({
  jourType,
  objectif,
}: {
  jourType: Enums<"jour_type_ppl">;
  objectif: Tables<"objectifs_nutritionnels"> | null;
}) {
  const [open, setOpen] = useState(!objectif);
  const [state, formAction, pending] = useActionState(upsertObjectif, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-green-700 underline"
      >
        Modifier l&apos;objectif
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3"
    >
      <input type="hidden" name="jour_type" value={jourType} />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="kcal_cible" className="text-sm font-medium">
            Kcal cible
          </label>
          <input
            id="kcal_cible"
            name="kcal_cible"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={objectif?.kcal_cible ?? ""}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="proteines_cible_g" className="text-sm font-medium">
            Protéines (g)
          </label>
          <input
            id="proteines_cible_g"
            name="proteines_cible_g"
            type="number"
            min="0"
            step="1"
            defaultValue={objectif?.proteines_cible_g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="glucides_cible_g" className="text-sm font-medium">
            Glucides (g)
          </label>
          <input
            id="glucides_cible_g"
            name="glucides_cible_g"
            type="number"
            min="0"
            step="1"
            defaultValue={objectif?.glucides_cible_g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lipides_cible_g" className="text-sm font-medium">
            Lipides (g)
          </label>
          <input
            id="lipides_cible_g"
            name="lipides_cible_g"
            type="number"
            min="0"
            step="1"
            defaultValue={objectif?.lipides_cible_g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-700 px-4 py-2 text-white font-medium disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Enregistrer l'objectif"}
        </button>
        {objectif && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2"
          >
            Fermer
          </button>
        )}
      </div>
    </form>
  );
}
