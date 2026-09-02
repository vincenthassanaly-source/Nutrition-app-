"use client";

import { useActionState, useState } from "react";
import { rattacherPhotoACollection, type RattacherPhotoFormState } from "@/app/actions/collections";
import type { Tables } from "@/lib/supabase/types";
import { card, errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: RattacherPhotoFormState = { error: null };

export function ChoisirCollectionForm({
  collections,
  photos,
}: {
  collections: Tables<"collections">[];
  photos: string[];
}) {
  const [state, formAction, pending] = useActionState(rattacherPhotoACollection, initialState);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [nouvelleCollection, setNouvelleCollection] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {photos.map((url) => (
        <input key={url} type="hidden" name="url" value={url} />
      ))}
      <input type="hidden" name="collection_id" value={collectionId ?? ""} />

      {collections.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className={labelClass}>Collection existante</span>
          <div className="flex flex-col gap-1.5">
            {collections.map((collection) => (
              <button
                key={collection.id}
                type="button"
                onClick={() => {
                  setCollectionId(collection.id);
                  setNouvelleCollection("");
                }}
                className={`${card} w-full text-left transition-colors ${
                  collectionId === collection.id ? "border-kcal bg-kcal-soft" : ""
                }`}
              >
                {collection.nom}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nouvelle_collection" className={labelClass}>
          Nouvelle collection
        </label>
        <input
          id="nouvelle_collection"
          name="nouvelle_collection"
          value={nouvelleCollection}
          onChange={(e) => {
            setNouvelleCollection(e.target.value);
            setCollectionId(null);
          }}
          placeholder="Nom de la collection"
          className={input}
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
