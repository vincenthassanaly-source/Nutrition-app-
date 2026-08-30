import { addDays, addMonths, addWeeks, addYears } from "date-fns";
import type { Enums } from "@/lib/supabase/types";

export type StatutBudget = "ok" | "proche" | "depasse";

type CategorieBudgetLike = { id: string; categorie_parent_id: string | null };

/**
 * Regroupe une liste plate de catégories en arborescence à un seul niveau
 * (catégories principales + leurs sous-catégories), pour l'affichage imbriqué
 * dans /budget/categories et le regroupement du sélecteur de /budget/transactions.
 */
export function regrouperParCategorieParente<T extends CategorieBudgetLike>(
  categories: T[]
): { parent: T; sousCategories: T[] }[] {
  const parents = categories.filter((c) => !c.categorie_parent_id);
  return parents.map((parent) => ({
    parent,
    sousCategories: categories.filter((c) => c.categorie_parent_id === parent.id),
  }));
}

const SEUIL_PROCHE = 0.8;

/** cible <= 0 signifie "pas de budget défini" : toute dépense est alors considérée
 * comme un dépassement (rien n'était prévu), sans quoi la barre resterait toujours
 * verte pour une catégorie sans budget cible. */
export function statutBudget(consomme: number, cible: number): StatutBudget {
  if (cible <= 0) return consomme > 0 ? "depasse" : "ok";
  const pct = consomme / cible;
  if (pct > 1) return "depasse";
  if (pct >= SEUIL_PROCHE) return "proche";
  return "ok";
}

export function formatMontant(montant: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(montant);
}

export function premierJourDuMois(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Borne exclusive haute pour une requête `gte(periode) / lt(finDuMois)` sur une
 * colonne date, à partir d'une période au format "YYYY-MM-01". */
export function finDuMois(periode: string): string {
  const [annee, mois] = periode.split("-").map(Number);
  return new Date(Date.UTC(annee, mois, 1)).toISOString().slice(0, 10);
}

export function formatPeriode(periode: string): string {
  return new Date(`${periode}T00:00:00Z`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const FREQUENCE_LABELS: Record<Enums<"frequence_recurrence">, string> = {
  quotidien: "Quotidien",
  hebdomadaire: "Hebdomadaire",
  mensuel: "Mensuel",
  annuel: "Annuel",
};

export function aujourdhuiISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Calcule la prochaine occurrence d'une transaction récurrente à partir
 * d'une date ISO ("YYYY-MM-DD") et de sa fréquence.
 *
 * Décision de calage fin de mois / année (documentée plutôt que laissée
 * implicite) : on reprend tel quel le comportement de `date-fns`
 * (`addMonths`/`addYears`), qui cale sur le dernier jour du mois cible quand
 * le jour d'origine n'y existe pas — ex. 31 janvier + 1 mois → 28 (ou 29)
 * février, 29 février + 1 an → 28 février une année non bissextile.
 *
 * Les composants année/mois/jour sont extraits et reconstruits en date
 * locale (jamais via `toISOString`, qui convertit en UTC et peut décaler
 * la date d'un jour selon le fuseau du serveur) : le calcul de calendrier
 * reste correct quel que soit le fuseau du processus qui l'exécute.
 */
export function calculerProchaineOccurrence(
  dateISO: string,
  frequence: Enums<"frequence_recurrence">
): string {
  const [annee, mois, jour] = dateISO.split("-").map(Number);
  const date = new Date(annee, mois - 1, jour);

  const suivante = (() => {
    switch (frequence) {
      case "quotidien":
        return addDays(date, 1);
      case "hebdomadaire":
        return addWeeks(date, 1);
      case "mensuel":
        return addMonths(date, 1);
      case "annuel":
        return addYears(date, 1);
    }
  })();

  const anneeSuivante = suivante.getFullYear();
  const moisSuivant = String(suivante.getMonth() + 1).padStart(2, "0");
  const jourSuivant = String(suivante.getDate()).padStart(2, "0");
  return `${anneeSuivante}-${moisSuivant}-${jourSuivant}`;
}
