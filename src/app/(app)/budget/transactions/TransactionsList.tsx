"use client";

import { useState, useTransition } from "react";
import { supprimerTransaction, type TransactionAvecRelations } from "@/app/actions/transactions";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { formatMontant } from "@/lib/budget/compute";
import { card, dangerButton, ghostButton, listCard, metaText } from "@/lib/ui";
import { TransactionForm } from "./TransactionForm";

function formatDateOperation(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function TransactionRow({
  transaction,
  comptes,
  categories,
}: {
  transaction: TransactionAvecRelations;
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <TransactionForm
          transaction={transaction}
          comptes={comptes}
          categories={categories}
          onDone={() => setEditing(false)}
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  const revenu = transaction.type === "revenu";

  return (
    <li className={listCard}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-[14.5px] font-semibold text-ink">
            {transaction.categorie?.icone && <span className="mr-1.5">{transaction.categorie.icone}</span>}
            {transaction.libelle || transaction.categorie?.nom || "Sans catégorie"}
          </p>
          <span className={metaText}>
            {formatDateOperation(transaction.date_operation)} · {transaction.compte?.nom ?? "?"}
            {transaction.libelle && transaction.categorie && ` · ${transaction.categorie.nom}`}
          </span>
        </div>
        <p className={`font-display text-[15px] font-semibold ${revenu ? "text-kcal" : "text-ink"}`}>
          {revenu ? "+" : "-"}
          {formatMontant(transaction.montant)}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => supprimerTransaction(transaction.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}

export function TransactionsList({
  transactions,
  comptes,
  categories,
}: {
  transactions: TransactionAvecRelations[];
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  if (transactions.length === 0) {
    return <p className="text-ink-2">Aucune transaction pour cette sélection.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {transactions.map((transaction) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          comptes={comptes}
          categories={categories}
        />
      ))}
    </ul>
  );
}
