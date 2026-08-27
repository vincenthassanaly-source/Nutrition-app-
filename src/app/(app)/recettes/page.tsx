import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { AddRecetteToggle } from "./AddRecetteToggle";
import { RecettesList } from "./RecettesList";

export default async function RecettesPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: recettes, error } = await supabase
    .from("recettes")
    .select("*")
    .order("nom", { ascending: true });

  if (error) {
    return <p className="text-red-600">Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Recettes</h1>
      <AddRecetteToggle />
      <RecettesList recettes={recettes ?? []} userId={user.id} />
    </div>
  );
}
