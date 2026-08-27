import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { ListeHeader } from "./ListeHeader";
import { ItemsChecklist } from "./ItemsChecklist";

export default async function ListeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const supabase = await createClient();

  const [{ data: liste }, { data: items }] = await Promise.all([
    supabase.from("listes_courses").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("listes_courses_items")
      .select("*, aliment:aliments(*)")
      .eq("liste_id", id),
  ]);

  if (!liste) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <ListeHeader liste={liste} />
      <ItemsChecklist items={items ?? []} />
    </div>
  );
}
