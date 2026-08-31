"use client";

import { useState } from "react";
import type { Nutrition } from "@/lib/nutrition/compute";
import { ghostButton } from "@/lib/ui";

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

type DetailValues = {
  sucres_portion: number | null;
  satures_portion: number | null;
  fibres_portion: number | null;
  sel_portion: number | null;
  sucres_100g: number | null;
  satures_100g: number | null;
  fibres_100g: number | null;
  sel_100g: number | null;
};

const DETAIL_FIELDS: { portionKey: keyof DetailValues; g100Key: keyof DetailValues; label: string }[] = [
  { portionKey: "sucres_portion", g100Key: "sucres_100g", label: "dont sucres" },
  { portionKey: "satures_portion", g100Key: "satures_100g", label: "dont saturés" },
  { portionKey: "fibres_portion", g100Key: "fibres_100g", label: "fibres" },
  { portionKey: "sel_portion", g100Key: "sel_100g", label: "sel" },
];

export function RecetteMacros({
  perPortion,
  detail,
}: {
  perPortion: Nutrition;
  detail?: DetailValues;
}) {
  const [count, setCount] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);

  const hasDetail =
    detail != null &&
    DETAIL_FIELDS.some((f) => detail[f.portionKey] != null || detail[f.g100Key] != null);

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

      {hasDetail && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setDetailOpen((o) => !o)}
            className={`self-start ${ghostButton}`}
          >
            {detailOpen ? "Masquer le détail" : "Voir le détail nutritionnel"}
          </button>
          {detailOpen && (
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="border-b border-line bg-surface-alt text-ink-2">
                    <th className="px-2.5 py-1.5 text-left font-medium">Valeur nutritionnelle</th>
                    <th className="px-2.5 py-1.5 text-right font-medium">Par portion</th>
                    <th className="px-2.5 py-1.5 text-right font-medium">Pour 100g</th>
                  </tr>
                </thead>
                <tbody>
                  {DETAIL_FIELDS.map((f) => {
                    const parPortion = detail![f.portionKey];
                    const par100g = detail![f.g100Key];
                    if (parPortion == null && par100g == null) return null;
                    return (
                      <tr key={f.label} className="border-b border-line last:border-0">
                        <td className="px-2.5 py-1.5 text-ink">{f.label}</td>
                        <td className="px-2.5 py-1.5 text-right text-ink">
                          {parPortion != null ? `${fmt(parPortion)} g` : "—"}
                        </td>
                        <td className="px-2.5 py-1.5 text-right text-ink">
                          {par100g != null ? `${fmt(par100g)} g` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
