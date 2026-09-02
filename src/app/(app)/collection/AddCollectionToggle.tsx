"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createCollection, type CollectionFormState } from "@/app/actions/collections";
import { useBackClose } from "@/hooks/useBackClose";
import { card, dashedAddButton, errorText, input, primaryButton } from "@/lib/ui";

const initialState: CollectionFormState = { error: null };

export function AddCollectionToggle() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCollection, initialState);
  const prevPending = useRef(pending);
  useBackClose(open, () => setOpen(false));

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      setOpen(false);
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Nouvelle collection
      </button>
    );
  }

  return (
    <form action={formAction} className={`${card} flex flex-col gap-3`}>
      <input name="nom" autoFocus required placeholder="Nom de la collection" className={input} />

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Création..." : "Créer"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-sm text-ink-2 underline">
          Annuler
        </button>
      </div>
    </form>
  );
}
