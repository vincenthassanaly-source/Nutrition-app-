import Link from "next/link";
import type { RecetteMatch } from "@/lib/nutrition/matching";
import type { Tables } from "@/lib/supabase/types";
import { cardTight, nameText } from "@/lib/ui";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

export function RecettesRealisables({
  entries,
}: {
  entries: { recette: Tables<"recettes">; match: RecetteMatch }[];
}) {
  if (entries.length === 0) {
    return (
      <p className="text-ink-2">
        Crée des recettes dans l&apos;onglet Recettes pour voir ici ce que tu peux cuisiner.
      </p>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.match.realisable !== b.match.realisable) return a.match.realisable ? -1 : 1;
    return a.recette.nom.localeCompare(b.recette.nom);
  });

  return (
    <ul className="flex flex-col gap-2.5">
      {sorted.map(({ recette, match }) => (
        <li
          key={recette.id}
          className={cardTight}
          style={
            match.realisable
              ? { borderColor: "var(--accent-kcal)", background: "oklch(0.5 0.13 155 / 0.06)" }
              : undefined
          }
        >
          <div className="flex items-center justify-between gap-3">
            <Link href={`/recettes/${recette.id}`} className={nameText}>
              {recette.nom}
            </Link>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
              style={
                match.realisable
                  ? { background: "var(--accent-kcal)", color: "#fff" }
                  : { background: "var(--surface-alt)", color: "var(--ink-2)" }
              }
            >
              {match.realisable ? "Réalisable" : "Incomplet"}
            </span>
          </div>
          {!match.realisable && (
            <p className="mt-1 font-mono text-xs text-ink-2">
              Manque :{" "}
              {match.manquants
                .map(
                  (m) =>
                    `${m.nom} (${m.manque} ${UNITE_LABEL[m.unite]} manquant${m.manque > 1 ? "s" : ""})`
                )
                .join(", ")}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
