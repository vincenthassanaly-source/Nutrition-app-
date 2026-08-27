import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { AddAlimentToggle } from "./AddAlimentToggle";
import { AlimentsList } from "./AlimentsList";
import { errorText, screenTitle } from "@/lib/ui";

export default async function AlimentsPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: aliments, error } = await supabase
    .from("aliments")
    .select("*")
    .order("nom", { ascending: true });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Aliments</h1>
      <AddAlimentToggle />
      <AlimentsList aliments={aliments ?? []} userId={user.id} />
    </div>
  );
}
