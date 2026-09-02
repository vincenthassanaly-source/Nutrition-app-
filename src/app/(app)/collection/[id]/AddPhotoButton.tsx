"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCollectionPhotos } from "@/app/actions/collections";
import { dashedAddButton, errorText } from "@/lib/ui";

// Ajout de photo(s) depuis la vue d'une collection : input file classique,
// avec l'attribut `capture` qui propose l'appareil photo en plus de la
// galerie sur mobile. Upload immédiat au choix des fichiers, pas de bouton
// "Valider" séparé.
export function AddPhotoButton({ collectionId }: { collectionId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (const file of Array.from(files)) formData.append("photos", file);

    setError(null);
    startTransition(async () => {
      try {
        await uploadCollectionPhotos(collectionId, formData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="collection-add-photo"
        className={`${dashedAddButton} flex cursor-pointer items-center justify-center gap-2 ${isPending ? "opacity-60" : ""}`}
      >
        {isPending ? "Envoi..." : "+ Ajouter une photo"}
      </label>
      <input
        ref={inputRef}
        type="file"
        id="collection-add-photo"
        accept="image/*"
        capture="environment"
        multiple
        disabled={isPending}
        className="hidden"
        onChange={handleChange}
      />
      {error && (
        <p className={errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
