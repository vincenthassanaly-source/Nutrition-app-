"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { upsertPlacardItem, type PlacardFormState } from "@/app/actions/placard";
import type { Tables } from "@/lib/supabase/types";

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-green-700 py-2.5 text-green-700 font-medium"
      >
        + Ajouter au placard
      </button>
    );
  }

  if (aliments.length === 0) {
    return (
      <div className="rounded-lg border border-neutral-200 p-3">
        <p className="text-sm text-neutral-500">
          Ajoute d&apos;abord des aliments dans l&apos;onglet Aliments.
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

  const selected = aliments.find((a) => a.id === alimentId) ?? aliments[0];

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="aliment_id" className="text-sm font-medium">
          Aliment
        </label>
        <select
          id="aliment_id"
          name="aliment_id"
          value={alimentId}
          onChange={(e) => setAlimentId(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          {aliments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="quantite_disponible" className="text-sm font-medium">
          Quantité disponible ({UNITE_LABEL[selected.unite]})
        </label>
        <input
          id="quantite_disponible"
          name="quantite_disponible"
          type="number"
          step="0.1"
          min="0"
          required
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date_peremption" className="text-sm font-medium">
          Date de péremption (optionnel)
        </label>
        <input
          id="date_peremption"
          name="date_peremption"
          type="date"
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
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
          className="rounded-lg bg-green-700 px-4 py-2.5 text-white font-medium disabled:opacity-60"
        >
          {pending ? "Enregistrement..." : "Ajouter / mettre à jour"}
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
