import { Skeleton } from "./Skeleton";
import { card } from "@/lib/ui";

/** Silhouette d'une carte type dashboard : un rond (icône/ring) + deux
 * lignes de texte. Reprend le padding/rayon/ombre de `card` (src/lib/ui.ts)
 * pour que la mise en page ne "saute" pas quand le vrai contenu arrive. */
export function CardSkeleton({ withRing = true }: { withRing?: boolean }) {
  return (
    <div className={`${card} flex items-center gap-3.5`}>
      {withRing && <Skeleton className="h-[60px] w-[60px] shrink-0 rounded-full" />}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-1.5 w-full rounded-full" />
      </div>
    </div>
  );
}
