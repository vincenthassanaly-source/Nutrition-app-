"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Enums } from "@/lib/supabase/types";

export type AlimentFormState = { error: string | null };

const UNITES: readonly Enums<"unite_mesure">[] = ["g", "ml", "piece"];

type AlimentInput = {
  nom: string;
  categorie: string | null;
  unite: Enums<"unite_mesure">;
  kcal_100g: number;
  proteines_100g: number;
  glucides_100g: number;
  lipides_100g: number;
};

type ParseResult =
  | { ok: true; value: AlimentInput }
  | { ok: false; error: string };

function parseAlimentInput(formData: FormData): ParseResult {
  const nom = String(formData.get("nom") ?? "").trim();
  const categorie = String(formData.get("categorie") ?? "").trim();
  const unite = String(formData.get("unite") ?? "g");
  const kcal_100g = Number(formData.get("kcal_100g"));
  const proteines_100g = Number(formData.get("proteines_100g") ?? 0);
  const glucides_100g = Number(formData.get("glucides_100g") ?? 0);
  const lipides_100g = Number(formData.get("lipides_100g") ?? 0);

  if (!nom) return { ok: false, error: "Le nom est requis." };
  if (!UNITES.includes(unite as Enums<"unite_mesure">)) {
    return { ok: false, error: "Unité invalide." };
  }
  if (
    [kcal_100g, proteines_100g, glucides_100g, lipides_100g].some(
      (n) => Number.isNaN(n) || n < 0
    )
  ) {
    return {
      ok: false,
      error: "Les valeurs nutritionnelles doivent être des nombres positifs.",
    };
  }

  return {
    ok: true,
    value: {
      nom,
      categorie: categorie || null,
      unite: unite as Enums<"unite_mesure">,
      kcal_100g,
      proteines_100g,
      glucides_100g,
      lipides_100g,
    },
  };
}

export async function createAliment(
  _prevState: AlimentFormState,
  formData: FormData
): Promise<AlimentFormState> {
  const user = await requireUser();
  const parsed = parseAlimentInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("aliments")
    .insert({ ...parsed.value, user_id: user.id });

  if (error) return { error: error.message };

  revalidatePath("/aliments");
  return { error: null };
}

export async function updateAliment(
  _prevState: AlimentFormState,
  formData: FormData
): Promise<AlimentFormState> {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Aliment introuvable." };

  const parsed = parseAlimentInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("aliments")
    .update(parsed.value, { count: "exact" })
    .eq("id", id);

  if (error) return { error: error.message };
  if (!count) {
    return {
      error: "Modification impossible : cet aliment est partagé et non modifiable.",
    };
  }

  revalidatePath("/aliments");
  return { error: null };
}

export async function deleteAliment(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("aliments")
    .delete({ count: "exact" })
    .eq("id", id);

  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "Impossible de supprimer : cet aliment est utilisé dans une recette ou une liste de courses."
      );
    }
    throw new Error(error.message);
  }
  if (!count) {
    throw new Error("Suppression impossible : cet aliment est partagé et non modifiable.");
  }

  revalidatePath("/aliments");
}
