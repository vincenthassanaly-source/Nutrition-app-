import { createClient } from "@/lib/supabase/server";
import { AddNoteToggle } from "./AddNoteToggle";
import { NotesList } from "./NotesList";
import { errorText, screenTitle } from "@/lib/ui";

export default async function NotesPage() {
  const supabase = await createClient();

  const { data: notes, error } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className={errorText}>Erreur de chargement : {error.message}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Notes</h1>
      <AddNoteToggle />
      <NotesList notes={notes ?? []} />
    </div>
  );
}
