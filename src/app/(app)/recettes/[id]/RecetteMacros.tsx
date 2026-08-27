"use client";

import { useState } from "react";
import type { Nutrition } from "@/lib/nutrition/compute";

function fmt(n: number) {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

const CHIPS: { key: keyof Nutrition; label: string; unit: string; color: string }[] = [
  { key: "kcal", label: "kcal", unit: "", color: "var(--accent-kcal)" },
  { key: "proteines", label: "protéines", unit: "g", color: "var(--accent-protein)" },
  { key: "glucides", label: "glucides", unit: "g", color: "var(--accent-carbs)" },
  { key: "lipides", label: "lipides", unit: "g", color: "var(--accent-fat)" },
];

export function RecetteMacros({ perPortion }: { perPortion: Nutrition }) {
  const [count, setCount] = useState(1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-[13.5px] font-semibold text-ink">Portions consommées</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCount((n) => Math.max(1, n - 1))}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] border border-line bg-surface text-base text-ink"
            aria-label="Retirer une portion"
          >
            −
          </button>
          <span className="w-4 text-center font-display text-base font-semibold text-ink">{count}</span>
          <button
            type="button"
            onClick={() => setCount((n) => n + 1)}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] border border-line bg-surface text-base text-ink"
            aria-label="Ajouter une portion"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CHIPS.map((chip) => (
          <div key={chip.key} className="rounded-xl bg-surface-alt px-1.5 py-2.5 text-center">
            <div className="font-display text-base font-semibold" style={{ color: chip.color }}>
              {fmt(perPortion[chip.key] * count)}
              {chip.unit}
            </div>
            <div className="mt-0.5 text-[10px] text-ink-3">{chip.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
