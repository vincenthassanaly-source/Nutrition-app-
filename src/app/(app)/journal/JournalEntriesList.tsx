"use client";

import { useTransition } from "react";
import { removeJournalEntry } from "@/app/actions/journal";
import type { Nutrition } from "@/lib/nutrition/compute";
import type { Enums } from "@/lib/supabase/types";

export type JournalEntryView = {
  id: string;
  moment: Enums<"moment_repas">;
  label: string;
  detail: string;
  nutrition: Nutrition;
};

const MOMENT_ORDER: Enums<"moment_repas">[] = ["petit_dej", "dejeuner", "diner", "collation"];
const MOMENT_LABEL: Record<string, string> = {
  petit_dej: "Petit-déj",
  dejeuner: "Déjeuner",
  diner: "Dîner",
  collation: "Collation",
};

function EntryRow({ entry }: { entry: JournalEntryView }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{entry.label}</p>
        <p className="text-sm text-neutral-500">
          {entry.detail} · {Math.round(entry.nutrition.kcal)} kcal
        </p>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => removeJournalEntry(entry.id))}
        className="shrink-0 rounded-md border border-red-300 px-2 py-1 text-sm text-red-600 disabled:opacity-60"
      >
        Suppr.
      </button>
    </li>
  );
}

export function JournalEntriesList({ entries }: { entries: JournalEntryView[] }) {
  if (entries.length === 0) {
    return <p className="text-neutral-500">Aucun repas enregistré pour ce jour.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {MOMENT_ORDER.filter((m) => entries.some((e) => e.moment === m)).map((moment) => (
        <div key={moment} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-neutral-500">{MOMENT_LABEL[moment]}</h3>
          <ul className="flex flex-col gap-2">
            {entries
              .filter((e) => e.moment === moment)
              .map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
