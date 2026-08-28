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
  const [alimentId, setAlimentId] = useState<string>(aliments[0]?.id ?? "");
  const [saisieMode, setSaisieMode] = useState<"grammes" | "piece">("grammes");
  const [quantiteSaisie, setQuantiteSaisie] = useState<string>("");
  const [state, formAction, pending] = useActionState(addJournalEntry, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setSaisieMode("grammes");
      setQuantiteSaisie("");
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  const options = type === "aliment" ? aliments : recettes;
  const alimentSelectionne = type === "aliment" ? aliments.find((a) => a.id === alimentId) : undefined;
  const poidsUnite = alimentSelectionne?.poids_unite_g ?? null;
  const showPieceToggle = type === "aliment" && poidsUnite !== null;
  const modeEffectif = showPieceToggle ? saisieMode : "grammes";
  const quantiteNombre = Number(quantiteSaisie);
  const poidsEstime =
    modeEffectif === "piece" && poidsUnite !== null && Number.isFinite(quantiteNombre) && quantiteNombre > 0
      ? Math.round(quantiteNombre * poidsUnite)
      : null;

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
              onChange={() => {
                setType(t);
                setSaisieMode("grammes");
                if (t === "aliment") setAlimentId(aliments[0]?.id ?? "");
              }}
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
        <select
          key={type}
          name={type === "aliment" ? "aliment_id" : "recette_id"}
          className={input}
          defaultValue={options[0]?.id}
          onChange={type === "aliment" ? (e) => setAlimentId(e.target.value) : undefined}
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nom}
            </option>
          ))}
        </select>
      )}

      {showPieceToggle && (
        <>
          <input type="hidden" name="saisie_mode" value={saisieMode} />
          <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
            {(["grammes", "piece"] as const).map((m) => (
              <label
                key={m}
                className="flex-1 cursor-pointer rounded-lg py-2 text-center text-[13.5px] font-semibold transition-colors"
                style={
                  saisieMode === m
                    ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px oklch(0.2 0.02 255 / 0.1)" }
                    : { color: "var(--ink-2)" }
                }
              >
                <input
                  type="radio"
                  name="saisie_mode_radio"
                  value={m}
                  checked={saisieMode === m}
                  onChange={() => setSaisieMode(m)}
                  className="sr-only"
                />
                {m === "grammes" ? "Grammes" : "Pièce(s)"}
              </label>
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="quantite" className={labelClass}>
            {type === "recette" ? "Portions" : modeEffectif === "piece" ? "Quantité (en pièces)" : "Quantité"}
          </label>
          <input
            id="quantite"
            name="quantite"
            type="number"
            step="0.1"
            min="0"
            required
            value={quantiteSaisie}
            onChange={(e) => setQuantiteSaisie(e.target.value)}
            placeholder={type === "recette" ? "ex : 1" : modeEffectif === "piece" ? "ex: 1" : "ex : 150"}
            className={input}
          />
          {modeEffectif === "piece" && (
            <p className="text-xs text-ink-2">{poidsEstime !== null ? `≈ ${poidsEstime}g` : ""}</p>
          )}
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
