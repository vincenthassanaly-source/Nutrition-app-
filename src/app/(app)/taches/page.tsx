import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { TachesView } from "./TachesView";
import { screenTitle } from "@/lib/ui";

export default async function TachesPage() {
  const [taches, listes, tags] = await Promise.all([
    getTachesAvecRelations(),
    getListes(),
    getTags(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Tâches</h1>
      <TachesView taches={taches} listes={listes} tags={tags} />
    </div>
  );
}
