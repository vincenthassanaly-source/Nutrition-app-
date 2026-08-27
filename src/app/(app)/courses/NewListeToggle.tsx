"use client";

import { useActionState, useState } from "react";
import {
  createListeFromRecettes,
  type ListeFormState,
} from "@/app/actions/listes-courses";
import type { Tables } from "@/lib/supabase/types";

const initialState: ListeFormState = { error: null };

export function NewListeToggle({ recettes }: { recettes: Tables<"recettes">[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createListeFromRecettes, initialState);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-green-700 py-2.5 text-green-700 font-medium"
      >
        + Nouvelle liste depuis des recettes
      </button>
    );
  }

  if (recettes.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 p-3">
        <p className="text-sm text-neutral-500">
          Crée d&apos;abord une recette dans l&apos;onglet Recettes pour pouvoir générer une
          liste de courses.
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="mt-2 text-sm text-neutral-500 underline"
        >
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium">
          Nom de la liste
        </label>
        <input
          id="nom"
          name="nom"
          placeholder="Liste de courses"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium mb-1">Recettes à inclure</legend>
        {recettes.map((recette) => (
          <label key={recette.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="recette_id" value={recette.id} className="h-4 w-4" />
            {recette.nom}
          </label>
        ))}
      </fieldset>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-green-700 px-4 py-2.5 text-white font-medium disabled:opacity-60"
        >
          {pending ? "Génération..." : "Générer la liste"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-neutral-300 px-4 py-2.5"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
