import { createClient } from "@/lib/supabase/server";
import { AgendaView } from "./AgendaView";
import { errorText, screenTitle } from "@/lib/ui";

export default async function AgendaPage() {
  const supabase = await createClient();

  const { data: taches, error } = await supabase
    .from("taches")
    .select("*")
    .order("echeance", { ascending: true, nullsFirst: false })
    .order("heure", { ascending: true, nullsFirst: false });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Agenda</h1>
      <AgendaView taches={taches ?? []} />
    </div>
  );
}
