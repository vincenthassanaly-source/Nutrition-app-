"use client";

import { useState, useTransition } from "react";
import { updatePlacardQuantite, removePlacardItem } from "@/app/actions/placard";
import type { Tables } from "@/lib/supabase/types";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

type PlacardRow = Tables<"placard"> & { aliment: Tables<"aliments"> };

function Row({ item }: { item: PlacardRow }) {
  const [editing, setEditing] = useState(false);
  const [quantite, setQuantite] = useState(String(item.quantite_disponible));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const expireBientot =
    item.date_peremption &&
    new Date(item.date_peremption).getTime() - now < 3 * 24 * 60 * 60 * 1000;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 p-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{item.aliment.nom}</p>
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
              {UNITE_LABEL[item.aliment.unite]}
            </span>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            {item.quantite_disponible} {UNITE_LABEL[item.aliment.unite]}
            {item.date_peremption && (
              <span className={expireBientot ? "ml-2 text-amber-600" : "ml-2"}>
                · péremption {new Date(item.date_peremption).toLocaleDateString("fr-FR")}
              </span>
            )}
          </p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
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
                    await updatePlacardQuantite(item.id, n);
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
                setQuantite(String(item.quantite_disponible));
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
                    await removePlacardItem(item.id);
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
    </li>
  );
}

export function PlacardList({ items }: { items: PlacardRow[] }) {
  if (items.length === 0) {
    return <p className="text-neutral-500">Ton placard est vide pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </ul>
  );
}
