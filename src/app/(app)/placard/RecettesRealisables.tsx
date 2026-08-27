import Link from "next/link";
import type { RecetteMatch } from "@/lib/nutrition/matching";
import type { Tables } from "@/lib/supabase/types";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

export function RecettesRealisables({
  entries,
}: {
  entries: { recette: Tables<"recettes">; match: RecetteMatch }[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-neutral-500">
        Crée des recettes dans l&apos;onglet Recettes pour voir ici ce que tu peux cuisiner.
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.match.realisable !== b.match.realisable) return a.match.realisable ? -1 : 1;
    return a.recette.nom.localeCompare(b.recette.nom);
  });

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map(({ recette, match }) => (
        <li
          key={recette.id}
          className={`rounded-lg border p-3 ${
            match.realisable ? "border-green-300 bg-green-50" : "border-neutral-200"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <Link href={`/recettes/${recette.id}`} className="font-medium">
              {recette.nom}
            </Link>
            <span
              className={`text-xs rounded px-1.5 py-0.5 ${
                match.realisable
                  ? "bg-green-600 text-white"
                  : "bg-neutral-100 text-neutral-600"
              }`}
            >
              {match.realisable ? "Réalisable" : "Incomplet"}
            </span>
          </div>
          {!match.realisable && (
            <p className="mt-1 text-sm text-neutral-500">
              Manque :{" "}
              {match.manquants
                .map(
                  (m) =>
                    `${m.nom} (${m.manque} ${UNITE_LABEL[m.unite]} manquant${
                      m.manque > 1 ? "s" : ""
                    })`
                )
                .join(", ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
