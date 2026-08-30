"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CompteAvecSolde } from "@/app/actions/comptes";
import type { Tables } from "@/lib/supabase/types";
import { input } from "@/lib/ui";

export function TransactionsFilters({
  comptes,
  categories,
}: {
  comptes: CompteAvecSolde[];
  categories: Tables<"categories_budget">[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/budget/transactions?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        placeholder="Rechercher un libellé..."
        value={searchParams.get("q") ?? ""}
        onChange={(e) => updateParam("q", e.target.value)}
        className={`${input} py-2 text-[13px]`}
      />
      <div className="flex flex-wrap gap-2">
        <select
          value={searchParams.get("compte") ?? ""}
          onChange={(e) => updateParam("compte", e.target.value)}
          className={`${input} flex-1 py-2 text-[13px]`}
        >
          <option value="">Tous les comptes</option>
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
        <select
          value={searchParams.get("categorie") ?? ""}
          onChange={(e) => updateParam("categorie", e.target.value)}
          className={`${input} flex-1 py-2 text-[13px]`}
        >
          <option value="">Toutes les catégories</option>
          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.icone ? `${categorie.icone} ` : ""}
              {categorie.nom}
            </option>
          ))}
        </select>
        <input
          type="month"
          value={searchParams.get("mois") ?? ""}
          onChange={(e) => updateParam("mois", e.target.value)}
          className={`${input} py-2 text-[13px]`}
        />
      </div>
    </div>
  );
}
