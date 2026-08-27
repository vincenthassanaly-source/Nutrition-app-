"use client";

import { useMemo, useState } from "react";
import { useTransition } from "react";
import { AlimentForm } from "./AlimentForm";
import { deleteAliment } from "@/app/actions/aliments";
import type { Tables } from "@/lib/supabase/types";
import {
  card,
  cardTight,
  dangerButton,
  errorText,
  ghostButton,
  input,
  metaText,
  nameText,
  pillTag,
} from "@/lib/ui";

const UNITE_LABEL: Record<string, string> = { g: "g", ml: "ml", piece: "pièce" };

function normalizeForSearch(s: string): string {
  return s
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function AlimentRow({
  aliment,
  isOwner,
}: {
  aliment: Tables<"aliments">;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (editing) {
    return (
      <li className={card}>
        <AlimentForm aliment={aliment} onDone={() => setEditing(false)} />
        <button type="button" onClick={() => setEditing(false)} className="mt-2 text-sm text-ink-2 underline">
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className={`${cardTight} flex flex-col gap-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <p className={nameText}>
          {aliment.nom}
          {!isOwner && <span className={`ml-2 align-middle ${pillTag}`}>partagé</span>}
        </p>
        {aliment.categorie && <span className={pillTag}>{aliment.categorie}</span>}
      </div>
      <p className={metaText}>
        {aliment.kcal_100g} kcal/100{UNITE_LABEL[aliment.unite]} · P{aliment.proteines_100g}g · G{" "}
        {aliment.glucides_100g}g · L {aliment.lipides_100g}g
      </p>
      {deleteError && <p className={errorText}>{deleteError}</p>}
      {isOwner && (
        <div className="flex gap-2 pt-1">
          <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
            Éditer
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setDeleteError(null);
              startTransition(async () => {
                try {
                  await deleteAliment(aliment.id);
                } catch (e) {
                  setDeleteError(e instanceof Error ? e.message : "Erreur inconnue.");
                }
              });
            }}
            className={dangerButton}
          >
            Suppr.
          </button>
        </div>
      )}
    </li>
  );
}

export function AlimentsList({
  aliments,
  userId,
}: {
  aliments: Tables<"aliments">[];
  userId: string;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = normalizeForSearch(search);
    return aliments.filter((a) => normalizeForSearch(a.nom).includes(query));
  }, [aliments, search]);

  if (aliments.length === 0) {
    return <p className="text-ink-2">Aucun aliment pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        placeholder="Rechercher un aliment…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={input}
      />
      {filtered.length === 0 ? (
        <p className="py-5 text-center text-sm text-ink-3">Aucun aliment ne correspond à ta recherche.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {filtered.map((aliment) => (
            <AlimentRow key={aliment.id} aliment={aliment} isOwner={aliment.user_id === userId} />
          ))}
        </ul>
      )}
    </div>
  );
}
