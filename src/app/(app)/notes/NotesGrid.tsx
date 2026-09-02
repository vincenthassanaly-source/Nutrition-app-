"use client";

import { useMemo, useState } from "react";
import { NoteCard } from "./NoteCard";
import type { NoteAvecRelations } from "@/app/actions/notes";
import type { Tables } from "@/lib/supabase/types";
import { input, pillTag, sectionTitle } from "@/lib/ui";

export function NotesGrid({
  notes,
  tags,
}: {
  notes: NoteAvecRelations[];
  tags: Tables<"tags">[];
}) {
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string[]>([]);

  function toggleTagFilter(id: string) {
    setTagFilter((ids) => (ids.includes(id) ? ids.filter((t) => t !== id) : [...ids, id]));
  }

  // Filtrage 100% côté client : titre + contenu + libellés des items
  // checklist + noms de tags. Pas de recherche full-text Postgres, le
  // volume de données mono-utilisateur ne le justifie pas (cf. prompt).
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return notes.filter((note) => {
      const matchesSearch =
        term === "" ||
        note.titre.toLowerCase().includes(term) ||
        note.contenu.toLowerCase().includes(term) ||
        note.items.some((item) => item.libelle.toLowerCase().includes(term)) ||
        note.tags.some((tag) => tag.nom.toLowerCase().includes(term));
      const matchesTags =
        tagFilter.length === 0 || tagFilter.every((id) => note.tags.some((tag) => tag.id === id));
      return matchesSearch && matchesTags;
    });
  }, [notes, search, tagFilter]);

  const epinglees = filtered.filter((n) => n.epingle);
  const autres = filtered.filter((n) => !n.epingle);

  if (notes.length === 0) {
    return <p className="text-ink-2">Aucune note pour l&apos;instant.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Rechercher une note…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={input}
      />

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTagFilter(tag.id)}
              className={
                tagFilter.includes(tag.id) ? `${pillTag} bg-kcal-soft text-kcal font-bold` : pillTag
              }
            >
              #{tag.nom}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-5 text-center text-sm text-ink-3">Aucune note ne correspond à ta recherche.</p>
      ) : (
        <>
          {epinglees.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className={sectionTitle}>Épinglées</p>
              <ul className="columns-2 gap-3">
                {epinglees.map((note) => (
                  <NoteCard key={note.id} note={note} tags={tags} />
                ))}
              </ul>
            </div>
          )}
          {autres.length > 0 && (
            <div className="flex flex-col gap-2">
              {epinglees.length > 0 && <p className={sectionTitle}>Autres</p>}
              <ul className="columns-2 gap-3">
                {autres.map((note) => (
                  <NoteCard key={note.id} note={note} tags={tags} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
