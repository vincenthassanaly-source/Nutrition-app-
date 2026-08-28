"use client";

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addJournalEntryLibre, type JournalFormState } from "@/app/actions/journal";
import { estimateRepasLibre, type EstimationRepas } from "@/app/actions/journal-ia";
import { card, errorText, input, label as labelClass, primaryButton, secondaryButton } from "@/lib/ui";

const initialState: JournalFormState = { error: null };

const MOMENTS: { value: string; label: string }[] = [
  { value: "petit_dej", label: "Petit-déj" },
  { value: "dejeuner", label: "Déjeuner" },
  { value: "diner", label: "Dîner" },
  { value: "collation", label: "Collation" },
];

const MACRO_FIELDS: { key: keyof Omit<EstimationRepas, "note">; label: string; step: string }[] = [
  { key: "kcal", label: "Kcal", step: "1" },
  { key: "proteines_g", label: "Protéines (g)", step: "0.1" },
  { key: "glucides_g", label: "Glucides (g)", step: "0.1" },
  { key: "lipides_g", label: "Lipides (g)", step: "0.1" },
];

export function AddJournalEntryLibreForm({ date }: { date: string }) {
  const [description, setDescription] = useState("");
  const [isEstimating, startEstimating] = useTransition();
  const [estimationError, setEstimationError] = useState<string | null>(null);
  const [original, setOriginal] = useState<EstimationRepas | null>(null);
  const [values, setValues] = useState<Omit<EstimationRepas, "note"> | null>(null);
  const [moment, setMoment] = useState("petit_dej");

  const [state, formAction, pending] = useActionState(addJournalEntryLibre, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
      setDescription("");
      setOriginal(null);
      setValues(null);
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  const source = useMemo(() => {
    if (!original || !values) return "manuel";
    const edited =
      values.kcal !== original.kcal ||
      values.proteines_g !== original.proteines_g ||
      values.glucides_g !== original.glucides_g ||
      values.lipides_g !== original.lipides_g;
    return edited ? "manuel" : "ia";
  }, [original, values]);

  function handleEstimer() {
    setEstimationError(null);
    startEstimating(async () => {
      const result = await estimateRepasLibre(description);
      if (!result.ok) {
        setEstimationError(result.error);
        return;
      }
      const { kcal, proteines_g, glucides_g, lipides_g } = result.data;
      setOriginal(result.data);
      setValues({ kcal, proteines_g, glucides_g, lipides_g });
    });
  }

  function handleRecommencer() {
    setOriginal(null);
    setValues(null);
    setEstimationError(null);
  }

  return (
    <div className={`${card} flex flex-col gap-3`}>
      <div className="flex flex-col gap-1">
        <label htmlFor="description_libre" className={labelClass}>
          Décris ton repas
        </label>
        <textarea
          id="description_libre"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={values !== null}
          rows={2}
          placeholder="ex : riz + poulet + avocat"
          className={`${input} resize-none disabled:opacity-60`}
        />
      </div>

      {estimationError && (
        <p className={errorText} role="alert">
          {estimationError}
        </p>
      )}

      {values === null ? (
        <button
          type="button"
          disabled={isEstimating || !description.trim()}
          onClick={handleEstimer}
          className={primaryButton}
        >
          {isEstimating ? "Estimation en cours..." : "Estimer avec l'IA"}
        </button>
      ) : (
        <form ref={formRef} action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="description" value={description} />
          <input type="hidden" name="source" value={source} />

          {original && (
            <p className="rounded-xl bg-surface-alt px-3 py-2 text-xs text-ink-2">{original.note}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {MACRO_FIELDS.map((f) => (
              <div key={f.key} className="flex flex-col gap-1">
                <label htmlFor={f.key} className={labelClass}>
                  {f.label}
                </label>
                <input
                  id={f.key}
                  name={f.key}
                  type="number"
                  step={f.step}
                  min="0"
                  required
                  value={values[f.key]}
                  onChange={(e) =>
                    setValues((v) => (v ? { ...v, [f.key]: Number(e.target.value) } : v))
                  }
                  className={input}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="moment_libre" className={labelClass}>
              Moment
            </label>
            <select
              id="moment_libre"
              name="moment"
              value={moment}
              onChange={(e) => setMoment(e.target.value)}
              className={input}
            >
              {MOMENTS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {state.error && (
            <p className={errorText} role="alert">
              {state.error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRecommencer}
              disabled={pending}
              className={secondaryButton}
            >
              Recommencer
            </button>
            <button type="submit" disabled={pending} className={`${primaryButton} flex-1`}>
              {pending ? "Enregistrement..." : "Valider et enregistrer"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
