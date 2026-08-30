"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { aujourdhuiISO } from "@/lib/budget/compute";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { AddTaskToggle } from "./AddTaskToggle";
import { TasksList } from "./TasksList";
import { linkButton, pillTag } from "@/lib/ui";

type VueKey = "aujourdhui" | "semaine" | "toutes";

const VUES: { key: VueKey; label: string }[] = [
  { key: "aujourdhui", label: "Aujourd'hui" },
  { key: "semaine", label: "7 jours" },
  { key: "toutes", label: "Toutes" },
];

export function TachesView({
  taches,
  listes,
  tags,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  const [vue, setVue] = useState<VueKey>("aujourdhui");
  const [listeId, setListeId] = useState<string>("toutes");

  const filtered = useMemo(() => {
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
        <Link href="/taches/listes" className={`${linkButton} shrink-0 whitespace-nowrap`}>
          Gérer les listes
        </Link>
      </div>

      <AddTaskToggle
        listes={listes}
        tags={tags}
        defaultListeId={listeId !== "toutes" ? listeId : undefined}
      />
      <TasksList taches={filtered} listes={listes} tags={tags} />
    </div>
  );
}
