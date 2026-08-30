"use client";

import { compareAsc, format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Tables } from "@/lib/supabase/types";
import { TaskCard } from "../taches/TasksList";
import { sectionTitle } from "@/lib/ui";
import { parseISODate, sortByHeure } from "./date-utils";

type Tache = Tables<"taches">;

export function ListView({ taches }: { taches: Tache[] }) {
  const withDate = taches.filter((t) => t.echeance);
  const withoutDate = taches.filter((t) => !t.echeance);

  const groups = new Map<string, Tache[]>();
  for (const t of withDate) {
    const list = groups.get(t.echeance!) ?? [];
    list.push(t);
    groups.set(t.echeance!, list);
  }

  const sortedDates = Array.from(groups.keys()).sort((a, b) =>
    compareAsc(parseISODate(a), parseISODate(b))
  );

  if (sortedDates.length === 0 && withoutDate.length === 0) {
    return <p className="text-ink-2">Aucune tâche pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {sortedDates.map((iso) => {
        const dayTaches = groups.get(iso)!.sort(sortByHeure);
        return (
          <div key={iso} className="flex flex-col gap-2">
            <h2 className={sectionTitle}>
              {format(parseISODate(iso), "EEEE d MMMM yyyy", { locale: fr })}
            </h2>
            <ul className="flex flex-col gap-2.5">
              {dayTaches.map((tache) => (
                <TaskCard key={tache.id} tache={tache} />
              ))}
            </ul>
          </div>
        );
      })}

      {withoutDate.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className={sectionTitle}>Sans date</h2>
          <ul className="flex flex-col gap-2.5">
            {withoutDate.map((tache) => (
              <TaskCard key={tache.id} tache={tache} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
