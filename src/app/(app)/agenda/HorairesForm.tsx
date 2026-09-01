"use client";

import { useActionState, useState } from "react";
import { updateHorairesTravail, type HoraireFormState } from "@/app/actions/horaires";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, primaryButton } from "@/lib/ui";

const initialState: HoraireFormState = { error: null };

// jour_semaine suit date-fns getDay() (0 = dimanche ... 6 = samedi) ; ordre
// d'affichage lundi → dimanche pour rester cohérent avec le reste de
// l'Agenda (weekStartsOn: 1).
const JOURS_AFFICHAGE: { jour_semaine: number; label: string }[] = [
  { jour_semaine: 1, label: "Lundi" },
  { jour_semaine: 2, label: "Mardi" },
  { jour_semaine: 3, label: "Mercredi" },
  { jour_semaine: 4, label: "Jeudi" },
  { jour_semaine: 5, label: "Vendredi" },
  { jour_semaine: 6, label: "Samedi" },
  { jour_semaine: 0, label: "Dimanche" },
];

function JourRow({ jour, horaire }: { jour: { jour_semaine: number; label: string }; horaire?: Tables<"horaires_travail"> }) {
  const [nonTravaille, setNonTravaille] = useState(!horaire?.heure_debut && !horaire?.heure_fin);

  return (
    <div className="flex flex-col gap-1.5 border-b border-line pb-2.5 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{jour.label}</span>
        <label className="flex items-center gap-1.5 text-xs font-medium text-ink-2">
          <input
            type="checkbox"
            name={`non_travaille_${jour.jour_semaine}`}
            checked={nonTravaille}
            onChange={(e) => setNonTravaille(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-line"
          />
          Non travaillé
        </label>
      </div>
      {!nonTravaille && (
        <div className="flex items-center gap-2">
          <input
            type="time"
            name={`heure_debut_${jour.jour_semaine}`}
            defaultValue={horaire?.heure_debut?.slice(0, 5) ?? ""}
            className={`${input} flex-1`}
          />
          <span className="text-ink-2">–</span>
          <input
            type="time"
            name={`heure_fin_${jour.jour_semaine}`}
            defaultValue={horaire?.heure_fin?.slice(0, 5) ?? ""}
            className={`${input} flex-1`}
          />
        </div>
      )}
    </div>
  );
}

export function HorairesForm({
  horaires,
  onDone,
}: {
  horaires: Tables<"horaires_travail">[];
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(async (prev: HoraireFormState, formData: FormData) => {
    const result = await updateHorairesTravail(prev, formData);
    if (!result.error) onDone?.();
    return result;
  }, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <p className="text-xs text-ink-2">
        Configure tes heures de travail par jour : elles s&apos;affichent en fond des vues Semaine et
        Jour de l&apos;Agenda.
      </p>

      <div className="flex flex-col gap-2.5">
        {JOURS_AFFICHAGE.map((jour) => (
          <JourRow
            key={jour.jour_semaine}
            jour={jour}
            horaire={horaires.find((h) => h.jour_semaine === jour.jour_semaine)}
          />
        ))}
      </div>

      <div
        className="sticky bottom-0 z-10 flex flex-col items-center gap-2 pt-3"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
      >
        {state.error && (
          <p className={`${errorText} rounded-xl bg-surface px-3 py-1.5 shadow-card`} role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className={`${primaryButton} shadow-card`}>
          {pending ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
