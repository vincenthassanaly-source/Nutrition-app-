"use client";

import { useRef } from "react";
import { addDays, format, isSameDay, isToday, startOfToday, subDays } from "date-fns";
import { fr } from "date-fns/locale";
import type { TacheAvecRelations } from "@/app/actions/taches";
import type { Tables } from "@/lib/supabase/types";
import { getCreneauxDuJour } from "@/lib/agenda/planning-travail";
import { AddTaskToggle } from "../taches/AddTaskToggle";
import { TaskCard } from "../taches/TasksList";
import { ghostButton, sectionTitle } from "@/lib/ui";
import { parseISODate, sortByHeure, toISODate } from "./date-utils";
import {
  computeInitialScrollMinutes,
  getTacheBlockStyle,
  gridHeight,
  HourLines,
  TimeGutter,
  useInitialScroll,
  WorkHoursBand,
} from "./TimeGrid";
import { useAgendaZoom } from "./useAgendaZoom";

const PRIORITE_BLOCK_CLASS: Record<TacheAvecRelations["priorite"], string> = {
  aucune: "bg-surface-alt text-ink",
  basse: "bg-agenda/15 text-agenda",
  moyenne: "bg-carbs/15 text-carbs",
  haute: "bg-alert/15 text-alert",
};

function TacheBlock({ tache, zoom }: { tache: TacheAvecRelations; zoom: number }) {
  const style = getTacheBlockStyle(tache, zoom);
  if (!style) return null;

  const plage = tache.heure_fin
    ? `${tache.heure?.slice(0, 5)} – ${tache.heure_fin.slice(0, 5)}`
    : tache.heure?.slice(0, 5);

  return (
    <div
      className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-[12px] leading-tight font-semibold shadow-sm ${PRIORITE_BLOCK_CLASS[tache.priorite]} ${tache.fait ? "opacity-50 line-through" : ""}`}
      style={{ top: style.top, height: style.height }}
    >
      <span className="block truncate">{plage} {tache.titre}</span>
    </div>
  );
}

export function DayView({
  taches,
  listes,
  tags,
  creneaux,
  selectedDate,
  onChangeDate,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
  creneaux: Tables<"horaires_travail_creneaux">[];
  selectedDate: Date;
  onChangeDate: (date: Date) => void;
}) {
  // Les tâches sans heure sont regroupées après celles ayant une heure
  // (cohérent avec le tri "échéance nullsFirst: false" déjà utilisé par la
  // page Tâches).
  const dayTaches = taches
    .filter((t) => t.echeance && isSameDay(parseISODate(t.echeance), selectedDate))
    .sort(sortByHeure);

  const dayTachesAvecHeure = dayTaches.filter((t) => t.heure);

  const creneauxJour = getCreneauxDuJour(creneaux, selectedDate);
  const { zoom, touchHandlers } = useAgendaZoom();
  const scrollRef = useRef<HTMLDivElement>(null);
  useInitialScroll(
    scrollRef,
    computeInitialScrollMinutes({ showCurrentTime: isToday(selectedDate), creneaux: creneauxJour }),
    zoom
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onChangeDate(subDays(selectedDate, 1))}
          className={ghostButton}
          aria-label="Jour précédent"
        >
          ←
        </button>
        <div className="flex flex-col items-center gap-0.5">
          <span className={sectionTitle}>
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
          </span>
          {!isToday(selectedDate) && (
            <button
              type="button"
              onClick={() => onChangeDate(startOfToday())}
              className="text-xs font-semibold text-agenda underline"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChangeDate(addDays(selectedDate, 1))}
          className={ghostButton}
          aria-label="Jour suivant"
        >
          →
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div
          ref={scrollRef}
          className="max-h-[55vh] overflow-auto"
          style={{ touchAction: "pan-x pan-y" }}
          {...touchHandlers}
        >
          <div className="flex pt-2">
            <TimeGutter zoom={zoom} />
            <div className="relative flex-1" style={{ height: gridHeight(zoom) }}>
              <HourLines zoom={zoom} />
              <WorkHoursBand creneaux={creneauxJour} zoom={zoom} />
              {dayTachesAvecHeure.map((t) => (
                <TacheBlock key={t.id} tache={t} zoom={zoom} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <AddTaskToggle
        listes={listes}
        tags={tags}
        defaultEcheance={toISODate(selectedDate)}
        label="+ Ajouter une tâche ce jour-là"
      />

      {dayTaches.length === 0 ? (
        <p className="text-ink-2">Aucune tâche ce jour-là.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {dayTaches.map((tache) => (
            <TaskCard key={tache.id} tache={tache} listes={listes} tags={tags} />
          ))}
        </ul>
      )}
    </div>
  );
}
