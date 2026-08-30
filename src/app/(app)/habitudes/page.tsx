import { getHabitudesDuJour } from "@/app/actions/habitudes";
import { HabitudesView } from "./HabitudesView";
import { screenTitle } from "@/lib/ui";
import { toISODate } from "./date-utils";

export default async function HabitudesPage() {
  const today = toISODate(new Date());
  const habitudes = await getHabitudesDuJour(today);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Habitudes</h1>
      <HabitudesView habitudes={habitudes} today={today} />
    </div>
  );
}
