import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

const STATUT_LABEL: Record<string, string> = {
  en_cours: "En cours",
  terminee: "Terminée",
};

export function ListesCoursesList({ listes }: { listes: Tables<"listes_courses">[] }) {
  if (listes.length === 0) {
    return <p className="text-neutral-500">Aucune liste de courses pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {listes.map((liste) => (
        <li key={liste.id}>
          <Link
            href={`/courses/${liste.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">{liste.nom}</p>
              <p className="text-sm text-neutral-500">
                {STATUT_LABEL[liste.statut]} ·{" "}
                {new Date(liste.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <span aria-hidden className="text-neutral-400">
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
