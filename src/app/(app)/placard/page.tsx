import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { AddPlacardToggle } from "./AddPlacardToggle";
import { PlacardList } from "./PlacardList";
import { RecettesRealisables } from "./RecettesRealisables";
import { matchRecetteAvecPlacard } from "@/lib/nutrition/matching";
import { errorText, screenTitle, sectionTitle } from "@/lib/ui";

export default async function PlacardPage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: placard, error }, { data: aliments }, { data: recettes }] = await Promise.all([
    supabase
      .from("placard")
      .select("*, aliment:aliments(*)")
      .order("id"),
    supabase.from("aliments").select("*").order("nom", { ascending: true }),
    supabase
      .from("recettes")
      .select("*, recette_ingredients(quantite, unite, aliment_id, aliment:aliments(nom))")
      .order("nom", { ascending: true }),
  ]);

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  const placardMap = new Map(
    (placard ?? []).map((item) => [item.aliment_id, item.quantite_disponible])
  );

  const entries = (recettes ?? []).map((recette) => {
    const ingredients = recette.recette_ingredients.map((ri) => ({
      aliment_id: ri.aliment_id,
      nom: ri.aliment.nom,
      quantite: ri.quantite,
      unite: ri.unite,
    }));
    return {
      recette,
      match: matchRecetteAvecPlacard(ingredients, placardMap),
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <h1 className={screenTitle}>Placard</h1>
        <AddPlacardToggle aliments={aliments ?? []} />
        <PlacardList items={placard ?? []} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Ce que tu peux cuisiner</h2>
        <RecettesRealisables entries={entries} />
      </div>
    </div>
  );
}
