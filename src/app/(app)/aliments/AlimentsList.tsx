"use client";

import { useState, useTransition } from "react";
import { AlimentForm } from "./AlimentForm";
import { deleteAliment } from "@/app/actions/aliments";
import type { Tables } from "@/lib/supabase/types";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

function AlimentRow({
  aliment,
  isOwner,
}: {
  aliment: Tables<"aliments">;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (editing) {
    return (
      <li className="rounded-lg border border-neutral-200 p-3">
        <AlimentForm aliment={aliment} onDone={() => setEditing(false)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-neutral-500 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="min-w-0">
        <p className="font-medium truncate">
          {aliment.nom}
          {!isOwner && (
            <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
              partagé
            </span>
          )}
        </p>
        <p className="text-sm text-neutral-500">
          {aliment.categorie ? `${aliment.categorie} · ` : ""}
          {aliment.kcal_100g} kcal / 100{UNITE_LABEL[aliment.unite]} · P{" "}
          {aliment.proteines_100g}g · G {aliment.glucides_100g}g · L{" "}
          {aliment.lipides_100g}g
        </p>
        {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
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
              setDeleteError(null);
              startTransition(async () => {
                try {
                  await deleteAliment(aliment.id);
                } catch (e) {
                  setDeleteError(e instanceof Error ? e.message : "Erreur inconnue.");
                }
              });
            }}
            className="rounded-md border border-red-300 px-2 py-1 text-red-600 disabled:opacity-60"
          >
            Suppr.
          </button>
        </div>
      )}
    </li>
  );
}

export function AlimentsList({
  aliments,
  userId,
}: {
  aliments: Tables<"aliments">[];
  userId: string;
}) {
  if (aliments.length === 0) {
    return <p className="text-neutral-500">Aucun aliment pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {aliments.map((aliment) => (
        <AlimentRow
          key={aliment.id}
          aliment={aliment}
          isOwner={aliment.user_id === userId}
        />
      ))}
    </ul>
  );
}
