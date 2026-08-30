"use client";

import { useActionState, useEffect, useRef } from "react";
import { creerCategorie, type CategorieFormState } from "@/app/actions/categories-budget";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: CategorieFormState = { error: null };

export function AddCategorieForm({ onDone }: { onDone?: () => void }) {
  const [state, formAction, pending] = useActionState(creerCategorie, initialState);
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
        <label htmlFor="type" className={labelClass}>
          Type
        </label>
        <select id="type" name="type" defaultValue="depense" className={input}>
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="icone" className={labelClass}>
          Icône (optionnel, un emoji)
        </label>
        <input id="icone" name="icone" placeholder="🎯" className={input} />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : "Créer la catégorie"}
      </button>
    </form>
  );
}
