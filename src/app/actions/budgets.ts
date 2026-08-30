"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { finDuMois, statutBudget, type StatutBudget } from "@/lib/budget/compute";
import type { Tables } from "@/lib/supabase/types";

export type BudgetFormState = { error: string | null };

/** Upsert par (categorie_id, periode) : un seul montant cible par catégorie et par mois. */
export async function upsertBudget(
  _prevState: BudgetFormState,
  formData: FormData
): Promise<BudgetFormState> {
  const categorie_id = String(formData.get("categorie_id") ?? "").trim();
  const periode = String(formData.get("periode") ?? "").trim();
  const montantRaw = String(formData.get("montant_cible") ?? "").trim();

  if (!categorie_id) return { error: "La catégorie est requise." };
  if (!periode) return { error: "La période est requise." };

  const montant_cible = Number(montantRaw);
  if (!Number.isFinite(montant_cible) || montant_cible < 0) {
    return { error: "Le montant cible doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .upsert({ categorie_id, periode, montant_cible }, { onConflict: "categorie_id,periode" });

  if (error) return { error: error.message };

  revalidatePath("/budget");
  revalidatePath("/budget/categories");
  return { error: null };
}

export async function supprimerBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("budgets").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/categories");
}

export type SuiviCategorie = {
  categorie: Tables<"categories_budget">;
  budget: Tables<"budgets"> | null;
  consomme: number;
  cible: number;
  statut: StatutBudget;
};

/**
 * Pour chaque catégorie de dépense, calcule la somme des transactions de la
 * période vs le montant cible du budget, avec un statut ok / proche / dépassé
 * pour piloter l'indicateur visuel (cf. `statutBudget`).
 *
 * @param periode Format "YYYY-MM-01" (premier jour du mois).
 */
export async function getSuiviCategories(periode: string): Promise<SuiviCategorie[]> {
  const supabase = await createClient();

  const [
    { data: categories, error: categoriesError },
    { data: budgets, error: budgetsError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase.from("categories_budget").select("*").eq("type", "depense").order("nom"),
    supabase.from("budgets").select("*").eq("periode", periode),
    supabase
      .from("transactions")
      .select("categorie_id, montant")
      .eq("type", "depense")
      .gte("date_operation", periode)
      .lt("date_operation", finDuMois(periode)),
  ]);

  if (categoriesError) throw new Error(categoriesError.message);
  if (budgetsError) throw new Error(budgetsError.message);
  if (transactionsError) throw new Error(transactionsError.message);

  return (categories ?? []).map((categorie) => {
    const budget = (budgets ?? []).find((b) => b.categorie_id === categorie.id) ?? null;
    const consomme = (transactions ?? [])
      .filter((t) => t.categorie_id === categorie.id)
      .reduce((acc, t) => acc + t.montant, 0);
    const cible = budget?.montant_cible ?? 0;

    return { categorie, budget, consomme, cible, statut: statutBudget(consomme, cible) };
  });
}
