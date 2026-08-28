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
import { card, eyebrow, screenTitle, sectionTitle } from "@/lib/ui";

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
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className={`${eyebrow} capitalize`}>{dateLabel}</p>
          <h1 className={screenTitle}>Journal</h1>
        </div>
        <div className="flex gap-1.5">
          <Link
            href={`/journal?date=${shiftDate(date, -1)}&jour=${jourType}`}
            aria-label="Jour précédent"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-line bg-surface text-base text-ink"
          >
            ‹
          </Link>
          <Link
            href={`/journal?date=${shiftDate(date, 1)}&jour=${jourType}`}
            aria-label="Jour suivant"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-xl border border-line bg-surface text-base text-ink"
          >
            ›
          </Link>
        </div>
      </div>

      <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
        <Link
          href={`/journal?date=${date}&jour=repos`}
          className="flex-1 rounded-lg py-2 text-center text-[13.5px] font-semibold transition-colors"
          style={
            jourType === "repos"
              ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px oklch(0.2 0.02 255 / 0.1)" }
              : { color: "var(--ink-2)" }
          }
        >
          Repos
        </Link>
        <Link
          href={`/journal?date=${date}&jour=entrainement`}
          className="flex-1 rounded-lg py-2 text-center text-[13.5px] font-semibold transition-colors"
          style={
            jourType === "entrainement"
              ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px oklch(0.2 0.02 255 / 0.1)" }
              : { color: "var(--ink-2)" }
          }
        >
          Entraînement
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Objectif ({jourType === "repos" ? "repos" : "entraînement"})</h2>
        <ObjectifForm jourType={jourType} objectif={objectif} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Résumé du jour</h2>
        <ResumeJour consomme={consomme} cible={cible} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Ajout rapide</h2>
        <AddJournalEntryForm date={date} aliments={aliments ?? []} recettes={recettes ?? []} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className={sectionTitle}>Repas du jour</h2>
        {views.length === 0 ? (
          <div className={`${card} flex flex-col items-center gap-2.5 py-8 text-center`}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="1.6">
              <line x1="5" y1="19" x2="5" y2="11" />
              <line x1="12" y1="19" x2="12" y2="5" />
              <line x1="19" y1="19" x2="19" y2="14" />
            </svg>
            <p className="text-[15px] font-bold text-ink">Aucun repas enregistré</p>
            <p className="text-[13px] leading-relaxed text-ink-2">
              Ajoute un aliment ou une recette ci-dessus pour suivre tes macros.
            </p>
          </div>
        ) : (
          <JournalEntriesList entries={views} />
        )}
      </div>
    </div>
  );
}
