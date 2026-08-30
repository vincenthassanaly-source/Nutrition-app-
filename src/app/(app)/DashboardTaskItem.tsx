"use client";

import { useTransition } from "react";
import { toggleTache } from "@/app/actions/taches";

export function DashboardTaskItem({
  id,
  titre,
  heure,
  fait,
}: {
  id: string;
  titre: string;
  heure: string | null;
  fait: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => toggleTache(id))}
        className="shrink-0"
        aria-label={fait ? "Marquer non fait" : "Marquer fait"}
      >
        <span
          className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2"
          style={{
            borderColor: fait ? "var(--accent-kcal)" : "var(--line)",
            background: fait ? "var(--accent-kcal)" : "transparent",
          }}
        >
          {fait && (
            <svg width="11" height="11" viewBox="0 0 12 12">
              <path d="M1 6l3.2 3.2L11 2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>
      <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
        <span
          className="truncate text-[14px] font-medium"
          style={{
            color: fait ? "var(--ink-3)" : "var(--ink)",
            textDecoration: fait ? "line-through" : "none",
          }}
        >
          {titre}
        </span>
        {heure && <span className="shrink-0 text-[11.5px] font-medium text-ink-3">{heure.slice(0, 5)}</span>}
      </div>
    </div>
  );
}
