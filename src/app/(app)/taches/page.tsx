import { createClient } from "@/lib/supabase/server";
import { AddTaskToggle } from "./AddTaskToggle";
import { TasksList } from "./TasksList";
import { errorText, screenTitle } from "@/lib/ui";

export default async function TachesPage() {
  const supabase = await createClient();

  const { data: taches, error } = await supabase
    .from("taches")
    .select("*")
    .order("fait", { ascending: true })
    .order("echeance", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Tâches</h1>
      <AddTaskToggle />
      <TasksList taches={taches ?? []} />
    </div>
  );
}
