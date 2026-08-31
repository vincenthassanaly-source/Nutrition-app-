"use client";

import { AddSousCategorieForm } from "./AddSousCategorieForm";
import { ghostButton } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function AddSousCategorieToggle({ categorieParentId }: { categorieParentId: string }) {
  const [open, show] = useBackCloseToggle();

  if (!open) {
    return (
      <button type="button" onClick={show} className={`${ghostButton} self-start`}>
        + Sous-catégorie
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-dashed border-line p-2.5">
      <AddSousCategorieForm categorieParentId={categorieParentId} onDone={() => history.back()} />
      <button
        type="button"
        onClick={() => history.back()}
        className="text-sm text-ink-2 underline"
      >
        Annuler
      </button>
    </div>
  );
}
