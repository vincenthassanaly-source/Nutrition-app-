"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import {
  addIngredient,
  removeIngredient,
  updateIngredient,
  type IngredientFormState,
} from "@/app/actions/recette-ingredients";
import type { Tables } from "@/lib/supabase/types";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

type IngredientRow = Tables<"recette_ingredients"> & {
  aliment: Tables<"aliments">;
};

function IngredientLine({
  ingredient,
  recetteId,
  isOwner,
}: {
  ingredient: IngredientRow;
  recetteId: string;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [quantite, setQuantite] = useState(String(ingredient.quantite));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{ingredient.aliment.nom}</p>
        {editing ? (
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              min="0"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
            />
            <span className="text-sm text-neutral-500">
              {UNITE_LABEL[ingredient.unite]}
            </span>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            {ingredient.quantite} {UNITE_LABEL[ingredient.unite]}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      {isOwner && (
        <div className="flex shrink-0 gap-2 text-sm">
          {editing ? (
            <>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  const n = Number(quantite);
                  startTransition(async () => {
                    try {
                      await updateIngredient(ingredient.id, recetteId, n);
                      setEditing(false);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Erreur inconnue.");
                    }
                  });
                }}
                className="rounded-md border border-neutral-300 px-2 py-1"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuantite(String(ingredient.quantite));
                  setEditing(false);
                }}
                className="rounded-md border border-neutral-300 px-2 py-1"
              >
                Annuler
              </button>
            </>
          ) : (
            <>
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
                      await removeIngredient(ingredient.id, recetteId);
                    } catch (e) {
                      setError(e instanceof Error ? e.message : "Erreur inconnue.");
                    }
                  });
                }}
                className="rounded-md border border-red-300 px-2 py-1 text-red-600 disabled:opacity-60"
              >
                Suppr.
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

const initialState: IngredientFormState = { error: null };

function AddIngredientForm({
  recetteId,
  aliments,
}: {
  recetteId: string;
  aliments: Tables<"aliments">[];
}) {
  const [state, formAction, pending] = useActionState(addIngredient, initialState);
  const [alimentId, setAlimentId] = useState(aliments[0]?.id ?? "");
  const formRef = useRef<HTMLFormElement>(null);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      formRef.current?.reset();
    }
    prevPending.current = pending;
  }, [pending, state.error]);

  if (aliments.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        Ajoute d&apos;abord des aliments dans l&apos;onglet Aliments pour pouvoir composer
        cette recette.
      </p>
    );
  }

  const selected = aliments.find((a) => a.id === alimentId) ?? aliments[0];

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="recette_id" value={recetteId} />
      <input type="hidden" name="unite" value={selected.unite} />

      <div className="flex gap-2">
        <select
          name="aliment_id"
          value={alimentId}
          onChange={(e) => setAlimentId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2"
        >
          {aliments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nom}
            </option>
          ))}
        </select>
        <input
          name="quantite"
          type="number"
          step="0.1"
          min="0"
          required
          placeholder={UNITE_LABEL[selected.unite]}
          className="w-24 rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-green-700 px-4 py-2 text-white font-medium disabled:opacity-60"
      >
        {pending ? "Ajout..." : "+ Ajouter l'ingrédient"}
      </button>
    </form>
  );
}

export function IngredientManager({
  recetteId,
  isOwner,
  ingredients,
  aliments,
}: {
  recetteId: string;
  isOwner: boolean;
  ingredients: IngredientRow[];
  aliments: Tables<"aliments">[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">Ingrédients</h2>

      {ingredients.length === 0 ? (
        <p className="text-neutral-500 text-sm">Aucun ingrédient pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {ingredients.map((ing) => (
            <IngredientLine
              key={ing.id}
              ingredient={ing}
              recetteId={recetteId}
              isOwner={isOwner}
            />
          ))}
        </ul>
      )}

      {isOwner && <AddIngredientForm recetteId={recetteId} aliments={aliments} />}
    </div>
  );
}
