"use client";

import { useState, useTransition } from "react";
import { RecetteForm } from "../RecetteForm";
import { deleteRecette } from "@/app/actions/recettes";
import type { Tables } from "@/lib/supabase/types";

const SOURCE_LABEL: Record<string, string> = {
  manuel: "Manuel",
  hellofresh: "HelloFresh",
};

export function RecetteHeader({
  recette,
  isOwner,
}: {
  recette: Tables<"recettes">;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (editing) {
    return (
      <div className="rounded-lg border border-neutral-200 p-3">
        <RecetteForm recette={recette} onDone={() => setEditing(false)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-neutral-500 underline"
        >
          Annuler
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">
            {recette.nom}
            {!isOwner && (
              <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500 align-middle">
                partagé
              </span>
            )}
          </h1>
          <p className="text-sm text-neutral-500">
            {SOURCE_LABEL[recette.source]}
            {recette.temps_prepa_min != null ? ` · ${recette.temps_prepa_min} min` : ""}
            {" · "}
            {recette.portions} portion{recette.portions > 1 ? "s" : ""}
          </p>
        </div>
        {isOwner && (
          <div className="flex shrink-0 gap-2 text-sm">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-neutral-300 px-2 py-1"
            >
              Éditer
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  try {
                    await deleteRecette(recette.id);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur inconnue.");
                  }
                });
              }}
              className="rounded-md border border-red-300 px-2 py-1 text-red-600 disabled:opacity-60"
            >
              Suppr.
            </button>
          </div>
        )}
      </div>
      {recette.description && <p className="text-neutral-700">{recette.description}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
