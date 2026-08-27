"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateListeStatut, deleteListe } from "@/app/actions/listes-courses";
import type { Tables } from "@/lib/supabase/types";
import { dangerButton, errorText, ghostButton, linkButton } from "@/lib/ui";

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
      <Link href="/courses" className={linkButton}>
        ‹ Courses
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="mt-1 truncate font-display text-[22px] font-semibold text-ink">{liste.nom}</h1>
          <p className="text-[13px] text-ink-2">{STATUT_LABEL[liste.statut]}</p>
        </div>
        <div className="flex shrink-0 gap-2">
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
            className={ghostButton}
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
            className={dangerButton}
          >
            Suppr.
          </button>
        </div>
      </div>
      {error && <p className={errorText}>{error}</p>}
    </div>
  );
}
