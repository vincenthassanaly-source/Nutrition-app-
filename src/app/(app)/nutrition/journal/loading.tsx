import { Skeleton } from "@/components/skeletons/Skeleton";
import { CardSkeleton } from "@/components/skeletons/CardSkeleton";
import { ListItemSkeletonGroup } from "@/components/skeletons/ListItemSkeleton";
import { eyebrow, screenTitle } from "@/lib/ui";

export default function JournalLoading() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-full rounded-2xl" />
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className={eyebrow}>&nbsp;</p>
          <h1 className={screenTitle}>Journal</h1>
        </div>
      </div>
      <Skeleton className="h-11 w-full rounded-2xl" />
      <CardSkeleton withRing={false} />
      <ListItemSkeletonGroup count={4} />
    </div>
  );
}
