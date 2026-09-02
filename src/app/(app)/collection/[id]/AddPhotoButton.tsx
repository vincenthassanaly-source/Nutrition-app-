"use client";

import { useRef, useState, useTransition } from "react";
import { uploadCollectionPhotos } from "@/app/actions/collections";
import { errorText } from "@/lib/ui";

const ADD_PHOTO_BUTTON =
  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-kcal/50 py-3 text-[13px] font-semibold text-kcal transition-colors hover:bg-kcal-soft";

function CameraIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h1.6l1-1.7A1.5 1.5 0 0 1 9.4 4.5h5.2a1.5 1.5 0 0 1 1.3.8l1 1.7h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9z" />
      <circle cx="12" cy="13" r="3.3" />
    </svg>
  );
}

function GalerieIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.4" />
      <path d="M4.5 16.5l4.5-4.5 3 3 3.5-3.5 4.5 4.5" />
    </svg>
  );
}

// Deux points d'entrée distincts plutôt qu'un seul input `capture` : sur pas
// mal de navigateurs mobiles, l'attribut `capture` fait sauter directement à
// l'appareil photo sans proposer la galerie. Un input dédié par usage
// (caméra vs galerie) garantit que les deux restent accessibles.
export function AddPhotoButton({ collectionId }: { collectionId: string }) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galerieInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null, inputRef: React.RefObject<HTMLInputElement | null>) {
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
      <div className="flex gap-2">
        <label htmlFor="collection-add-photo-camera" className={`${ADD_PHOTO_BUTTON} ${isPending ? "opacity-60" : ""}`}>
          <CameraIcon />
          {isPending ? "Envoi..." : "Appareil photo"}
        </label>
        <input
          ref={cameraInputRef}
          type="file"
          id="collection-add-photo-camera"
          accept="image/*"
          capture="environment"
          multiple
          disabled={isPending}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, cameraInputRef)}
        />

        <label htmlFor="collection-add-photo-galerie" className={`${ADD_PHOTO_BUTTON} ${isPending ? "opacity-60" : ""}`}>
          <GalerieIcon />
          {isPending ? "Envoi..." : "Galerie"}
        </label>
        <input
          ref={galerieInputRef}
          type="file"
          id="collection-add-photo-galerie"
          accept="image/*"
          multiple
          disabled={isPending}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files, galerieInputRef)}
        />
      </div>

      {error && (
        <p className={errorText} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
