"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createAliment,
  updateAliment,
  type AlimentFormState,
} from "@/app/actions/aliments";
import type { Tables } from "@/lib/supabase/types";

const initialState: AlimentFormState = { error: null };

export function AlimentForm({
  aliment,
  onDone,
}: {
  aliment?: Tables<"aliments">;
  onDone?: () => void;
}) {
  const action = aliment ? updateAliment : createAliment;
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3">
      {aliment && <input type="hidden" name="id" value={aliment.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className="text-sm font-medium">
          Nom
        </label>
        <input
          id="nom"
          name="nom"
          required
          defaultValue={aliment?.nom}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categorie" className="text-sm font-medium">
          Catégorie
        </label>
        <input
          id="categorie"
          name="categorie"
          defaultValue={aliment?.categorie ?? ""}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unite" className="text-sm font-medium">
          Unité
        </label>
        <select
          id="unite"
          name="unite"
          defaultValue={aliment?.unite ?? "g"}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          <option value="g">grammes (g)</option>
          <option value="ml">millilitres (ml)</option>
          <option value="piece">pièce</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="kcal_100g" className="text-sm font-medium">
            Kcal / 100{aliment?.unite === "piece" ? " pièce" : ""}
          </label>
          <input
            id="kcal_100g"
            name="kcal_100g"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={aliment?.kcal_100g}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="proteines_100g" className="text-sm font-medium">
            Protéines (g)
          </label>
          <input
            id="proteines_100g"
            name="proteines_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.proteines_100g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="glucides_100g" className="text-sm font-medium">
            Glucides (g)
          </label>
          <input
            id="glucides_100g"
            name="glucides_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.glucides_100g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lipides_100g" className="text-sm font-medium">
            Lipides (g)
          </label>
          <input
            id="lipides_100g"
            name="lipides_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.lipides_100g ?? 0}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-700 px-4 py-2.5 text-white font-medium disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : aliment ? "Enregistrer" : "Ajouter l'aliment"}
      </button>
    </form>
  );
}
