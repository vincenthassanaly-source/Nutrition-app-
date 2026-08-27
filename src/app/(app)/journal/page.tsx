import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { ObjectifForm } from "./ObjectifForm";
import { ResumeJour } from "./ResumeJour";
import { AddJournalEntryForm } from "./AddJournalEntryForm";
import { JournalEntriesList, type JournalEntryView } from "./JournalEntriesList";
import {
  addNutrition,
  nutritionAliment,
  nutritionRecette,
  zeroNutrition,
} from "@/lib/nutrition/compute";
import type { Enums } from "@/lib/supabase/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; jour?: string }>;
}) {
  const { date: dateParam, jour: jourParam } = await searchParams;
  const date = dateParam || todayISO();
  const jourType: Enums<"jour_type_ppl"> = jourParam === "entrainement" ? "entrainement" : "repos";

  await requireUser();
  const supabase = await createClient();

  const [{ data: objectif }, { data: entries }, { data: aliments }, { data: recettes }] =
    await Promise.all([
      supabase
        .from("objectifs_nutritionnels")
        .select("*")
        .eq("jour_type", jourType)
        .maybeSingle(),
      supabase
        .from("journal_repas")
        .select(
          "*, aliment:aliments(*), recette:recettes(id, nom, portions, recette_ingredients(quantite, aliment:aliments(kcal_100g, proteines_100g, glucides_100g, lipides_100g)))"
        )
        .eq("date", date),
      supabase.from("aliments").select("*").order("nom", { ascending: true }),
      supabase.from("recettes").select("*").order("nom", { ascending: true }),
    ]);

  const views: JournalEntryView[] = (entries ?? []).map((entry) => {
    if (entry.aliment) {
      return {
        id: entry.id,
        moment: entry.moment,
        label: entry.aliment.nom,
        detail: `${entry.quantite} ${entry.aliment.unite === "piece" ? "pièce" : entry.aliment.unite}`,
        nutrition: nutritionAliment(entry.aliment, entry.quantite),
      };
    }

    const recette = entry.recette!;
    return {
      id: entry.id,
      moment: entry.moment,
      label: recette.nom,
      detail: `${entry.quantite} portion${entry.quantite > 1 ? "s" : ""}`,
      nutrition: nutritionRecette(
        recette.recette_ingredients,
        recette.portions,
        entry.quantite
      ),
    };
  });

  const consomme = views.reduce((acc, v) => addNutrition(acc, v.nutrition), zeroNutrition());
  const cible = objectif
    ? {
        kcal: objectif.kcal_cible,
        proteines: objectif.proteines_cible_g,
        glucides: objectif.glucides_cible_g,
        lipides: objectif.lipides_cible_g,
      }
    : null;

  const dateLabel = new Date(`${date}T00:00:00Z`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold capitalize">{dateLabel}</h1>
        <div className="flex gap-2 text-sm">
          <Link
            href={`/journal?date=${shiftDate(date, -1)}&jour=${jourType}`}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            ← Veille
          </Link>
          <Link
            href={`/journal?date=${shiftDate(date, 1)}&jour=${jourType}`}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            Lendemain →
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-neutral-500">Aujourd&apos;hui c&apos;est un jour :</span>
        <Link
          href={`/journal?date=${date}&jour=repos`}
          className={`rounded-md border px-2 py-1 ${
            jourType === "repos" ? "border-green-700 text-green-700" : "border-neutral-300"
          }`}
        >
          Repos
        </Link>
        <Link
          href={`/journal?date=${date}&jour=entrainement`}
          className={`rounded-md border px-2 py-1 ${
            jourType === "entrainement" ? "border-green-700 text-green-700" : "border-neutral-300"
          }`}
        >
          Entraînement
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Objectif ({jourType === "repos" ? "repos" : "entraînement"})</h2>
        <ObjectifForm jourType={jourType} objectif={objectif} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Résumé du jour</h2>
        <ResumeJour consomme={consomme} cible={cible} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Ajout rapide</h2>
        <AddJournalEntryForm date={date} aliments={aliments ?? []} recettes={recettes ?? []} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-medium">Repas du jour</h2>
        <JournalEntriesList entries={views} />
      </div>
    </div>
  );
}
