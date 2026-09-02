"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { addDays, format } from "date-fns";
import { aujourdhuiISO } from "@/lib/budget/compute";
import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { queryKeys } from "@/lib/query/keys";
import { AddTaskToggle } from "./AddTaskToggle";
import { TasksList } from "./TasksList";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { errorText, pillTag } from "@/lib/ui";

const LISTE_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </svg>
);

type VueKey = "aujourdhui" | "semaine" | "toutes";

const VUES: { key: VueKey; label: string }[] = [
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "semaine", label: "7 jours" },
  { key: "toutes", label: "Toutes" },
];

export function TachesView() {
  const [vue, setVue] = useState<VueKey>("toutes");
  const [listeId, setListeId] = useState<string>("toutes");
  const queryClient = useQueryClient();

  const { data: taches, isLoading: tachesLoading, isError: tachesError } = useQuery({
    queryKey: queryKeys.taches,
    queryFn: getTachesAvecRelations,
  });
  const { data: listes = [] } = useQuery({ queryKey: queryKeys.listes, queryFn: getListes });
  const { data: tags = [] } = useQuery({ queryKey: queryKeys.tags, queryFn: getTags });

  const filtered = useMemo(() => {
    if (!taches) return [];
    const today = aujourdhuiISO();
    const dansSeptJours = format(addDays(new Date(`${today}T00:00:00`), 7), "yyyy-MM-dd");

    return taches.filter((tache) => {
      if (listeId !== "toutes" && tache.liste_id !== listeId) return false;
      if (vue === "aujourdhui") return tache.echeance === today;
      if (vue === "semaine") {
        return !!tache.echeance && tache.echeance >= today && tache.echeance <= dansSeptJours;
      }
      return true;
    });
  }, [taches, vue, listeId]);

  function invalidateTaches() {
    queryClient.invalidateQueries({ queryKey: queryKeys.taches });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex rounded-2xl border border-line bg-surface p-1">
        {VUES.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setVue(v.key)}
            className={`flex-1 rounded-xl py-2 text-[13px] font-semibold transition-colors ${
              vue === v.key ? "bg-carbs text-white" : "text-ink-2"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Link
          href="/taches/listes"
          aria-label="Gérer les listes"
          title="Gérer les listes"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition-colors hover:bg-surface-alt"
        >
          {LISTE_ICON}
        </Link>
        <button
          type="button"
          onClick={() => setListeId("toutes")}
          className={listeId === "toutes" ? `${pillTag} bg-kcal/10 text-kcal` : pillTag}
        >
          Toutes les listes
        </button>
        {listes.map((liste) => (
          <button
            key={liste.id}
            type="button"
            onClick={() => setListeId(liste.id)}
            className={listeId === liste.id ? `${pillTag} bg-kcal/10 text-kcal` : pillTag}
          >
            {liste.nom}
          </button>
        ))}
      </div>

      <AddTaskToggle
        listes={listes}
        tags={tags}
        defaultListeId={listeId !== "toutes" ? listeId : undefined}
        onSaved={invalidateTaches}
      />
      {tachesLoading ? (
        <div className="flex flex-col gap-2.5">
          <Skeleton className="h-3 w-24" />
          <ListItemSkeletonGroup count={5} />
        </div>
      ) : tachesError ? (
        <p className={errorText}>Erreur de chargement des tâches. Réessaie.</p>
      ) : (
        <TasksList taches={filtered} listes={listes} tags={tags} />
      )}
    </div>
  );
}
