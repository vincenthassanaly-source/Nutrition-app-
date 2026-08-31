"use client";

import { useTransition } from "react";
import { deleteNote } from "@/app/actions/notes";
import { NoteForm } from "./NoteForm";
import type { Tables } from "@/lib/supabase/types";
import { card, dangerButton, ghostButton, listCard, metaText, nameText } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function NoteCard({ note }: { note: Tables<"notes"> }) {
  const [editing, edit] = useBackCloseToggle();
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <NoteForm note={note} onDone={() => history.back()} />
        <button
          type="button"
          onClick={() => history.back()}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  return (
    <li className={listCard}>
      <div className="flex items-center justify-between gap-2">
        <p className={nameText}>{note.titre}</p>
        <span className={metaText}>{formatDate(note.created_at)}</span>
      </div>
      <p className="line-clamp-2 text-sm text-ink-2">{note.contenu}</p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={edit} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteNote(note.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}

export function NotesList({ notes }: { notes: Tables<"notes">[] }) {
  if (notes.length === 0) {
    return <p className="text-ink-2">Aucune note pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </ul>
  );
}
