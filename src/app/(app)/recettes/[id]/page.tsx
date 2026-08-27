import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { RecetteHeader } from "./RecetteHeader";
import { RecetteMacros } from "./RecetteMacros";
import { IngredientManager } from "./IngredientManager";
import { nutritionRecette } from "@/lib/nutrition/compute";
import { sectionTitle } from "@/lib/ui";

export default async function RecetteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const [{ data: recette }, { data: ingredients }, { data: aliments }] = await Promise.all([
    supabase.from("recettes").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("recette_ingredients")
      .select("*, aliment:aliments(*)")
      .eq("recette_id", id)
      .order("id"),
    supabase.from("aliments").select("*").order("nom", { ascending: true }),
  ]);

  if (!recette) {
    notFound();
  }

  const isOwner = recette.user_id === user.id;
  const perPortion = nutritionRecette(ingredients ?? [], recette.portions, 1);

  return (
    <div className="flex flex-col gap-6">
      <RecetteHeader recette={recette} isOwner={isOwner} />
      {(ingredients ?? []).length > 0 && <RecetteMacros perPortion={perPortion} />}
      <div className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Ingrédients</h2>
        <IngredientManager
          recetteId={id}
          isOwner={isOwner}
          ingredients={ingredients ?? []}
          aliments={aliments ?? []}
        />
      </div>
    </div>
  );
}
