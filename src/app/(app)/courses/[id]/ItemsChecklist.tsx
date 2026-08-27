"use client";

import { useState, useTransition } from "react";
import { toggleItemCoche } from "@/app/actions/listes-courses";
import type { Tables } from "@/lib/supabase/types";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

type ItemRow = Tables<"listes_courses_items"> & {
  aliment: Tables<"aliments">;
};

function ItemRow({ item }: { item: ItemRow }) {
  const [coche, setCoche] = useState(item.coche);
  const [, startTransition] = useTransition();

  return (
    <li>
      <label
        className={`flex items-center gap-3 rounded-lg border border-neutral-200 p-3 ${
          coche ? "opacity-50" : ""
        }`}
      >
        <input
          type="checkbox"
          checked={coche}
          onChange={(e) => {
            const next = e.target.checked;
            setCoche(next);
            startTransition(async () => {
              try {
                await toggleItemCoche(item.id, next);
              } catch {
                setCoche(!next);
              }
            });
          }}
          className="h-5 w-5 shrink-0"
        />
        <span className={`flex-1 ${coche ? "line-through" : ""}`}>
          {item.aliment.nom}
          <span className="ml-2 text-sm text-neutral-500">
            {item.quantite_totale} {UNITE_LABEL[item.unite]}
          </span>
        </span>
      </label>
    </li>
  );
}

export function ItemsChecklist({ items }: { items: ItemRow[] }) {
  if (items.length === 0) {
    return <p className="text-neutral-500">Cette liste ne contient aucun article.</p>;
  }

  const sorted = [...items].sort((a, b) => {
    if (a.coche !== b.coche) return a.coche ? 1 : -1;
    return a.aliment.nom.localeCompare(b.aliment.nom);
  });

  return (
    <ul className="flex flex-col gap-2">
      {sorted.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
