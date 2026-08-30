"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/types";

export type CompteFormState = { error: string | null };

const TYPES_COMPTE: readonly Enums<"type_compte">[] = ["courant", "epargne", "autre"];

type CompteInput = {
  nom: string;
  type: Enums<"type_compte">;
  solde_initial: number;
};

type ParseResult = { ok: true; value: CompteInput } | { ok: false; error: string };

function parseCompteInput(formData: FormData): ParseResult {
  const nom = String(formData.get("nom") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const soldeRaw = String(formData.get("solde_initial") ?? "").trim();

  if (!nom) return { ok: false, error: "Le nom est requis." };
  if (!TYPES_COMPTE.includes(type as Enums<"type_compte">)) {
    return { ok: false, error: "Type de compte invalide." };
  }

  const solde_initial = soldeRaw === "" ? 0 : Number(soldeRaw);
  if (!Number.isFinite(solde_initial)) {
    return { ok: false, error: "Le solde initial doit être un nombre." };
  }

  return { ok: true, value: { nom, type: type as Enums<"type_compte">, solde_initial } };
}

export async function creerCompte(
  _prevState: CompteFormState,
  formData: FormData
): Promise<CompteFormState> {
  const parsed = parseCompteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("comptes").insert(parsed.value);
  if (error) return { error: error.message };

  revalidatePath("/budget");
  revalidatePath("/budget/comptes");
  return { error: null };
}

export async function modifierCompte(
  _prevState: CompteFormState,
  formData: FormData
): Promise<CompteFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Compte introuvable." };

  const parsed = parseCompteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("comptes").update(parsed.value).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/budget");
  revalidatePath("/budget/comptes");
  return { error: null };
}

export async function supprimerCompte(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("comptes").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/budget");
  revalidatePath("/budget/comptes");
  revalidatePath("/budget/transactions");
}

export type CompteAvecSolde = Tables<"comptes"> & { solde: number };

export async function getComptesAvecSolde(): Promise<CompteAvecSolde[]> {
  const supabase = await createClient();

  const [
    { data: comptes, error: comptesError },
    { data: transactions, error: transactionsError },
  ] = await Promise.all([
    supabase.from("comptes").select("*").order("created_at", { ascending: true }),
    supabase.from("transactions").select("compte_id, montant, type"),
  ]);

  if (comptesError) throw new Error(comptesError.message);
  if (transactionsError) throw new Error(transactionsError.message);

  return (comptes ?? []).map((compte) => {
    const mouvement = (transactions ?? [])
      .filter((t) => t.compte_id === compte.id)
      .reduce((acc, t) => acc + (t.type === "revenu" ? t.montant : -t.montant), 0);

    return { ...compte, solde: compte.solde_initial + mouvement };
  });
}
