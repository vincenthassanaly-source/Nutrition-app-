import type { ResumeMoisPlage } from "@/app/actions/transactions";

/**
 * Barres groupées dépenses/revenus par mois, sur le pattern SVG à la main de
 * `ObjectifSuiviValeur.tsx` (`EvolutionChart`) — pas de librairie de
 * graphiques (cf. rapport).
 */
export function TendanceChart({ donnees }: { donnees: ResumeMoisPlage[] }) {
  if (donnees.length === 0) return null;

  const width = 320;
  const height = 140;
  const padding = 8;
  const hauteurEtiquette = 14;
  const hauteurBarres = height - padding * 2 - hauteurEtiquette;

  const maxValeur = Math.max(1, ...donnees.flatMap((d) => [d.totalDepenses, d.totalRevenus]));
  const largeurGroupe = (width - padding * 2) / donnees.length;
  const largeurBarre = largeurGroupe / 3.5;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Évolution des dépenses et revenus sur les derniers mois"
    >
      {donnees.map((d, i) => {
        const xGroupe = padding + i * largeurGroupe;
        const hDepenses = (d.totalDepenses / maxValeur) * hauteurBarres;
        const hRevenus = (d.totalRevenus / maxValeur) * hauteurBarres;
        const baseY = height - hauteurEtiquette;
        const libelleMois = new Date(`${d.periode}T00:00:00Z`).toLocaleDateString("fr-FR", {
          month: "short",
          timeZone: "UTC",
        });

        return (
          <g key={d.periode}>
            <rect
              x={xGroupe + largeurGroupe / 2 - largeurBarre - 1}
              y={baseY - hDepenses}
              width={largeurBarre}
              height={hDepenses}
              fill="var(--accent-alert)"
              rx={2}
            />
            <rect
              x={xGroupe + largeurGroupe / 2 + 1}
              y={baseY - hRevenus}
              width={largeurBarre}
              height={hRevenus}
              fill="var(--accent-kcal)"
              rx={2}
            />
            <text
              x={xGroupe + largeurGroupe / 2}
              y={height - 2}
              textAnchor="middle"
              fontSize={8}
              fill="var(--ink-2)"
            >
              {libelleMois}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
