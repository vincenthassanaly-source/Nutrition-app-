"use client";

import { useState, useTransition } from "react";
import { deleteNote, toggleEpingle, toggleNoteItem, type NoteAvecRelations } from "@/app/actions/notes";
import { NoteForm } from "./NoteForm";
import { noteBackgroundStyle } from "@/lib/notes/palette";
import { CheckToggle } from "@/components/CheckToggle";
import type { Tables } from "@/lib/supabase/types";
import { card, dangerButton, ghostButton, nameText, pillTag } from "@/lib/ui";

const ITEMS_PREVIEW_LIMIT = 6;

function couleurTagStyle(couleur: string | null) {
  if (!couleur) return undefined;
  return { backgroundColor: `${couleur}1a`, color: couleur };
}

function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l1.8 5.9L19.5 9l-4.3 3.8.6 6.2-3.8-3.3-3.8 3.3.6-6.2L4.5 9l5.7-1.1z" />
    </svg>
  );
}

export function NoteCard({ note, tags }: { note: NoteAvecRelations; tags: Tables<"tags">[] }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={`${card} mb-3 break-inside-avoid`}>
        <NoteForm note={note} tags={tags} onDone={() => setEditing(false)} />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="mt-2 text-sm text-ink-2 underline"
        >
          Annuler
        </button>
      </li>
    );
  }

  const itemsCoches = note.items.filter((i) => i.coche).length;
  const progression = note.items.length > 0 ? Math.round((itemsCoches / note.items.length) * 100) : 0;
  const itemsAffiches = note.items.slice(0, ITEMS_PREVIEW_LIMIT);
  const itemsRestants = note.items.length - itemsAffiches.length;

  return (
    <li
      className={`${card} mb-3 flex flex-col gap-2 break-inside-avoid`}
      style={noteBackgroundStyle(note.couleur)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={nameText}>{note.titre}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => toggleEpingle(note.id, !note.epingle))}
          aria-label={note.epingle ? "Désépingler" : "Épingler"}
          className={`shrink-0 ${note.epingle ? "text-kcal" : "text-ink-3"}`}
        >
          <PinIcon filled={note.epingle} />
        </button>
      </div>

      {note.type === "texte" ? (
        note.contenu && <p className="line-clamp-6 whitespace-pre-wrap text-sm text-ink-2">{note.contenu}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {note.items.length > 0 && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-alt">
              <div className="h-full rounded-full bg-kcal" style={{ width: `${progression}%` }} />
            </div>
          )}
          {itemsAffiches.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <CheckToggle
                checked={item.coche}
                onToggle={() => startTransition(() => toggleNoteItem(item.id, !item.coche))}
                label={item.coche ? "Décocher l'item" : "Cocher l'item"}
                size={18}
              />
              <span className={`text-sm ${item.coche ? "text-ink-3 line-through" : "text-ink-2"}`}>
                {item.libelle}
              </span>
            </div>
          ))}
          {itemsRestants > 0 && <p className="text-xs text-ink-3">+{itemsRestants} autres</p>}
        </div>
      )}

      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span key={tag.id} className={pillTag} style={couleurTagStyle(tag.couleur)}>
              #{tag.nom}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
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
