import type { Nutrition } from "@/lib/nutrition/compute";
import { card } from "@/lib/ui";

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function MacroBar({
  label,
  consomme,
  cible,
  color,
}: {
  label: string;
  consomme: number;
  cible: number;
  color: string;
}) {
  const pct = cible > 0 ? Math.min(100, Math.round((consomme / cible) * 100)) : 0;
  const depasse = cible > 0 && consomme > cible;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-ink">{label}</span>
        <span className={`text-[11.5px] font-mono ${depasse ? "text-alert" : "text-ink-3"}`}>
          {Math.round(consomme)} / {Math.round(cible)} g
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${pct}%`, background: depasse ? "var(--accent-alert)" : color }}
        />
      </div>
    </div>
  );
}

export function ResumeJour({
  consomme,
  cible,
}: {
  consomme: Nutrition;
  cible: Nutrition | null;
}) {
  if (!cible) {
    return (
      <p className="text-sm text-ink-2">
        Définis un objectif ci-dessus pour voir ton résumé du jour.
      </p>
    );
  }

  const reste = cible.kcal - consomme.kcal;
  const kcalOver = consomme.kcal > cible.kcal;
  const kcalPct = cible.kcal > 0 ? Math.min(100, Math.round((consomme.kcal / cible.kcal) * 100)) : 0;
  const kcalOffset = CIRCUMFERENCE * (1 - kcalPct / 100);
  const resteLabel =
    reste >= 0
      ? `${Math.round(reste)} kcal restantes aujourd'hui`
      : `Objectif dépassé de ${Math.round(-reste)} kcal`;

  return (
    <div className={`${card} flex flex-col gap-1`}>
      <div className="flex items-center gap-4.5">
        <div className="relative h-[132px] w-[132px] shrink-0">
          <svg width="132" height="132" viewBox="0 0 132 132">
            <circle cx="66" cy="66" r={RADIUS} stroke="var(--surface-alt)" strokeWidth="11" fill="none" />
            <circle
              cx="66"
              cy="66"
              r={RADIUS}
              stroke={kcalOver ? "var(--accent-alert)" : "var(--accent-kcal)"}
              strokeWidth="11"
              fill="none"
              strokeLinecap="round"
              transform="rotate(-90 66 66)"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={kcalOffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
            <div className="font-display text-2xl font-semibold text-ink">
              {Math.round(consomme.kcal)}
            </div>
            <div className="text-[11px] text-ink-3">/ {Math.round(cible.kcal)} kcal</div>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <p className={`mb-0.5 text-[12.5px] font-semibold ${kcalOver ? "text-alert" : "text-ink-2"}`}>
            {resteLabel}
          </p>
          <MacroBar label="Protéines" consomme={consomme.proteines} cible={cible.proteines} color="var(--accent-protein)" />
          <MacroBar label="Glucides" consomme={consomme.glucides} cible={cible.glucides} color="var(--accent-carbs)" />
          <MacroBar label="Lipides" consomme={consomme.lipides} cible={cible.lipides} color="var(--accent-fat)" />
        </div>
      </div>
    </div>
  );
}
