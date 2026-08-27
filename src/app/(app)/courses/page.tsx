import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { NewListeToggle } from "./NewListeToggle";
import { ListesCoursesList } from "./ListesCoursesList";
import { errorText, screenTitle } from "@/lib/ui";

export default async function CoursesPage() {
  await requireUser();
  const supabase = await createClient();

  const [{ data: listes, error }, { data: recettes }] = await Promise.all([
    supabase.from("listes_courses").select("*").order("created_at", { ascending: false }),
    supabase.from("recettes").select("*").order("nom", { ascending: true }),
  ]);

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Courses</h1>
      <NewListeToggle recettes={recettes ?? []} />
      <ListesCoursesList listes={listes ?? []} />
    </div>
  );
}
