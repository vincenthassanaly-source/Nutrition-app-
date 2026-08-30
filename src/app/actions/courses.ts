"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCourseItem(libelle: string) {
  const trimmed = libelle.trim();
  if (!trimmed) throw new Error("Le libellé est requis.");

  const supabase = await createClient();
  const { error } = await supabase.from("courses_items").insert({ libelle: trimmed });

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
}

export async function toggleCourseItem(id: string, coche: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses_items").update({ coche }).eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
}

export async function deleteCourseItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses_items").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/courses");
}
