"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createTache,
  updateTache,
  type TacheAvecRelations,
  type TacheFormState,
} from "@/app/actions/taches";
import type { Enums, Tables } from "@/lib/supabase/types";
import { FREQUENCE_LABELS } from "@/lib/budget/compute";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: TacheFormState = { error: null };
const FREQUENCES = Object.keys(FREQUENCE_LABELS) as Enums<"frequence_recurrence">[];

const PRIORITES: { value: Enums<"priorite_tache">; label: string; activeClassName: string }[] = [
  { value: "aucune", label: "Aucune", activeClassName: "bg-ink-3 text-white" },
  { value: "basse", label: "Basse", activeClassName: "bg-agenda text-white" },
  { value: "moyenne", label: "Moyenne", activeClassName: "bg-carbs text-white" },
  { value: "haute", label: "Haute", activeClassName: "bg-alert text-white" },
];

export function AddTaskForm({
  tache,
  listes,
  tags,
  defaultListeId,
  defaultEcheance,
  defaultHeure,
  onDone,
}: {
  tache?: TacheAvecRelations;
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  defaultListeId?: string;
  defaultEcheance?: string;
  defaultHeure?: string;
  onDone?: () => void;
}) {
  const action = tache ? updateTache : createTache;
  const [state, formAction, pending] = useActionState(action, initialState);
  const prevPending = useRef(pending);

  const [priorite, setPriorite] = useState<Enums<"priorite_tache">>(tache?.priorite ?? "aucune");
  const [frequence, setFrequence] = useState<string>(tache?.recurrence_frequence ?? "");
  const [tagIds, setTagIds] = useState<string[]>(tache?.tags.map((t) => t.id) ?? []);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  function toggleTag(id: string) {
    setTagIds((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]));
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {tache && <input type="hidden" name="id" value={tache.id} />}
      {tagIds.map((id) => (
        <input key={id} type="hidden" name="tag_ids" value={id} />
      ))}
      <input type="hidden" name="priorite" value={priorite} />

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className={labelClass}>
          Titre
        </label>
        <input id="titre" name="titre" required defaultValue={tache?.titre} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="liste_id" className={labelClass}>
          Liste
        </label>
        <select
          id="liste_id"
          name="liste_id"
          defaultValue={tache?.liste_id ?? defaultListeId ?? listes[0]?.id ?? ""}
          className={input}
        >
          {listes.map((liste) => (
            <option key={liste.id} value={liste.id}>
              {liste.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <span className={labelClass}>Priorité</span>
        <div className="flex rounded-xl border border-line p-1">
          {PRIORITES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPriorite(p.value)}
              className={`flex-1 rounded-lg py-1.5 text-[12.5px] font-semibold transition-colors ${
                priorite === p.value ? p.activeClassName : "text-ink-2"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="echeance" className={labelClass}>
          Échéance (optionnel)
        </label>
        <input
          id="echeance"
          name="echeance"
          type="date"
          defaultValue={tache?.echeance ?? defaultEcheance ?? ""}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="heure" className={labelClass}>
          Heure (optionnel)
        </label>
        <input
          id="heure"
          name="heure"
          type="time"
          defaultValue={tache?.heure?.slice(0, 5) ?? defaultHeure ?? ""}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClass}>
          Notes (optionnel)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={tache?.notes ?? ""}
          className={input}
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className={labelClass}>Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                  tagIds.includes(tag.id) ? "bg-kcal text-white" : "bg-surface-alt text-ink-2"
                }`}
              >
                #{tag.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="nouveaux_tags" className={labelClass}>
          Nouveaux tags (optionnel, séparés par une virgule)
        </label>
        <input id="nouveaux_tags" name="nouveaux_tags" placeholder="urgent, maison" className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="recurrence_frequence" className={labelClass}>
          Récurrence (optionnel)
        </label>
        <select
          id="recurrence_frequence"
          name="recurrence_frequence"
          value={frequence}
          onChange={(e) => setFrequence(e.target.value)}
          className={input}
        >
          <option value="">Aucune récurrence</option>
          {FREQUENCES.map((f) => (
            <option key={f} value={f}>
              {FREQUENCE_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {frequence && (
        <div className="flex flex-col gap-1">
          <label htmlFor="recurrence_fin" className={labelClass}>
            Fin de la récurrence (optionnel)
          </label>
          <input
            id="recurrence_fin"
            name="recurrence_fin"
            type="date"
            defaultValue={tache?.recurrence_fin ?? ""}
            className={input}
          />
        </div>
      )}

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
          {pending ? "Enregistrement..." : tache ? "Enregistrer" : "Créer"}
        </button>
      </div>
    </form>
  );
}
