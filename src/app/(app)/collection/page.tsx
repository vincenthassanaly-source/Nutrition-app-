import { getCollectionsAvecApercu } from "@/app/actions/collections";
import { AddCollectionToggle } from "./AddCollectionToggle";
import { CollectionsGrid } from "./CollectionsGrid";
import { screenTitle } from "@/lib/ui";

export default async function CollectionPage() {
  const collections = await getCollectionsAvecApercu();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Collection</h1>
      <AddCollectionToggle />
      <CollectionsGrid collections={collections} />
    </div>
  );
}
