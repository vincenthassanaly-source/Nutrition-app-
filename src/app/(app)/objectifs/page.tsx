import { getObjectifs } from "@/app/actions/objectifs";
import { screenTitle } from "@/lib/ui";
import { AddObjectifToggle } from "./AddObjectifToggle";
import { ObjectifsList } from "./ObjectifsList";

export default async function ObjectifsPage() {
  const objectifs = await getObjectifs();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Objectifs</h1>
      <AddObjectifToggle />
      <ObjectifsList objectifs={objectifs} />
    </div>
  );
}
