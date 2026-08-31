import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { getHabitudesDuJour } from "@/app/actions/habitudes";
import {
  addNutrition,
  nutritionAliment,
  nutritionRecette,
  zeroNutrition,
} from "@/lib/nutrition/compute";
import { eyebrow, card } from "@/lib/ui";
import { ProgressRing } from "@/components/ProgressRing";
import { DashboardTaskItem } from "./DashboardTaskItem";
import { DashboardHabitItem } from "./DashboardHabitItem";
import { QuickAddFab } from "./QuickAddFab";
import { GlobalSearchBar } from "./GlobalSearchBar";

export const dynamic = "force-dynamic";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

const MACRO_COLORS = { proteines: "var(--accent-protein)", glucides: "var(--accent-carbs)", lipides: "var(--accent-fat)" };
const MACRO_LABELS = { proteines: "P", glucides: "G", lipides: "L" };

export default async function DashboardPage() {
  const today = todayISO();
  const supabase = await createClient();

  // Chaque source alimente une carte indépendante : une source en erreur
  // (table manquante, requête qui échoue) dégrade sa carte au lieu de faire
  // planter tout l'accueil.
  const [objectifResult, entriesResult, tachesResult, habitudesResult, listesResult, tagsResult] =
    await Promise.allSettled([
      supabase.from("objectifs_nutritionnels").select("*").eq("jour_type", "repos").maybeSingle(),
      supabase
        .from("journal_repas")
        .select(
          "*, aliment:aliments(*), recette:recettes(id, nom, portions, recette_ingredients(quantite, aliment:aliments(kcal_100g, proteines_100g, glucides_100g, lipides_100g)))"
        )
        .eq("date", today),
      getTachesAvecRelations(),
      getHabitudesDuJour(today),
      getListes(),
      getTags(),
    ]);

  const objectif = objectifResult.status === "fulfilled" ? objectifResult.value.data : null;
  const entries = entriesResult.status === "fulfilled" ? entriesResult.value.data : null;
  const taches = tachesResult.status === "fulfilled" ? tachesResult.value : [];
  const habitudes = habitudesResult.status === "fulfilled" ? habitudesResult.value : [];
  const listes = listesResult.status === "fulfilled" ? listesResult.value : [];
  const tags = tagsResult.status === "fulfilled" ? tagsResult.value : [];

  const consomme = (entries ?? []).reduce((acc, entry) => {
    if (entry.aliment) return addNutrition(acc, nutritionAliment(entry.aliment, entry.quantite));
    const recette = entry.recette!;
    return addNutrition(
      acc,
      nutritionRecette(recette.recette_ingredients, recette.portions, entry.quantite)
    );
  }, zeroNutrition());

  const kcalGoal = objectif?.kcal_cible ?? 2100;
  const kcalPct = kcalGoal > 0 ? consomme.kcal / kcalGoal : 0;
  const macros = [
    { key: "proteines" as const, value: consomme.proteines, goal: objectif?.proteines_cible_g ?? 120 },
    { key: "glucides" as const, value: consomme.glucides, goal: objectif?.glucides_cible_g ?? 230 },
    { key: "lipides" as const, value: consomme.lipides, goal: objectif?.lipides_cible_g ?? 70 },
  ];

  const tachesDuJour = taches.filter((t) => t.echeance === today);
  const tachesDoneCount = tachesDuJour.filter((t) => t.fait).length;
  const tachesAffichees = tachesDuJour
    .filter((t) => !t.fait)
    .concat(tachesDuJour.filter((t) => t.fait))
    .slice(0, 4);

  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const prochainEvenement = taches
    .filter((t) => !t.fait && t.heure && t.echeance && (t.echeance > today || (t.echeance === today && t.heure >= nowHM)))
    .sort((a, b) => (a.echeance! + a.heure! < b.echeance! + b.heure! ? -1 : 1))[0];

  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <p className={`${eyebrow} capitalize`}>{dateLabel}</p>
        <h1 className="font-display text-[25px] font-bold tracking-tight text-ink">{greeting()}</h1>
      </header>

      <GlobalSearchBar />

      <Link href="/nutrition/journal" className={`${card} flex items-center gap-3.5`}>
        <ProgressRing size={60} strokeWidth={6.5} pct={kcalPct} color="var(--accent-kcal)">
          <span className="font-display text-[12.5px] font-bold text-ink">{Math.round(kcalPct * 100)}%</span>
        </ProgressRing>
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <span className="text-[14px] font-semibold text-ink">Nutrition</span>
          <span className="text-[12.5px] font-medium text-ink-2">
            {Math.round(consomme.kcal)} / {kcalGoal} kcal
          </span>
          <div className="flex gap-2">
            {macros.map((m) => (
              <div key={m.key} className="flex flex-1 flex-col gap-0.5">
                <div className="h-1 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, m.goal > 0 ? Math.round((m.value / m.goal) * 100) : 0)}%`,
                      background: MACRO_COLORS[m.key],
                    }}
                  />
                </div>
                <span className="text-[9.5px] font-semibold text-ink-3">{MACRO_LABELS[m.key]}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>

      <div className={`${card} flex flex-col gap-3`}>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-ink">Aujourd&apos;hui</span>
          <span className="text-xs font-semibold text-ink-3">
            {tachesDoneCount}/{tachesDuJour.length} tâches
          </span>
        </div>
        {tachesAffichees.length === 0 ? (
          <p className="text-[13.5px] text-ink-2">Rien de prévu aujourd&apos;hui.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tachesAffichees.map((t) => (
              <DashboardTaskItem key={t.id} id={t.id} titre={t.titre} heure={t.heure} fait={t.fait} />
            ))}
          </div>
        )}
      </div>

      <Link href="/taches" className={`${card} flex items-center gap-3.5`}>
        <div className="flex h-[46px] w-[46px] shrink-0 flex-col items-center justify-center rounded-2xl bg-kcal-soft">
          {prochainEvenement ? (
            <>
              <span className="font-display text-[14px] font-bold leading-none text-kcal">
                {prochainEvenement.heure!.slice(0, 2)}
              </span>
              <span className="text-[8.5px] font-semibold text-kcal">{prochainEvenement.heure!.slice(3, 5)}</span>
            </>
          ) : (
            <span className="font-display text-[14px] font-bold text-kcal">--</span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-3">Prochain événement</span>
          <span className="truncate text-[14px] font-semibold text-ink">
            {prochainEvenement ? prochainEvenement.titre : "Aucun événement"}
          </span>
          {prochainEvenement?.liste && (
            <span className="truncate text-[12px] font-medium text-ink-2">{prochainEvenement.liste.nom}</span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-2.5">
        <span className="px-0.5 text-[14px] font-semibold text-ink">Habitudes</span>
        {habitudes.length === 0 ? (
          <p className="px-0.5 text-[13.5px] text-ink-2">Aucune habitude pour l&apos;instant.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-0.5">
            {habitudes.map((h) => (
              <DashboardHabitItem key={h.id} habitude={h} date={today} />
            ))}
          </div>
        )}
      </div>

      <QuickAddFab listes={listes} tags={tags} />
    </div>
  );
}
