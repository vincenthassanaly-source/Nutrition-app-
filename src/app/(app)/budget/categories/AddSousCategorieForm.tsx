"use client";

import { useActionState, useEffect, useRef } from "react";
import { creerSousCategorie, type CategorieFormState } from "@/app/actions/categories-budget";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: CategorieFormState = { error: null };

export function AddSousCategorieForm({
  categorieParentId,
  onDone,
}: {
  categorieParentId: string;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(creerSousCategorie, initialState);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <input type="hidden" name="categorie_parent_id" value={categorieParentId} />

      <div className="flex flex-col gap-1">
        <label htmlFor={`sous-nom-${categorieParentId}`} className={labelClass}>
          Nom de la sous-catégorie
        </label>
        <input id={`sous-nom-${categorieParentId}`} name="nom" required className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`sous-icone-${categorieParentId}`} className={labelClass}>
          Icône (optionnel, un emoji)
        </label>
        <input id={`sous-icone-${categorieParentId}`} name="icone" placeholder="🎯" className={input} />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : "Ajouter la sous-catégorie"}
      </button>
    </form>
  );
}
