"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Enums } from "@/lib/supabase/types";

export type JournalFormState = { error: string | null };

const MOMENTS: readonly Enums<"moment_repas">[] = [
  "petit_dej",
  "dejeuner",
  "diner",
  "collation",
];

export async function addJournalEntry(
  _prevState: JournalFormState,
  formData: FormData
): Promise<JournalFormState> {
  const user = await requireUser();

  const type = String(formData.get("type") ?? "");
  const aliment_id = String(formData.get("aliment_id") ?? "").trim();
  const recette_id = String(formData.get("recette_id") ?? "").trim();
  const quantiteSaisie = Number(formData.get("quantite"));
  const saisieMode = String(formData.get("saisie_mode") ?? "grammes");
  const date = String(formData.get("date") ?? "").trim();
  const moment = String(formData.get("moment") ?? "");

  if (type !== "aliment" && type !== "recette") {
    return { error: "Type d'entrée invalide." };
  }
  if (!date) return { error: "Date requise." };
  if (!MOMENTS.includes(moment as Enums<"moment_repas">)) {
    return { error: "Moment du repas invalide." };
  }
  if (!Number.isFinite(quantiteSaisie) || quantiteSaisie <= 0) {
    return { error: "La quantité doit être un nombre positif." };
  }
  if (type === "aliment" && !aliment_id) return { error: "Aliment requis." };
  if (type === "recette" && !recette_id) return { error: "Recette requise." };
  if (saisieMode !== "grammes" && saisieMode !== "piece") {
    return { error: "Mode de saisie invalide." };
  }

  const supabase = await createClient();

  let quantite = quantiteSaisie;
  if (type === "aliment" && saisieMode === "piece") {
    const { data: aliment, error: alimentError } = await supabase
      .from("aliments")
      .select("poids_unite_g")
      .eq("id", aliment_id)
      .single();

    if (alimentError || !aliment) return { error: "Aliment introuvable." };
    if (aliment.poids_unite_g === null) {
      return {
        error: "Cet aliment n'a pas de poids par pièce défini : saisis une quantité en grammes.",
      };
    }
    quantite = quantiteSaisie * aliment.poids_unite_g;
  }

  const { error } = await supabase.from("journal_repas").insert({
    user_id: user.id,
    aliment_id: type === "aliment" ? aliment_id : null,
    recette_id: type === "recette" ? recette_id : null,
    quantite,
    date,
    moment: moment as Enums<"moment_repas">,
  });

  if (error) return { error: error.message };

  revalidatePath("/journal");
  return { error: null };
}

export async function addJournalEntryLibre(
  _prevState: JournalFormState,
  formData: FormData
): Promise<JournalFormState> {
  const user = await requireUser();

  const description = String(formData.get("description") ?? "").trim();
  const kcal = Number(formData.get("kcal"));
  const proteines_g = Number(formData.get("proteines_g"));
  const glucides_g = Number(formData.get("glucides_g"));
  const lipides_g = Number(formData.get("lipides_g"));
  const date = String(formData.get("date") ?? "").trim();
  const moment = String(formData.get("moment") ?? "");
  const source = String(formData.get("source") ?? "manuel");

  if (!description) return { error: "Description du repas requise." };
  if (!date) return { error: "Date requise." };
  if (!MOMENTS.includes(moment as Enums<"moment_repas">)) {
    return { error: "Moment du repas invalide." };
  }
  if (
    [kcal, proteines_g, glucides_g, lipides_g].some((n) => Number.isNaN(n) || n < 0)
  ) {
    return { error: "Les valeurs nutritionnelles doivent être des nombres positifs." };
  }
  if (source !== "ia" && source !== "manuel") {
    return { error: "Source invalide." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("journal_repas").insert({
    user_id: user.id,
    description,
    kcal,
    proteines_g,
    glucides_g,
    lipides_g,
    source,
    date,
    moment: moment as Enums<"moment_repas">,
  });

  if (error) return { error: error.message };

  revalidatePath("/journal");
  return { error: null };
}

export async function removeJournalEntry(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("journal_repas").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/journal");
}
