import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { getPlanningTravail, getPlanningTravailExceptions } from "@/app/actions/planning-travail";
import { AgendaView } from "./AgendaView";
import { screenTitle } from "@/lib/ui";

export default async function AgendaPage() {
  const [taches, listes, tags, creneaux, exceptions] = await Promise.all([
    getTachesAvecRelations(),
    getListes(),
    getTags(),
    getPlanningTravail(),
    getPlanningTravailExceptions(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Agenda</h1>
      <AgendaView
        taches={taches}
        listes={listes}
        tags={tags}
        creneaux={creneaux}
        exceptions={exceptions}
      />
    </div>
  );
}
