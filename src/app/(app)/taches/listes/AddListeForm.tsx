"use client";

import { useActionState, useEffect, useRef } from "react";
import { createListe, updateListe, type ListeFormState } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: ListeFormState = { error: null };

export function AddListeForm({
  liste,
  onDone,
}: {
  liste?: Tables<"listes_taches">;
  onDone?: () => void;
}) {
  const action = liste ? updateListe : createListe;
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
      {liste && <input type="hidden" name="id" value={liste.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" name="nom" required defaultValue={liste?.nom} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="couleur" className={labelClass}>
          Couleur (optionnel)
        </label>
        <input
          id="couleur"
          name="couleur"
          type="color"
          defaultValue={liste?.couleur ?? "#4f7cff"}
          className="h-10 w-16 rounded-lg border border-line bg-surface p-1"
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : liste ? "Enregistrer" : "Créer la liste"}
      </button>
    </form>
  );
}
