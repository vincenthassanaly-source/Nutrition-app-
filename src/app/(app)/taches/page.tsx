import { TachesView } from "./TachesView";
import { screenTitle } from "@/lib/ui";

// Le shell (titre) reste rendu instantanément côté serveur ; les données
// (tâches/listes/tags) sont chargées côté client via TanStack Query dans
// TachesView, qui affiche un skeleton pendant isLoading — voir 2.2 du prompt
// de session (reports/2026-09-02-fluidite-ux-globale.md pour le détail).
export default async function TachesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Tâches</h1>
      <TachesView defaultOpen={action === "new"} />
    </div>
  );
}
