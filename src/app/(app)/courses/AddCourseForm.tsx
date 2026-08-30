"use client";

import { useState, useTransition } from "react";
import { createCourseItem } from "@/app/actions/courses";
import { errorText, input, primaryButton } from "@/lib/ui";

export function AddCourseForm({ onDone }: { onDone?: () => void }) {
  const [libelle, setLibelle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = libelle.trim();
    if (!trimmed) {
      setError("Le libellé est requis.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await createCourseItem(trimmed);
        setLibelle("");
        onDone?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        name="libelle"
        autoFocus
        value={libelle}
        onChange={(e) => setLibelle(e.target.value)}
        placeholder="Ex. Pâtes, 2 avocats..."
        className={input}
      />

      {error && (
        <p className={errorText} role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={isPending} className={primaryButton}>
        {isPending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
