"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Enums } from "@/lib/supabase/types";

export type RecetteFormState = { error: string | null };

const SOURCES: readonly Enums<"recette_source">[] = ["manuel", "hellofresh"];

type RecetteInput = {
  nom: string;
  description: string | null;
  temps_prepa_min: number | null;
  portions: number;
  source: Enums<"recette_source">;
};

type ParseResult =
  | { ok: true; value: RecetteInput }
  | { ok: false; error: string };

function parseRecetteInput(formData: FormData): ParseResult {
  const nom = String(formData.get("nom") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tempsRaw = String(formData.get("temps_prepa_min") ?? "").trim();
  const portions = Number(formData.get("portions") ?? 1);
  const source = String(formData.get("source") ?? "manuel");

  if (!nom) return { ok: false, error: "Le nom est requis." };
  if (!SOURCES.includes(source as Enums<"recette_source">)) {
    return { ok: false, error: "Source invalide." };
  }
  if (!Number.isInteger(portions) || portions <= 0) {
    return { ok: false, error: "Le nombre de portions doit être un entier positif." };
  }

  let temps_prepa_min: number | null = null;
  if (tempsRaw) {
    temps_prepa_min = Number(tempsRaw);
    if (!Number.isInteger(temps_prepa_min) || temps_prepa_min < 0) {
      return { ok: false, error: "Le temps de préparation doit être un entier positif." };
    }
  }

  return {
    ok: true,
    value: {
      nom,
      description: description || null,
      temps_prepa_min,
      portions,
      source: source as Enums<"recette_source">,
    },
  };
}

export async function createRecette(
  _prevState: RecetteFormState,
  formData: FormData
): Promise<RecetteFormState> {
  const user = await requireUser();
  const parsed = parseRecetteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recettes")
    .insert({ ...parsed.value, user_id: user.id })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/recettes");
  redirect(`/recettes/${data.id}`);
}

export async function updateRecette(
  _prevState: RecetteFormState,
  formData: FormData
): Promise<RecetteFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Recette introuvable." };

  const parsed = parseRecetteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("recettes")
    .update(parsed.value, { count: "exact" })
    .eq("id", id);

  if (error) return { error: error.message };
  if (!count) {
    return {
      error: "Modification impossible : cette recette est partagée et non modifiable.",
    };
  }

  revalidatePath("/recettes");
  revalidatePath(`/recettes/${id}`);
  return { error: null };
}

export async function deleteRecette(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("recettes")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) throw new Error(error.message);
  if (!count) {
    throw new Error("Suppression impossible : cette recette est partagée et non modifiable.");
  }

  revalidatePath("/recettes");
  redirect("/recettes");
}
