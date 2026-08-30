import Link from "next/link";
import { getComptesAvecSolde } from "@/app/actions/comptes";
import { getResumeMois } from "@/app/actions/transactions";
import { getSuiviCategories } from "@/app/actions/budgets";
import { genererOccurrencesDues } from "@/app/actions/transactions-recurrentes";
import { formatMontant, formatPeriode, premierJourDuMois } from "@/lib/budget/compute";
import { card, eyebrow, screenTitle, sectionTitle } from "@/lib/ui";

// Les transactions sont ajoutées quasi exclusivement en écriture directe en
// base par Claude Code en session : cette route ne doit jamais rester en
// cache (cf. /nutrition/journal, même pattern).
export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const periode = premierJourDuMois();

  // Pas de cron dans ce repo : les occurrences récurrentes dues sont
  // générées ici, avant les lectures ci-dessous, pour qu'elles apparaissent
  // immédiatement dans les totaux du mois affichés.
  await genererOccurrencesDues();

  const [comptes, resumeMois, suiviCategories] = await Promise.all([
    getComptesAvecSolde(),
    getResumeMois(periode),
    getSuiviCategories(periode),
  ]);

  const totalSoldes = comptes.reduce((acc, c) => acc + c.solde, 0);
  const soldeMois = resumeMois.totalRevenus - resumeMois.totalDepenses;
  const enDepassement = suiviCategories.filter((s) => s.statut !== "ok");

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className={eyebrow}>Budget</p>
        <h1 className={screenTitle}>Vue d&apos;ensemble</h1>
      </div>

      <div className={`${card} flex flex-col gap-1`}>
        <p className={eyebrow}>Solde total</p>
        <p
          className={`font-display text-3xl font-semibold ${totalSoldes < 0 ? "text-alert" : "text-ink"}`}
        >
          {formatMontant(totalSoldes)}
        </p>
        <Link href="/budget/comptes" className="mt-1 text-sm font-semibold text-budget">
          {comptes.length === 0
            ? "Ajouter un compte →"
            : `Voir ${comptes.length === 1 ? "le compte" : `les ${comptes.length} comptes`} →`}
        </Link>
      </div>

      <div className={`${card} flex flex-col gap-3`}>
        <p className={sectionTitle}>{formatPeriode(periode)}</p>
        <div className="flex gap-5">
          <div className="flex flex-col gap-0.5">
            <span className={eyebrow}>Revenus</span>
            <span className="font-display text-lg font-semibold text-kcal">
              {formatMontant(resumeMois.totalRevenus)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={eyebrow}>Dépenses</span>
            <span className="font-display text-lg font-semibold text-ink">
              {formatMontant(resumeMois.totalDepenses)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className={eyebrow}>Solde</span>
            <span
              className={`font-display text-lg font-semibold ${soldeMois < 0 ? "text-alert" : "text-ink"}`}
            >
              {formatMontant(soldeMois)}
            </span>
          </div>
        </div>
        <Link href="/budget/transactions" className="text-sm font-semibold text-budget">
          Voir les transactions →
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className={sectionTitle}>Catégories en dépassement</p>
        {enDepassement.length === 0 ? (
          <p className="text-ink-2">Aucune catégorie en dépassement ce mois-ci.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {enDepassement.map((suivi) => {
              const pct =
                suivi.cible > 0 ? Math.min(100, Math.round((suivi.consomme / suivi.cible) * 100)) : 100;
              const color = suivi.statut === "depasse" ? "var(--accent-alert)" : "var(--accent-carbs)";

              return (
                <li key={suivi.categorie.id} className={`${card} flex flex-col gap-2`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-[14px] font-semibold text-ink">
                      {suivi.categorie.icone && <span>{suivi.categorie.icone}</span>}
                      {suivi.categorie.nom}
                    </p>
                    <span
                      className={`text-[12.5px] font-mono ${suivi.statut === "depasse" ? "text-alert" : "text-ink-2"}`}
                    >
                      {formatMontant(suivi.consomme)} / {formatMontant(suivi.cible)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/budget/categories" className="text-sm font-semibold text-budget">
          Voir toutes les catégories →
        </Link>
      </div>

      <div className={`${card} flex flex-col gap-2`}>
        <p className={sectionTitle}>Autres vues</p>
        <Link href="/budget/recurrentes" className="text-sm font-semibold text-budget">
          🔁 Transactions récurrentes →
        </Link>
        <Link href="/budget/calendrier" className="text-sm font-semibold text-budget">
          📅 Calendrier →
        </Link>
        <Link href="/budget/statistiques" className="text-sm font-semibold text-budget">
          📊 Statistiques →
        </Link>
      </div>
    </div>
  );
}
