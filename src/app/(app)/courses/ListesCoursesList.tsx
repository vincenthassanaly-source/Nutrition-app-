import Link from "next/link";
import type { Tables } from "@/lib/supabase/types";
import { listCard, metaText, nameText } from "@/lib/ui";

const STATUT_LABEL: Record<string, string> = {
  en_cours: "En cours",
  terminee: "Terminée",
};

export function ListesCoursesList({ listes }: { listes: Tables<"listes_courses">[] }) {
  if (listes.length === 0) {
    return <p className="text-ink-2">Aucune liste de courses pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {listes.map((liste) => {
        const enCours = liste.statut === "en_cours";
        return (
          <li key={liste.id}>
            <Link href={`/courses/${liste.id}`} className={listCard}>
              <div className="flex items-center justify-between gap-2">
                <p className={nameText}>{liste.nom}</p>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold"
                  style={
                    enCours
                      ? { background: "oklch(0.5 0.13 155 / 0.1)", color: "var(--accent-kcal)" }
                      : { background: "var(--surface-alt)", color: "var(--ink-3)" }
                  }
                >
                  {STATUT_LABEL[liste.statut]}
                </span>
              </div>
              <p className={metaText}>{new Date(liste.created_at).toLocaleDateString("fr-FR")}</p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
