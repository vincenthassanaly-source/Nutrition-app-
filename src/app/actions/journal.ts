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
  const quantite = Number(formData.get("quantite"));
  const date = String(formData.get("date") ?? "").trim();
  const moment = String(formData.get("moment") ?? "");

  if (type !== "aliment" && type !== "recette") {
    return { error: "Type d'entrée invalide." };
  }
  if (!date) return { error: "Date requise." };
  if (!MOMENTS.includes(moment as Enums<"moment_repas">)) {
    return { error: "Moment du repas invalide." };
  }
  if (!Number.isFinite(quantite) || quantite <= 0) {
    return { error: "La quantité doit être un nombre positif." };
  }
  if (type === "aliment" && !aliment_id) return { error: "Aliment requis." };
  if (type === "recette" && !recette_id) return { error: "Recette requise." };

  const supabase = await createClient();
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

export async function removeJournalEntry(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("journal_repas").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/journal");
}
