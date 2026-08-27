import type { Nutrition } from "@/lib/nutrition/compute";

function Barre({
  label,
  consomme,
  cible,
  unite,
}: {
  label: string;
  consomme: number;
  cible: number;
  unite: string;
}) {
  const pct = cible > 0 ? Math.min(100, Math.round((consomme / cible) * 100)) : 0;
  const depasse = cible > 0 && consomme > cible;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className={depasse ? "text-red-600" : "text-neutral-500"}>
          {Math.round(consomme)} / {Math.round(cible)} {unite}
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${depasse ? "bg-red-500" : "bg-green-600"}`}
          style={{ width: `${pct}%` }}
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
      <p className="text-sm text-neutral-500">
        Définis un objectif ci-dessus pour voir ton résumé du jour.
      </p>
    );
  }

  const reste = {
    kcal: cible.kcal - consomme.kcal,
    proteines: cible.proteines - consomme.proteines,
    glucides: cible.glucides - consomme.glucides,
    lipides: cible.lipides - consomme.lipides,
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 p-3">
        <Barre label="Kcal" consomme={consomme.kcal} cible={cible.kcal} unite="kcal" />
        <Barre
          label="Protéines"
          consomme={consomme.proteines}
          cible={cible.proteines}
          unite="g"
        />
        <Barre label="Glucides" consomme={consomme.glucides} cible={cible.glucides} unite="g" />
        <Barre label="Lipides" consomme={consomme.lipides} cible={cible.lipides} unite="g" />
      </div>
      <p className="text-sm text-neutral-500">
        Reste disponible : <strong>{Math.round(reste.kcal)} kcal</strong> · P{" "}
        {Math.round(reste.proteines)}g · G {Math.round(reste.glucides)}g · L{" "}
        {Math.round(reste.lipides)}g
      </p>
    </div>
  );
}
