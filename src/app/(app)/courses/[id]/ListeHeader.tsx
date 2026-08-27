"use client";

import { useState, useTransition } from "react";
import { updateListeStatut, deleteListe } from "@/app/actions/listes-courses";
import type { Tables } from "@/lib/supabase/types";

const STATUT_LABEL: Record<string, string> = {
  en_cours: "En cours",
  terminee: "Terminée",
};

export function ListeHeader({ liste }: { liste: Tables<"listes_courses"> }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isTerminee = liste.statut === "terminee";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{liste.nom}</h1>
          <p className="text-sm text-neutral-500">{STATUT_LABEL[liste.statut]}</p>
        </div>
        <div className="flex shrink-0 gap-2 text-sm">
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await updateListeStatut(liste.id, isTerminee ? "en_cours" : "terminee");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur inconnue.");
                }
              });
            }}
            className="rounded-md border border-neutral-300 px-2 py-1"
          >
            {isTerminee ? "Rouvrir" : "Marquer terminée"}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                try {
                  await deleteListe(liste.id);
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
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
