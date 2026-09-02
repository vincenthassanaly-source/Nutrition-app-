import { eyebrow } from "@/lib/ui";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { DashboardView } from "./DashboardView";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// Le header (statique, instantané) est rendu côté serveur ; le contenu
// (nutrition, tâches du jour, prochain événement, habitudes) est chargé
// côté client via TanStack Query dans DashboardView, section par section,
// chaque carte affichant son propre skeleton pendant isLoading — plutôt
// qu'un unique skeleton bloquant pour toute la page.
export default function DashboardPage() {
  const today = todayISO();
  const dateLabel = new Date(`${today}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-0.5">
        <p className={`${eyebrow} capitalize`}>{dateLabel}</p>
        <h1 className="font-display text-[25px] font-bold tracking-tight text-ink">{greeting()}</h1>
      </header>

      <GlobalSearchBar />

      <DashboardView today={today} />
    </div>
  );
}
