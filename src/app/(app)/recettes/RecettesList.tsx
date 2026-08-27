import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";

const SOURCE_LABEL: Record<string, string> = {
  manuel: "Manuel",
  hellofresh: "HelloFresh",
};

export function RecettesList({
  recettes,
  userId,
}: {
  recettes: Tables<"recettes">[];
  userId: string;
}) {
  if (recettes.length === 0) {
    return <p className="text-neutral-500">Aucune recette pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {recettes.map((recette) => (
        <li key={recette.id}>
          <Link
            href={`/recettes/${recette.id}`}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3"
          >
            <div className="min-w-0">
              <p className="font-medium truncate">
                {recette.nom}
                {recette.user_id !== userId && (
                  <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                    partagé
                  </span>
                )}
              </p>
              <p className="text-sm text-neutral-500">
                {SOURCE_LABEL[recette.source]}
                {recette.temps_prepa_min != null ? ` · ${recette.temps_prepa_min} min` : ""}
                {" · "}
                {recette.portions} portion{recette.portions > 1 ? "s" : ""}
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
