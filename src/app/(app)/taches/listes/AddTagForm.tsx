"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTag, type TagFormState } from "@/app/actions/taches";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: TagFormState = { error: null };

export function AddTagForm({ onDone }: { onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(createTag, initialState);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" name="nom" required className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="couleur" className={labelClass}>
          Couleur (optionnel)
        </label>
        <input
          id="couleur"
          name="couleur"
          type="color"
          defaultValue="#4f7cff"
          className="h-10 w-16 rounded-lg border border-line bg-surface p-1"
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : "Créer le tag"}
      </button>
    </form>
  );
}
