import { getComptesAvecSolde } from "@/app/actions/comptes";
import { getCategories } from "@/app/actions/categories-budget";
import { getTransactions } from "@/app/actions/transactions";
import { screenTitle } from "@/lib/ui";
import { AddTransactionToggle } from "./AddTransactionToggle";
import { TransactionsFilters } from "./TransactionsFilters";
import { TransactionsList } from "./TransactionsList";

// Les transactions sont ajoutées quasi exclusivement en écriture directe en
// base (hors Server Action) par Claude Code en session, donc rien ne doit
// jamais mettre cette route en cache (cf. /nutrition/journal, même pattern).
export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ compte?: string; categorie?: string; mois?: string }>;
}) {
  const { compte, categorie, mois } = await searchParams;

  const [comptes, categories] = await Promise.all([getComptesAvecSolde(), getCategories()]);

  const transactions = await getTransactions({
    compteId: compte,
    categorieId: categorie,
    mois: mois ? `${mois}-01` : undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Transactions</h1>
      <TransactionsFilters comptes={comptes} categories={categories} />
      <AddTransactionToggle comptes={comptes} categories={categories} />
      <TransactionsList transactions={transactions} comptes={comptes} categories={categories} />
    </div>
  );
}
