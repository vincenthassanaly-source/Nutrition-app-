import type { Enums } from "@/lib/supabase/types";

export type IngredientBesoin = {
  aliment_id: string;
  nom: string;
  quantite: number;
  unite: Enums<"unite_mesure">;
};

export type IngredientManquant = IngredientBesoin & {
  disponible: number;
  manque: number;
};

export type RecetteMatch = {
  realisable: boolean;
  manquants: IngredientManquant[];
};

/**
 * Une recette est réalisable si, pour chaque ingrédient, la quantité disponible
 * au placard (0 si absent) est >= la quantité requise. Pas de conversion d'unité :
 * l'unité du placard est toujours celle de l'aliment, tout comme celle des
 * ingrédients de recette (dérivée à l'ajout), donc la comparaison est directe.
 */
export function matchRecetteAvecPlacard(
  ingredients: IngredientBesoin[],
  placard: Map<string, number>
): RecetteMatch {
  const manquants: IngredientManquant[] = [];

  for (const ingredient of ingredients) {
    const disponible = placard.get(ingredient.aliment_id) ?? 0;
    if (disponible < ingredient.quantite) {
      manquants.push({
        ...ingredient,
        disponible,
        manque: ingredient.quantite - disponible,
      });
    }
  }

  return { realisable: manquants.length === 0, manquants };
}
