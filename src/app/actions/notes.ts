"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type NoteFormState = { error: string | null };

type NoteInput = {
  titre: string;
  contenu: string;
};

type ParseResult =
  | { ok: true; value: NoteInput }
  | { ok: false; error: string };

function parseNoteInput(formData: FormData): ParseResult {
  const titre = String(formData.get("titre") ?? "").trim();
  const contenu = String(formData.get("contenu") ?? "").trim();

  if (!titre) return { ok: false, error: "Le titre est requis." };
  if (!contenu) return { ok: false, error: "Le contenu est requis." };

  return { ok: true, value: { titre, contenu } };
}

export async function createNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const parsed = parseNoteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert(parsed.value);

  if (error) return { error: error.message };

  revalidatePath("/notes");
  return { error: null };
}

export async function updateNote(
  _prevState: NoteFormState,
  formData: FormData
): Promise<NoteFormState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Note introuvable." };

  const parsed = parseNoteInput(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("notes").update(parsed.value).eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/notes");
  return { error: null };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/notes");
}
