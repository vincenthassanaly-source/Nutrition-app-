import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { getHorairesTravail } from "@/app/actions/horaires";
import { AgendaView } from "./AgendaView";
import { screenTitle } from "@/lib/ui";

export default async function AgendaPage() {
  const [taches, listes, tags, horaires] = await Promise.all([
    getTachesAvecRelations(),
    getListes(),
    getTags(),
    getHorairesTravail(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Agenda</h1>
      <AgendaView taches={taches} listes={listes} tags={tags} horaires={horaires} />
    </div>
  );
}
