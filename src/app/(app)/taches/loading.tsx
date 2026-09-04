import { Skeleton } from "@/components/skeletons/Skeleton";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { screenTitle } from "@/lib/ui";

export default function TachesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Tâches</h1>
      <Skeleton className="h-10 w-full rounded-2xl" />
      <div className="flex items-center gap-2 overflow-x-hidden pb-1">
        <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
        <Skeleton className="h-7 w-28 shrink-0 rounded-full" />
        <Skeleton className="h-7 w-20 shrink-0 rounded-full" />
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
      <ListItemSkeletonGroup count={5} />
    </div>
  );
}
