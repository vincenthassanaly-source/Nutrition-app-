"use client";

import { useState } from "react";
import { AddTaskForm } from "./taches/AddTaskForm";
import { NoteForm } from "./notes/NoteForm";
import { Modal } from "@/components/Modal";
import type { Tables } from "@/lib/supabase/types";

type Mode = null | "menu" | "tache" | "note";

export function QuickAddFab({
  listes,
  tags,
}: {
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  const [mode, setMode] = useState<Mode>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => setMode("menu")}
        aria-label="Ajouter"
        className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-card"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 90px)",
          background: "var(--accent-kcal)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      {mode === "menu" && (
        <Modal title="Ajouter" onClose={() => setMode(null)}>
          <div className="flex flex-col gap-2 pb-1">
            <button
              type="button"
              onClick={() => setMode("tache")}
              className="rounded-2xl border border-line bg-surface-alt px-4 py-3.5 text-left text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              Nouvelle tâche
            </button>
            <button
              type="button"
              onClick={() => setMode("note")}
              className="rounded-2xl border border-line bg-surface-alt px-4 py-3.5 text-left text-[14.5px] font-semibold text-ink transition-colors hover:bg-surface"
            >
              Nouvelle note
            </button>
          </div>
        </Modal>
      )}

      {mode === "tache" && (
        <Modal title="Nouvelle tâche" onClose={() => setMode(null)}>
          <AddTaskForm listes={listes} tags={tags} onDone={() => setMode(null)} />
        </Modal>
      )}

      {mode === "note" && (
        <Modal title="Nouvelle note" onClose={() => setMode(null)}>
          <NoteForm onDone={() => setMode(null)} />
        </Modal>
      )}
    </>
  );
}
