"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addJournalEntry, type JournalFormState } from "@/app/actions/journal";
import type { Tables } from "@/lib/supabase/types";

const initialState: JournalFormState = { error: null };

const MOMENTS: { value: string; label: string }[] = [
  { value: "petit_dej", label: "Petit-déj" },
  { value: "dejeuner", label: "Déjeuner" },
  { value: "diner", label: "Dîner" },
  { value: "collation", label: "Collation" },
];

export function AddJournalEntryForm({
  date,
  aliments,
  recettes,
}: {
  date: string;
  aliments: Tables<"aliments">[];
  recettes: Tables<"recettes">[];
}) {
  const [type, setType] = useState<"aliment" | "recette">("aliment");
  const [state, formAction, pending] = useActionState(addJournalEntry, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  const options = type === "aliment" ? aliments : recettes;

  if (aliments.length === 0 && recettes.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Ajoute des aliments ou des recettes pour pouvoir remplir ton journal.
      </p>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-3"
    >
      <input type="hidden" name="date" value={date} />

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="type"
            value="aliment"
            checked={type === "aliment"}
            onChange={() => setType("aliment")}
          />
          Aliment
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="type"
            value="recette"
            checked={type === "recette"}
            onChange={() => setType("recette")}
          />
          Recette
        </label>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aucun{type === "recette" ? "e recette" : " aliment"} disponible.
        </p>
      ) : (
        <select
          name={type === "aliment" ? "aliment_id" : "recette_id"}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="quantite" className="text-sm font-medium">
            {type === "aliment" ? "Quantité" : "Portions"}
          </label>
          <input
            id="quantite"
            name="quantite"
            type="number"
            step="0.1"
            min="0"
            required
            placeholder={type === "aliment" ? "ex : 150" : "ex : 1"}
            className="rounded-lg border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="moment" className="text-sm font-medium">
            Moment
          </label>
          <select
            id="moment"
            name="moment"
            className="rounded-lg border border-neutral-300 px-3 py-2"
          >
            {MOMENTS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || options.length === 0}
        className="rounded-lg bg-green-700 px-4 py-2.5 text-white font-medium disabled:opacity-60"
      >
        {pending ? "Ajout..." : "+ Ajouter au journal"}
      </button>
    </form>
  );
}
