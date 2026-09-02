import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { TachesView } from "./TachesView";
import { screenTitle } from "@/lib/ui";

export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const [{ action }, taches, listes, tags] = await Promise.all([
    searchParams,
    getTachesAvecRelations(),
    getListes(),
    getTags(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Tâches</h1>
      <TachesView taches={taches} listes={listes} tags={tags} defaultOpen={action === "new"} />
    </div>
  );
}
