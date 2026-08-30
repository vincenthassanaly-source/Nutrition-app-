"use client";

import { useActionState } from "react";
import { upsertBudget, type BudgetFormState, type SuiviCategorie } from "@/app/actions/budgets";
import { formatMontant } from "@/lib/budget/compute";
import { card, errorText, input } from "@/lib/ui";
import type { StatutBudget } from "@/lib/budget/compute";

const STATUT_COLOR: Record<StatutBudget, string> = {
  ok: "var(--accent-kcal)",
  proche: "var(--accent-carbs)",
  depasse: "var(--accent-alert)",
};

const initialState: BudgetFormState = { error: null };

export function CategorieProgressCard({
  suivi,
  periode,
}: {
  suivi: SuiviCategorie;
  periode: string;
}) {
  const [state, formAction, pending] = useActionState(upsertBudget, initialState);
  const pct =
    suivi.cible > 0
      ? Math.min(100, Math.round((suivi.consomme / suivi.cible) * 100))
      : suivi.consomme > 0
        ? 100
        : 0;
  const color = STATUT_COLOR[suivi.statut];

  return (
    <li className={`${card} flex flex-col gap-2.5`}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[14.5px] font-semibold text-ink">
          {suivi.categorie.icone && <span>{suivi.categorie.icone}</span>}
          {suivi.categorie.nom}
        </p>
        <span className={`text-[12.5px] font-mono ${suivi.statut === "depasse" ? "text-alert" : "text-ink-2"}`}>
          {formatMontant(suivi.consomme)}
          {suivi.cible > 0 && ` / ${formatMontant(suivi.cible)}`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <form action={formAction} className="flex items-center gap-2">
        <input type="hidden" name="categorie_id" value={suivi.categorie.id} />
        <input type="hidden" name="periode" value={periode} />
        <input
          name="montant_cible"
          type="number"
          step="0.01"
          min="0"
          defaultValue={suivi.cible || undefined}
          placeholder="Budget cible du mois"
          className={`${input} flex-1 py-1.5 text-[13px]`}
        />
        <button type="submit" disabled={pending} className="shrink-0 text-sm font-semibold text-budget">
          {pending ? "..." : "Définir"}
        </button>
      </form>
      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}
    </li>
  );
}
