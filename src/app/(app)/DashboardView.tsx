"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { getHabitudesDuJour } from "@/app/actions/habitudes";
import { getResumeNutritionJour } from "@/app/actions/journal";
import { queryKeys } from "@/lib/query/keys";
import { card } from "@/lib/ui";
import { ProgressRing } from "@/components/ProgressRing";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { DashboardTaskItem } from "./DashboardTaskItem";
import { DashboardHabitItem } from "./DashboardHabitItem";
import { QuickAddFab } from "./QuickAddFab";

const MACRO_COLORS = { proteines: "var(--accent-protein)", glucides: "var(--accent-carbs)", lipides: "var(--accent-fat)" };
const MACRO_LABELS = { proteines: "P", glucides: "G", lipides: "L" };

export function DashboardView({ today }: { today: string }) {
  const { data: taches, isLoading: tachesLoading } = useQuery({
    queryKey: queryKeys.taches,
    queryFn: getTachesAvecRelations,
  });
  const { data: habitudes, isLoading: habitudesLoading } = useQuery({
    queryKey: queryKeys.habitudes(today),
    queryFn: () => getHabitudesDuJour(today),
  });
  const { data: resume, isLoading: resumeLoading } = useQuery({
    queryKey: queryKeys.objectifNutritionnel("repos"),
    queryFn: () => getResumeNutritionJour(today, "repos"),
  });
  const { data: listes = [] } = useQuery({ queryKey: queryKeys.listes, queryFn: getListes });
  const { data: tags = [] } = useQuery({ queryKey: queryKeys.tags, queryFn: getTags });

  const kcalGoal = resume?.kcalGoal ?? 2100;
  const kcalPct = resume ? (kcalGoal > 0 ? resume.consomme.kcal / kcalGoal : 0) : 0;
  const macros = resume
    ? [
        { key: "proteines" as const, value: resume.consomme.proteines, goal: resume.macroGoals.proteines },
        { key: "glucides" as const, value: resume.consomme.glucides, goal: resume.macroGoals.glucides },
        { key: "lipides" as const, value: resume.consomme.lipides, goal: resume.macroGoals.lipides },
      ]
    : [];

  const tachesDuJour = (taches ?? []).filter((t) => t.echeance === today);
  const tachesDoneCount = tachesDuJour.filter((t) => t.fait).length;
  const tachesAffichees = tachesDuJour
    .filter((t) => !t.fait)
    .concat(tachesDuJour.filter((t) => t.fait))
    .slice(0, 4);

  const now = new Date();
  const nowHM = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const prochainEvenement = (taches ?? [])
    .filter((t) => !t.fait && t.heure && t.echeance && (t.echeance > today || (t.echeance === today && t.heure >= nowHM)))
    .sort((a, b) => (a.echeance! + a.heure! < b.echeance! + b.heure! ? -1 : 1))[0];

  return (
    <>
      {resumeLoading ? (
        <CardSkeleton />
      ) : (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Link href="/nutrition/journal" className={`${card} flex items-center gap-3.5`}>
            <ProgressRing size={60} strokeWidth={6.5} pct={kcalPct} color="var(--accent-kcal)">
              <span className="font-display text-[12.5px] font-bold text-ink">{Math.round(kcalPct * 100)}%</span>
            </ProgressRing>
            <div className="flex flex-1 flex-col gap-1.5 min-w-0">
              <span className="text-[14px] font-semibold text-ink">Nutrition</span>
              <span className="text-[12.5px] font-medium text-ink-2">
                {Math.round(resume?.consomme.kcal ?? 0)} / {kcalGoal} kcal
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
        </motion.div>
      )}

      <div className={`${card} flex flex-col gap-3`}>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-ink">Aujourd&apos;hui</span>
          {tachesLoading ? (
            <Skeleton className="h-3 w-14" />
          ) : (
            <span className="text-xs font-semibold text-ink-3">
              {tachesDoneCount}/{tachesDuJour.length} tâches
            </span>
          )}
        </div>
        {tachesLoading ? (
          <ListItemSkeletonGroup count={3} />
        ) : tachesAffichees.length === 0 ? (
          <p className="text-[13.5px] text-ink-2">Rien de prévu aujourd&apos;hui.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {tachesAffichees.map((t) => (
              <DashboardTaskItem key={t.id} id={t.id} titre={t.titre} heure={t.heure} fait={t.fait} />
            ))}
          </div>
        )}
      </div>

      {tachesLoading ? (
        <CardSkeleton withRing={false} />
      ) : (
        <motion.div whileTap={{ scale: 0.98 }}>
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
        </motion.div>
      )}

      <div className="flex flex-col gap-2.5">
        <span className="px-0.5 text-[14px] font-semibold text-ink">Habitudes</span>
        {habitudesLoading ? (
          <div className="flex gap-3 overflow-x-hidden pb-0.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[50px] w-[50px] shrink-0 rounded-full" />
            ))}
          </div>
        ) : !habitudes || habitudes.length === 0 ? (
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
    </>
  );
}
