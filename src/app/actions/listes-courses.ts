"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import type { Enums } from "@/lib/supabase/types";

export type ListeFormState = { error: string | null };

export async function createListeFromRecettes(
  _prevState: ListeFormState,
  formData: FormData
): Promise<ListeFormState> {
  const user = await requireUser();

  const nom = String(formData.get("nom") ?? "").trim() || "Liste de courses";
  const recetteIds = formData.getAll("recette_id").map(String).filter(Boolean);

  if (recetteIds.length === 0) {
    return { error: "Sélectionne au moins une recette." };
  }

  const supabase = await createClient();

  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recette_ingredients")
    .select("aliment_id, quantite, unite")
    .in("recette_id", recetteIds);

  if (ingredientsError) return { error: ingredientsError.message };
  if (!ingredients || ingredients.length === 0) {
    return { error: "Les recettes sélectionnées n'ont aucun ingrédient." };
  }

  const merged = new Map<string, { quantite: number; unite: Enums<"unite_mesure"> }>();
  for (const ing of ingredients) {
    const existing = merged.get(ing.aliment_id);
    if (existing) {
      existing.quantite += ing.quantite;
    } else {
      merged.set(ing.aliment_id, { quantite: ing.quantite, unite: ing.unite });
    }
  }

  const { data: liste, error: listeError } = await supabase
    .from("listes_courses")
    .insert({ nom, user_id: user.id })
    .select("id")
    .single();

  if (listeError) return { error: listeError.message };

  const items = Array.from(merged.entries()).map(([aliment_id, { quantite, unite }]) => ({
    liste_id: liste.id,
    aliment_id,
    quantite_totale: quantite,
    unite,
  }));

  const { error: itemsError } = await supabase.from("listes_courses_items").insert(items);
  if (itemsError) return { error: itemsError.message };

  revalidatePath("/courses");
  redirect(`/courses/${liste.id}`);
}

export async function updateListeStatut(id: string, statut: Enums<"liste_statut">) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("listes_courses").update({ statut }).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
  revalidatePath(`/courses/${id}`);
}

export async function deleteListe(id: string) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("listes_courses").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
  redirect("/courses");
}

export async function toggleItemCoche(itemId: string, coche: boolean) {
  await requireUser();
  const supabase = await createClient();
  const { error } = await supabase
    .from("listes_courses_items")
    .update({ coche })
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}
