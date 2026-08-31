"use client";

import { useTransition } from "react";
import {
  basculerActive,
  supprimerRecurrence,
  type RecurrenceAvecRelations,
} from "@/app/actions/transactions-recurrentes";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { FREQUENCE_LABELS, formatMontant } from "@/lib/budget/compute";
import { card, dangerButton, ghostButton, listCard, metaText, pillTag } from "@/lib/ui";
import { RecurrenceModeForm } from "./RecurrenceModeForm";
import { useBackCloseToggle } from "@/hooks/useBackClose";

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RecurrenceRow({
  recurrence,
  comptes,
  categories,
}: {
  recurrence: RecurrenceAvecRelations;
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  const [editing, edit] = useBackCloseToggle();
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <RecurrenceModeForm
          recurrence={recurrence}
          comptes={comptes}
          categories={categories}
          onDone={() => history.back()}
        />
        <button
          type="button"
          onClick={() => history.back()}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  const virement = recurrence.type === "virement";
  const revenu = recurrence.type === "revenu";
  const titre = virement
    ? recurrence.libelle || `${recurrence.compte?.nom ?? "?"} → ${recurrence.compte_destination?.nom ?? "?"}`
    : recurrence.libelle || recurrence.categorie?.nom || "Sans catégorie";

  return (
    <li className={`${listCard} ${recurrence.active ? "" : "opacity-60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-[14.5px] font-semibold text-ink">
            {virement ? (
              <span className="mr-1.5">⇄</span>
            ) : (
              recurrence.categorie?.icone && <span className="mr-1.5">{recurrence.categorie.icone}</span>
            )}
            {titre}
            {!recurrence.active && <span className={`${pillTag} ml-2`}>En pause</span>}
          </p>
          <span className={metaText}>
            {FREQUENCE_LABELS[recurrence.frequence]} · {recurrence.compte?.nom ?? "?"} · prochaine échéance{" "}
            {formatDate(recurrence.prochaine_occurrence)}
            {recurrence.date_fin && ` · jusqu'au ${formatDate(recurrence.date_fin)}`}
          </span>
        </div>
        <p
          className={`font-display text-[15px] font-semibold ${
            virement ? "text-ink-2" : revenu ? "text-kcal" : "text-ink"
          }`}
        >
          {virement ? "" : revenu ? "+" : "-"}
          {formatMontant(recurrence.montant)}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => basculerActive(recurrence.id, !recurrence.active))
          }
          className={ghostButton}
        >
          {recurrence.active ? "Mettre en pause" : "Reprendre"}
        </button>
        <button type="button" onClick={edit} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => supprimerRecurrence(recurrence.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}

export function RecurrencesList({
  recurrences,
  comptes,
  categories,
}: {
  recurrences: RecurrenceAvecRelations[];
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  if (recurrences.length === 0) {
    return <p className="text-ink-2">Aucune transaction récurrente pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {recurrences.map((recurrence) => (
        <RecurrenceRow
          key={recurrence.id}
          recurrence={recurrence}
          comptes={comptes}
          categories={categories}
        />
      ))}
    </ul>
  );
}
