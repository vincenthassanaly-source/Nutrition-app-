import { Skeleton } from "@/components/skeletons/Skeleton";
import { GridSkeleton } from "@/components/skeletons/GridSkeleton";
import { screenTitle } from "@/lib/ui";

export default function CollectionLoading() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Collection</h1>
      <Skeleton className="h-11 w-full rounded-2xl" />
      <GridSkeleton />
    </div>
  );
}
