"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { aujourdhuiISO } from "@/lib/budget/compute";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { AddTaskToggle } from "./AddTaskToggle";
import { TasksList } from "./TasksList";
import { pillTag } from "@/lib/ui";

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

export function TachesView({
  taches,
  listes,
  tags,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  const [vue, setVue] = useState<VueKey>("toutes");
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
      />
      <TasksList taches={filtered} listes={listes} tags={tags} />
    </div>
  );
}
