import { Skeleton } from "@/components/skeletons/Skeleton";
import { eyebrow, screenTitle, card } from "@/lib/ui";

export default function BudgetLoading() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className={eyebrow}>Budget</p>
        <h1 className={screenTitle}>Vue d&apos;ensemble</h1>
      </div>
      <div className={`${card} flex flex-col gap-2`}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-40" />
      </div>
      <div className={`${card} flex flex-col gap-3`}>
        <Skeleton className="h-3.5 w-28" />
        <div className="flex gap-5">
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
          <Skeleton className="h-10 w-16" />
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-44" />
        <Skeleton className="h-16 w-full rounded-[20px]" />
        <Skeleton className="h-16 w-full rounded-[20px]" />
      </div>
    </div>
  );
}
