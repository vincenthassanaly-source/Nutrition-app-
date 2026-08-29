import { createClient } from "@/lib/supabase/server";
import { AddRecetteToggle } from "./AddRecetteToggle";
import { RecettesList } from "./RecettesList";
import { nutritionRecette } from "@/lib/nutrition/compute";
import { errorText, screenTitle } from "@/lib/ui";

export default async function RecettesPage() {
  const supabase = await createClient();

  const { data: recettes, error } = await supabase
    .from("recettes")
    .select(
      "*, recette_ingredients(quantite, aliment:aliments(kcal_100g, proteines_100g, glucides_100g, lipides_100g))"
    )
    .order("nom", { ascending: true });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  const views = (recettes ?? []).map((recette) => {
    const { recette_ingredients, ...rest } = recette;
    return {
      ...rest,
      kcalParPortion: Math.round(
        nutritionRecette(recette_ingredients, recette.portions, 1).kcal
      ),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Recettes</h1>
      <AddRecetteToggle />
      <RecettesList recettes={views} />
    </div>
  );
}
