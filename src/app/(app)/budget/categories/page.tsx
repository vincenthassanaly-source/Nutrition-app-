import { getCategories } from "@/app/actions/categories-budget";
import { getSuiviCategories } from "@/app/actions/budgets";
import { premierJourDuMois, formatPeriode } from "@/lib/budget/compute";
import { eyebrow, screenTitle } from "@/lib/ui";
import { AddCategorieToggle } from "./AddCategorieToggle";
import { CategoriesList } from "./CategoriesList";

export default async function CategoriesBudgetPage() {
  const periode = premierJourDuMois();
  const [suiviDepenses, categories] = await Promise.all([
    getSuiviCategories(periode),
    getCategories(),
  ]);

  const categoriesRevenu = categories.filter((c) => c.type === "revenu");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={eyebrow}>{formatPeriode(periode)}</p>
        <h1 className={screenTitle}>Catégories</h1>
      </div>
      <AddCategorieToggle />
      <CategoriesList suiviDepenses={suiviDepenses} categoriesRevenu={categoriesRevenu} periode={periode} />
    </div>
  );
}
