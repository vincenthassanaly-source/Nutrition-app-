"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { addJournalEntry, type JournalFormState } from "@/app/actions/journal";
import type { Tables } from "@/lib/supabase/types";
import { card, errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

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
      <p className="text-sm text-ink-2">
        Ajoute des aliments ou des recettes pour pouvoir remplir ton journal.
      </p>
    );
  }

  return (
    <form ref={formRef} action={formAction} className={`${card} flex flex-col gap-3`}>
      <input type="hidden" name="date" value={date} />

      <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
        {(["aliment", "recette"] as const).map((t) => (
          <label
            key={t}
            className="flex-1 cursor-pointer rounded-lg py-2 text-center text-[13.5px] font-semibold transition-colors"
            style={
              type === t
                ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px oklch(0.2 0.02 255 / 0.1)" }
                : { color: "var(--ink-2)" }
            }
          >
            <input
              type="radio"
              name="type"
              value={t}
              checked={type === t}
              onChange={() => setType(t)}
              className="sr-only"
            />
            {t === "aliment" ? "Aliment" : "Recette"}
          </label>
        ))}
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-ink-2">
          Aucun{type === "recette" ? "e recette" : " aliment"} disponible.
        </p>
      ) : (
        <select name={type === "aliment" ? "aliment_id" : "recette_id"} className={input}>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
            </option>
          ))}
        </select>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="quantite" className={labelClass}>
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
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="moment" className={labelClass}>
            Moment
          </label>
          <select id="moment" name="moment" className={input}>
            {MOMENTS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending || options.length === 0} className={primaryButton}>
        {pending ? "Ajout..." : "+ Ajouter au journal"}
      </button>
    </form>
  );
}
