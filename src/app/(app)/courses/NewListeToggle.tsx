"use client";

import { useActionState, useState } from "react";
import {
  createListeFromRecettes,
  type ListeFormState,
} from "@/app/actions/listes-courses";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton, errorText, input, label as labelClass, primaryButton, secondaryButton } from "@/lib/ui";

const initialState: ListeFormState = { error: null };

export function NewListeToggle({ recettes }: { recettes: Tables<"recettes">[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createListeFromRecettes, initialState);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Nouvelle liste depuis des recettes
      </button>
    );
  }

  if (recettes.length === 0) {
    return (
      <div className={card}>
        <p className="text-sm text-ink-2">
          Crée d&apos;abord une recette dans l&apos;onglet Recettes pour pouvoir générer une liste
          de courses.
        </p>
        <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
          Fermer
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className={`${card} flex flex-col gap-3`}>
      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className={labelClass}>
          Nom de la liste
        </label>
        <input id="nom" name="nom" placeholder="Liste de courses" className={input} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-ink">Recettes à inclure</legend>
        {recettes.map((recette) => (
          <label key={recette.id} className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="recette_id" value={recette.id} className="h-4 w-4 accent-kcal" />
            {recette.nom}
          </label>
        ))}
      </fieldset>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Génération..." : "Générer la liste"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={secondaryButton}>
          Annuler
        </button>
      </div>
    </form>
  );
}
