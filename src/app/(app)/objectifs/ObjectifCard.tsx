"use client";

import Link from "next/link";
import { useTransition } from "react";
import { supprimerObjectif } from "@/app/actions/objectifs";
import { ObjectifForm } from "./ObjectifForm";
import type { Enums, Tables } from "@/lib/supabase/types";
import { card, dangerButton, ghostButton, listCard, metaText, nameText, pillTag } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

const TYPE_SUIVI_LABELS: Record<Enums<"type_suivi_objectif">, string> = {
  valeur: "Valeur",
  etapes: "Étapes",
  binaire: "Fait / pas fait",
};

function formatEcheance(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ObjectifCard({ objectif }: { objectif: Tables<"objectifs"> }) {
  const [editing, edit] = useBackCloseToggle();
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <ObjectifForm objectif={objectif} onDone={() => history.back()} />
        <button
          type="button"
          onClick={() => history.back()}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className={listCard}>
      <Link href={`/objectifs/${objectif.id}`} className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className={nameText}>{objectif.titre}</p>
          <span className={pillTag}>{TYPE_SUIVI_LABELS[objectif.type_suivi]}</span>
        </div>
        {objectif.description && (
          <p className="line-clamp-2 text-[13px] text-ink-2">{objectif.description}</p>
        )}
        {objectif.date_echeance && (
          <span className={metaText}>Échéance : {formatEcheance(objectif.date_echeance)}</span>
        )}
      </Link>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={edit} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => supprimerObjectif(objectif.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}
