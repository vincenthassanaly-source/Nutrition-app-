"use client";

import { useActionState, useEffect, useRef } from "react";
import { createNote, updateNote, type NoteFormState } from "@/app/actions/notes";
import type { Tables } from "@/lib/supabase/types";
import { errorText, input, label as labelClass, primaryButton } from "@/lib/ui";

const initialState: NoteFormState = { error: null };

export function NoteForm({
  note,
  onDone,
}: {
  note?: Tables<"notes">;
  onDone?: () => void;
}) {
  const action = note ? updateNote : createNote;
  const [state, formAction, pending] = useActionState(action, initialState);
  const prevPending = useRef(pending);

  useEffect(() => {
    if (prevPending.current && !pending && !state.error) {
      onDone?.();
    }
    prevPending.current = pending;
  }, [pending, state.error, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {note && <input type="hidden" name="id" value={note.id} />}

      <div className="flex flex-col gap-1">
        <label htmlFor="titre" className={labelClass}>
          Titre
        </label>
        <input id="titre" name="titre" required defaultValue={note?.titre} className={input} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="contenu" className={labelClass}>
          Contenu
        </label>
        <textarea
          id="contenu"
          name="contenu"
          rows={5}
          required
          defaultValue={note?.contenu}
          className={input}
        />
      </div>

      {state.error && (
        <p className={errorText} role="alert">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Enregistrement..." : note ? "Enregistrer" : "Créer la note"}
      </button>
    </form>
  );
}
