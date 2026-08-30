"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { finDuMois } from "@/lib/budget/compute";
import type { Enums, Tables } from "@/lib/supabase/types";

export type TransactionFormState = { error: string | null };

type TransactionInput = {
  compte_id: string;
  categorie_id: string;
  montant: number;
  date_operation: string;
  libelle: string | null;
};

type ParseResult = { ok: true; value: TransactionInput } | { ok: false; error: string };

// Le type (dépense/revenu) n'est jamais lu depuis le formulaire : il est
// dérivé côté serveur à partir de la catégorie choisie (cf. creerTransaction /
// modifierTransaction), pour garantir l'invariant transaction.type ===
// categorie.type sans dépendre d'un champ caché maintenu par le client.
function parseTransactionInput(formData: FormData): ParseResult {
  const compte_id = String(formData.get("compte_id") ?? "").trim();
  const categorie_id = String(formData.get("categorie_id") ?? "").trim();
  const montantRaw = String(formData.get("montant") ?? "").trim();
  const date_operation = String(formData.get("date_operation") ?? "").trim();
  const libelle = String(formData.get("libelle") ?? "").trim();

  if (!compte_id) return { ok: false, error: "Le compte est requis." };
  if (!categorie_id) return { ok: false, error: "La catégorie est requise." };
  if (!date_operation) return { ok: false, error: "La date est requise." };

  const montant = Number(montantRaw);
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false, error: "Le montant doit être un nombre positif." };
  }

  return {
    ok: true,
    value: { compte_id, categorie_id, montant, date_operation, libelle: libelle || null },
  };
}

async function getTypeCategorie(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categorieId: string
): Promise<Enums<"type_mouvement"> | null> {
  const { data, error } = await supabase
    .from("categories_budget")
    .select("type")
    .eq("id", categorieId)
    .maybeSingle();

  if (error || !data) return null;
  return data.type;
}

function revalidateTransactionPaths() {
  revalidatePath("/budget");
  revalidatePath("/budget/comptes");
  revalidatePath("/budget/transactions");
  revalidatePath("/budget/categories");
}

export async function creerTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const parsed = parseTransactionInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const type = await getTypeCategorie(supabase, parsed.value.categorie_id);
  if (!type) return { error: "Catégorie introuvable." };

  const { error } = await supabase.from("transactions").insert({ ...parsed.value, type });
  if (error) return { error: error.message };

  revalidateTransactionPaths();
  return { error: null };
}

export async function modifierTransaction(
  _prevState: TransactionFormState,
  formData: FormData
): Promise<TransactionFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Transaction introuvable." };

  const parsed = parseTransactionInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const type = await getTypeCategorie(supabase, parsed.value.categorie_id);
  if (!type) return { error: "Catégorie introuvable." };

  const { error } = await supabase
    .from("transactions")
    .update({ ...parsed.value, type })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidateTransactionPaths();
  return { error: null };
}

export async function supprimerTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateTransactionPaths();
}

export type TransactionAvecRelations = Tables<"transactions"> & {
  compte: Pick<Tables<"comptes">, "id" | "nom"> | null;
  categorie: Pick<Tables<"categories_budget">, "id" | "nom" | "icone"> | null;
};

export async function getTransactions(filtres?: {
  compteId?: string;
  categorieId?: string;
  /** Format "YYYY-MM-01" (premier jour du mois). */
  mois?: string;
}): Promise<TransactionAvecRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("transactions")
    .select("*, compte:comptes(id, nom), categorie:categories_budget(id, nom, icone)")
    .order("date_operation", { ascending: false })
    .order("created_at", { ascending: false });

  if (filtres?.compteId) query = query.eq("compte_id", filtres.compteId);
  if (filtres?.categorieId) query = query.eq("categorie_id", filtres.categorieId);
  if (filtres?.mois) {
    query = query.gte("date_operation", filtres.mois).lt("date_operation", finDuMois(filtres.mois));
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export type ResumeMois = { totalDepenses: number; totalRevenus: number };

/** @param periode Format "YYYY-MM-01" (premier jour du mois). */
export async function getResumeMois(periode: string): Promise<ResumeMois> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("montant, type")
    .gte("date_operation", periode)
    .lt("date_operation", finDuMois(periode));

  if (error) throw new Error(error.message);

  const totalDepenses = (data ?? [])
    .filter((t) => t.type === "depense")
    .reduce((acc, t) => acc + t.montant, 0);
  const totalRevenus = (data ?? [])
    .filter((t) => t.type === "revenu")
    .reduce((acc, t) => acc + t.montant, 0);

  return { totalDepenses, totalRevenus };
}
