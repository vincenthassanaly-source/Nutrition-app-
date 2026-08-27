export type Nutrition = {
  kcal: number;
  proteines: number;
  glucides: number;
  lipides: number;
};

export function zeroNutrition(): Nutrition {
  return { kcal: 0, proteines: 0, glucides: 0, lipides: 0 };
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    kcal: a.kcal + b.kcal,
    proteines: a.proteines + b.proteines,
    glucides: a.glucides + b.glucides,
    lipides: a.lipides + b.lipides,
  };
}

export function scaleNutrition(n: Nutrition, factor: number): Nutrition {
  return {
    kcal: n.kcal * factor,
    proteines: n.proteines * factor,
    glucides: n.glucides * factor,
    lipides: n.lipides * factor,
  };
}

type AlimentMacros = {
  kcal_100g: number;
  proteines_100g: number;
  glucides_100g: number;
  lipides_100g: number;
};

/** Les valeurs nutritionnelles d'un aliment sont toujours données "pour 100 unités"
 * (100g, 100ml ou 100 pièces selon `unite`), donc le calcul est identique quelle que
 * soit l'unité. */
export function nutritionAliment(aliment: AlimentMacros, quantite: number): Nutrition {
  const facteur = quantite / 100;
  return {
    kcal: aliment.kcal_100g * facteur,
    proteines: aliment.proteines_100g * facteur,
    glucides: aliment.glucides_100g * facteur,
    lipides: aliment.lipides_100g * facteur,
  };
}

/** `portionsConsommees` est le nombre de portions de la recette effectivement mangées
 * (peut être fractionnaire, ex. 0.5). */
export function nutritionRecette(
  ingredients: { aliment: AlimentMacros; quantite: number }[],
  portionsTotal: number,
  portionsConsommees: number
): Nutrition {
  const total = ingredients.reduce(
    (acc, ing) => addNutrition(acc, nutritionAliment(ing.aliment, ing.quantite)),
    zeroNutrition()
  );
  const parPortion = scaleNutrition(total, 1 / portionsTotal);
  return scaleNutrition(parPortion, portionsConsommees);
}
