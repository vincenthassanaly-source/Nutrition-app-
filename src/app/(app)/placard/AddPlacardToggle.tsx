"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { upsertPlacardItem, type PlacardFormState } from "@/app/actions/placard";
import type { Tables } from "@/lib/supabase/types";
import { card, dashedAddButton, errorText, input, label as labelClass, primaryButton, secondaryButton } from "@/lib/ui";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

const initialState: PlacardFormState = { error: null };

export function AddPlacardToggle({ aliments }: { aliments: Tables<"aliments">[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(upsertPlacardItem, initialState);
  const [alimentId, setAlimentId] = useState(aliments[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setOpen(false);
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={dashedAddButton}>
        + Ajouter au placard
      </button>
    );
  }

  if (aliments.length === 0) {
    return (
      <div className={card}>
        <p className="text-sm text-ink-2">Ajoute d&apos;abord des aliments dans l&apos;onglet Aliments.</p>
        <button type="button" onClick={() => setOpen(false)} className="mt-2 text-sm text-ink-2 underline">
          Fermer
        </button>
      </div>
    );
  }

  const selected = aliments.find((a) => a.id === alimentId) ?? aliments[0];

  return (
    <form ref={formRef} action={formAction} className={`${card} flex flex-col gap-3`}>
      <div className="flex flex-col gap-1">
        <label htmlFor="aliment_id" className={labelClass}>
          Aliment
        </label>
        <select
          id="aliment_id"
          name="aliment_id"
          value={alimentId}
          onChange={(e) => setAlimentId(e.target.value)}
          className={input}
        >
          {aliments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantite_disponible" className={labelClass}>
          Quantité disponible ({UNITE_LABEL[selected.unite]})
        </label>
        <input
          id="quantite_disponible"
          name="quantite_disponible"
          type="number"
          step="0.1"
          min="0"
          required
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date_peremption" className={labelClass}>
          Date de péremption (optionnel)
        </label>
        <input id="date_peremption" name="date_peremption" type="date" className={input} />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={primaryButton}>
          {pending ? "Enregistrement..." : "Ajouter / mettre à jour"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={secondaryButton}>
          Annuler
        </button>
      </div>
    </form>
  );
}
