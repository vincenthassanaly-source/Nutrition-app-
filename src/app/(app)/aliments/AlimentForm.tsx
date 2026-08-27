"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createAliment,
  updateAliment,
  type AlimentFormState,
} from "@/app/actions/aliments";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

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
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" name="nom" required defaultValue={aliment?.nom} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categorie" className={labelClass}>
          Catégorie
        </label>
        <input id="categorie" name="categorie" defaultValue={aliment?.categorie ?? ""} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unite" className={labelClass}>
          Unité
        </label>
        <select id="unite" name="unite" defaultValue={aliment?.unite ?? "g"} className={input}>
          <option value="g">grammes (g)</option>
          <option value="ml">millilitres (ml)</option>
          <option value="piece">pièce</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="kcal_100g" className={labelClass}>
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
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="proteines_100g" className={labelClass}>
            Protéines (g)
          </label>
          <input
            id="proteines_100g"
            name="proteines_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.proteines_100g ?? 0}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="glucides_100g" className={labelClass}>
            Glucides (g)
          </label>
          <input
            id="glucides_100g"
            name="glucides_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.glucides_100g ?? 0}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lipides_100g" className={labelClass}>
            Lipides (g)
          </label>
          <input
            id="lipides_100g"
            name="lipides_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.lipides_100g ?? 0}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sucres_100g" className={labelClass}>
            dont sucres (g)
          </label>
          <input
            id="sucres_100g"
            name="sucres_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.sucres_100g ?? ""}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="acides_gras_satures_100g" className={labelClass}>
            dont acides gras saturés (g)
          </label>
          <input
            id="acides_gras_satures_100g"
            name="acides_gras_satures_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.acides_gras_satures_100g ?? ""}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="fibres_100g" className={labelClass}>
            Fibres (g)
          </label>
          <input
            id="fibres_100g"
            name="fibres_100g"
            type="number"
            step="0.1"
            min="0"
            defaultValue={aliment?.fibres_100g ?? ""}
            className={input}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="sel_100g" className={labelClass}>
            Sel (g)
          </label>
          <input
            id="sel_100g"
            name="sel_100g"
            type="number"
            step="0.01"
            min="0"
            defaultValue={aliment?.sel_100g ?? ""}
            className={input}
          />
        </div>
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : aliment ? "Enregistrer" : "Ajouter l'aliment"}
      </button>
    </form>
  );
}
