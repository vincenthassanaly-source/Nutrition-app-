"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  creerTransaction,
  modifierTransaction,
  type TransactionAvecRelations,
  type TransactionFormState,
} from "@/app/actions/transactions";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: TransactionFormState = { error: null };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({
  transaction,
  comptes,
  categories,
  onDone,
}: {
  transaction?: TransactionAvecRelations;
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
  onDone?: () => void;
}) {
  const action = transaction ? modifierTransaction : creerTransaction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const prevPending = useRef(pending);
  const [categorieId, setCategorieId] = useState(
    transaction?.categorie_id ?? categories[0]?.id ?? ""
  );

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  const categoriesDepense = categories.filter((c) => c.type === "depense");
  const categoriesRevenu = categories.filter((c) => c.type === "revenu");

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="compte_id" className={labelClass}>
          Compte
        </label>
        <select
          id="compte_id"
          name="compte_id"
          defaultValue={transaction?.compte_id ?? comptes[0]?.id ?? ""}
          className={input}
        >
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="categorie_id" className={labelClass}>
          Catégorie
        </label>
        <select
          id="categorie_id"
          name="categorie_id"
          value={categorieId}
          onChange={(e) => setCategorieId(e.target.value)}
          className={input}
        >
          <optgroup label="Dépenses">
            {categoriesDepense.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone ? `${c.icone} ` : ""}
                {c.nom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Revenus">
            {categoriesRevenu.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icone ? `${c.icone} ` : ""}
                {c.nom}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="montant" className={labelClass}>
          Montant
        </label>
        <input
          id="montant"
          name="montant"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={transaction?.montant}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="date_operation" className={labelClass}>
          Date
        </label>
        <input
          id="date_operation"
          name="date_operation"
          type="date"
          required
          defaultValue={transaction?.date_operation ?? todayISO()}
          className={input}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="libelle" className={labelClass}>
          Libellé (optionnel)
        </label>
        <input id="libelle" name="libelle" defaultValue={transaction?.libelle ?? ""} className={input} />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : transaction ? "Enregistrer" : "Ajouter la transaction"}
      </button>
    </form>
  );
}
