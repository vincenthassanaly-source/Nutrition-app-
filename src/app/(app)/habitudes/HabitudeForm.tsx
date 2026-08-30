"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { creerHabitude, modifierHabitude, type HabitudeFormState } from "@/app/actions/habitudes";
import type { Enums, Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: HabitudeFormState = { error: null };

const TYPE_LABELS: Record<Enums<"habitude_type">, string> = {
  boolean: "Fait / pas fait",
  streak: "Série (jours consécutifs)",
  quantifiee: "Quantifiée",
};

export function HabitudeForm({
  habitude,
  onDone,
}: {
  habitude?: Tables<"habitudes">;
  onDone?: () => void;
}) {
  const action = habitude ? modifierHabitude : creerHabitude;
  const [state, formAction, pending] = useActionState(action, initialState);
  const prevPending = useRef(pending);
  const [type, setType] = useState<Enums<"habitude_type">>(habitude?.type ?? "boolean");

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {habitude && <input type="hidden" name="id" value={habitude.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" name="nom" required defaultValue={habitude?.nom} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="type" className={labelClass}>
          Type
        </label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as Enums<"habitude_type">)}
          className={input}
        >
          {(Object.keys(TYPE_LABELS) as Enums<"habitude_type">[]).map((key) => (
            <option key={key} value={key}>
              {TYPE_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      {type === "quantifiee" && (
        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="unite" className={labelClass}>
              Unité
            </label>
            <input
              id="unite"
              name="unite"
              placeholder="verres, min…"
              defaultValue={habitude?.unite ?? ""}
              className={input}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="valeur_cible" className={labelClass}>
              Objectif (optionnel)
            </label>
            <input
              id="valeur_cible"
              name="valeur_cible"
              type="number"
              min="0"
              step="any"
              defaultValue={habitude?.valeur_cible ?? ""}
              className={input}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="icone" className={labelClass}>
          Icône (optionnel)
        </label>
        <input
          id="icone"
          name="icone"
          placeholder="🏃"
          defaultValue={habitude?.icone ?? ""}
          className={input}
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : habitude ? "Enregistrer" : "Créer l'habitude"}
      </button>
    </form>
  );
}
