"use client";

import { useState, useTransition } from "react";
import { updatePlacardQuantite, removePlacardItem } from "@/app/actions/placard";
import type { Tables } from "@/lib/supabase/types";
import { cardTight, dangerButton, errorText, ghostButton, nameText } from "@/lib/ui";

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
    <li className={`${cardTight} flex flex-col gap-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <p className={nameText}>{item.aliment.nom}</p>
        {expireBientot && (
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-white" style={{ background: "oklch(0.68 0.16 70)" }}>
            péremption {new Date(item.date_peremption!).toLocaleDateString("fr-FR")}
          </span>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            value={quantite}
            onChange={(e) => setQuantite(e.target.value)}
            className="w-24 rounded-lg border border-line px-2 py-1 text-sm text-ink"
          />
          <span className="text-sm text-ink-2">{UNITE_LABEL[item.aliment.unite]}</span>
        </div>
      ) : (
        <p className="font-mono text-xs text-ink-2">
          {item.quantite_disponible} {UNITE_LABEL[item.aliment.unite]}
          {item.date_peremption && !expireBientot && (
            <span className="ml-2">
              péremption {new Date(item.date_peremption).toLocaleDateString("fr-FR")}
            </span>
          )}
        </p>
      )}
      {error && <p className={errorText}>{error}</p>}
      <div className="flex gap-2 pt-0.5">
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
              className={ghostButton}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => {
                setQuantite(String(item.quantite_disponible));
                setEditing(false);
              }}
              className={ghostButton}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
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
              className={dangerButton}
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
    return <p className="text-ink-2">Ton placard est vide pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <Row key={item.id} item={item} />
      ))}
    </ul>
  );
}
