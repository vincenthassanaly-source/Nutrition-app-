"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";

export type HoraireFormState = { error: string | null };

const HEURE_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export async function getHorairesTravail(): Promise<Tables<"horaires_travail">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("horaires_travail")
    .select("*")
    .order("jour_semaine", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Un jour est "non travaillé" si sa case est cochée : dans ce cas
// heure_debut/heure_fin sont forcés à null côté serveur, plutôt que de
// faire confiance aux champs (que le client masque déjà quand la case est
// cochée). Sinon, les deux heures doivent être cohérentes entre elles.
export async function updateHorairesTravail(
  _prevState: HoraireFormState,
  formData: FormData
): Promise<HoraireFormState> {
  const updates: { jour_semaine: number; heure_debut: string | null; heure_fin: string | null }[] = [];

  for (let jour = 0; jour <= 6; jour++) {
    const nonTravaille = formData.get(`non_travaille_${jour}`) === "on";
    const heureDebut = String(formData.get(`heure_debut_${jour}`) ?? "").trim();
    const heureFin = String(formData.get(`heure_fin_${jour}`) ?? "").trim();

    if (nonTravaille) {
      updates.push({ jour_semaine: jour, heure_debut: null, heure_fin: null });
      continue;
    }

    if (heureDebut && !HEURE_REGEX.test(heureDebut)) {
      return { error: "Heure de début invalide (format HH:MM)." };
    }
    if (heureFin && !HEURE_REGEX.test(heureFin)) {
      return { error: "Heure de fin invalide (format HH:MM)." };
    }
    if (heureDebut && heureFin && heureFin <= heureDebut) {
      return { error: "L'heure de fin doit être après l'heure de début." };
    }

    updates.push({
      jour_semaine: jour,
      heure_debut: heureDebut || null,
      heure_fin: heureFin || null,
    });
  }

  const supabase = await createClient();

  const results = await Promise.all(
    updates.map(({ jour_semaine, heure_debut, heure_fin }) =>
      supabase.from("horaires_travail").update({ heure_debut, heure_fin }).eq("jour_semaine", jour_semaine)
    )
  );

  const failed = results.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  revalidatePath("/agenda");
  return { error: null };
}
