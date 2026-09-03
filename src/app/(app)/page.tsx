import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { eyebrow } from "@/lib/ui";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { DashboardView } from "./DashboardView";
import { makeServerQueryClient } from "@/lib/query/server-client";
import { queryKeys } from "@/lib/query/keys";
import { getListes, getTachesAvecRelations, getTags } from "@/app/actions/taches";
import { getHabitudesDuJour } from "@/app/actions/habitudes";
import { getResumeNutritionJour } from "@/app/actions/journal";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Le header (statique, instantané) est rendu côté serveur. Le contenu est
// préchargé côté serveur (mêmes queryKeys que DashboardView) et hydraté dans
// le QueryClient du navigateur via HydrationBoundary : le premier rendu a
// déjà les données, sans refetch réseau post-hydratation ni cold start
// serverless visible. DashboardView garde ses useQuery/skeletons pour les
// navigations et refetch ultérieurs (cache stale après 30s).
export default async function DashboardPage() {
  const today = todayISO();
  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const queryClient = makeServerQueryClient();
  await Promise.all([
    queryClient.prefetchQuery({ queryKey: queryKeys.taches, queryFn: getTachesAvecRelations }),
    queryClient.prefetchQuery({ queryKey: queryKeys.habitudes(today), queryFn: () => getHabitudesDuJour(today) }),
    queryClient.prefetchQuery({
      queryKey: queryKeys.objectifNutritionnel("repos"),
      queryFn: () => getResumeNutritionJour(today, "repos"),
    }),
    queryClient.prefetchQuery({ queryKey: queryKeys.listes, queryFn: getListes }),
    queryClient.prefetchQuery({ queryKey: queryKeys.tags, queryFn: getTags }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <p className={`${eyebrow} capitalize`}>{dateLabel}</p>
        <h1 className="font-display text-[25px] font-bold tracking-tight text-ink">{greeting()}</h1>
      </header>

      <GlobalSearchBar />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardView today={today} />
      </HydrationBoundary>
    </div>
  );
}
