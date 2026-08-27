"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";

export type PlacardFormState = { error: string | null };

export async function upsertPlacardItem(
  _prevState: PlacardFormState,
  formData: FormData
): Promise<PlacardFormState> {
  const user = await requireUser();

  const aliment_id = String(formData.get("aliment_id") ?? "");
  const quantite_disponible = Number(formData.get("quantite_disponible"));
  const date_peremption_raw = String(formData.get("date_peremption") ?? "").trim();

  if (!aliment_id) return { error: "Aliment requis." };
  if (!Number.isFinite(quantite_disponible) || quantite_disponible < 0) {
    return { error: "La quantité doit être un nombre positif ou nul." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("placard").upsert(
    {
      user_id: user.id,
      aliment_id,
      quantite_disponible,
      date_peremption: date_peremption_raw || null,
    },
    { onConflict: "user_id,aliment_id" }
  );

  if (error) return { error: error.message };

  revalidatePath("/placard");
  return { error: null };
}

export async function updatePlacardQuantite(id: string, quantite: number) {
  await requireUser();
  if (!Number.isFinite(quantite) || quantite < 0) {
    throw new Error("La quantité doit être un nombre positif ou nul.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("placard")
    .update({ quantite_disponible: quantite })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/placard");
}

export async function removePlacardItem(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("placard").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/placard");
}
