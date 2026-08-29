"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { input, kcalPillTag, listCard, metaText, nameText } from "@/lib/ui";

const SOURCE_LABEL: Record<string, string> = {
  manuel: "Manuel",
  hellofresh: "HelloFresh",
};

type RecetteView = Tables<"recettes"> & { kcalParPortion: number };

export function RecettesList({
  recettes,
}: {
  recettes: RecetteView[];
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => recettes.filter((r) => r.nom.toLowerCase().includes(search.toLowerCase())),
    [recettes, search]
  );

  if (recettes.length === 0) {
    return <p className="text-ink-2">Aucune recette pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder="Rechercher une recette…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={input}
      />
      {filtered.length === 0 ? (
        <p className="py-5 text-center text-sm text-ink-3">Aucune recette ne correspond à ta recherche.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((recette) => (
            <li key={recette.id}>
              <Link href={`/recettes/${recette.id}`} className={listCard}>
                <div className="flex items-center justify-between gap-2">
                  <p className={nameText}>{recette.nom}</p>
                  <span className={kcalPillTag}>{recette.kcalParPortion} kcal/portion</span>
                </div>
                <p className={metaText}>
                  {SOURCE_LABEL[recette.source]}
                  {recette.temps_prepa_min != null ? ` · ${recette.temps_prepa_min} min` : ""}
                  {" · "}
                  {recette.portions} portion{recette.portions > 1 ? "s" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export type { RecetteView };
