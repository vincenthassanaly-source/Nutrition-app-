import { Skeleton } from "@/components/skeletons/Skeleton";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { screenTitle } from "@/lib/ui";

export default function HabitudesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Habitudes</h1>
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-11 w-full rounded-2xl" />
      <ListItemSkeletonGroup count={3} withSubtitle />
    </div>
  );
}
