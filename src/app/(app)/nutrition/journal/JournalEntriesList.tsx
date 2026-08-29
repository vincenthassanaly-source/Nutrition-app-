"use client";

import { useTransition } from "react";
import { removeJournalEntry } from "@/app/actions/journal";
import type { Nutrition } from "@/lib/nutrition/compute";
import type { Enums } from "@/lib/supabase/types";
import { cardTight, dangerButton } from "@/lib/ui";

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
    <li className={`${cardTight} flex flex-col gap-2`}>
      <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-3">
        {MOMENT_LABEL[entry.moment]}
      </span>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold text-ink">{entry.label}</p>
          <p className="text-xs text-ink-2">{entry.detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="font-display text-[15px] font-semibold text-ink">
            {Math.round(entry.nutrition.kcal)} kcal
          </span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => removeJournalEntry(entry.id))}
            className={dangerButton}
          >
            Suppr.
          </button>
        </div>
      </div>
    </li>
  );
}

export function JournalEntriesList({ entries }: { entries: JournalEntryView[] }) {
  if (entries.length === 0) {
    return <p className="text-ink-2">Aucun repas enregistré pour ce jour.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {MOMENT_ORDER.filter((m) => entries.some((e) => e.moment === m)).map((moment) => (
        <ul key={moment} className="flex flex-col gap-2.5">
          {entries
            .filter((e) => e.moment === moment)
            .map((entry) => (
              <EntryRow key={entry.id} entry={entry} />
            ))}
        </ul>
      ))}
    </div>
  );
}
