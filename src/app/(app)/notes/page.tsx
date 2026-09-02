import { getTags } from "@/app/actions/taches";
import { getNotesAvecRelations } from "@/app/actions/notes";
import { AddNoteToggle } from "./AddNoteToggle";
import { NotesGrid } from "./NotesGrid";
import { screenTitle } from "@/lib/ui";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const [{ action }, notes, tags] = await Promise.all([
    searchParams,
    getNotesAvecRelations(),
    getTags(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Notes</h1>
      <AddNoteToggle tags={tags} defaultOpen={action === "new"} />
      <NotesGrid notes={notes} tags={tags} />
    </div>
  );
}
