"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TacheFormState = { error: string | null };

type TacheInput = {
  titre: string;
  echeance: string | null;
  heure: string | null;
};

type ParseResult =
  | { ok: true; value: TacheInput }
  | { ok: false; error: string };

const HEURE_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseTacheInput(formData: FormData): ParseResult {
  const titre = String(formData.get("titre") ?? "").trim();
  const echeance = String(formData.get("echeance") ?? "").trim();
  const heure = String(formData.get("heure") ?? "").trim();

  if (!titre) return { ok: false, error: "Le titre est requis." };
  if (heure && !HEURE_REGEX.test(heure)) {
    return { ok: false, error: "Heure invalide (format HH:MM)." };
  }

  return { ok: true, value: { titre, echeance: echeance || null, heure: heure || null } };
}

export async function createTache(
  _prevState: TacheFormState,
  formData: FormData
): Promise<TacheFormState> {
  const parsed = parseTacheInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("taches").insert(parsed.value);

  if (error) return { error: error.message };

  revalidatePath("/taches");
  revalidatePath("/agenda");
  return { error: null };
}

export async function updateTache(
  _prevState: TacheFormState,
  formData: FormData
): Promise<TacheFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Tâche introuvable." };

  const parsed = parseTacheInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("taches").update(parsed.value).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/taches");
  revalidatePath("/agenda");
  return { error: null };
}

export async function toggleTache(id: string) {
  const supabase = await createClient();

  const { data, error: fetchError } = await supabase
    .from("taches")
    .select("fait")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const { error } = await supabase
    .from("taches")
    .update({ fait: !data.fait })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/taches");
  revalidatePath("/agenda");
}

export async function deleteTache(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("taches").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/taches");
  revalidatePath("/agenda");
}
