"use server";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export async function getPlanningTravail(): Promise<Tables<"horaires_travail_creneaux">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("horaires_travail_creneaux")
    .select("*")
    .order("jour_semaine", { ascending: true })
    .order("heure_debut", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
