"use client";

import { useState, useTransition } from "react";
import {
  createSousTache,
  deleteSousTache,
  deleteTache,
  reordonnerSousTaches,
  reordonnerTaches,
  toggleSousTache,
  toggleTache,
  type TacheAvecRelations,
} from "@/app/actions/taches";
import { AddTaskForm } from "./AddTaskForm";
import type { Enums, Tables } from "@/lib/supabase/types";
import { card, dangerButton, ghostButton, listCard, metaText, nameText, pillTag } from "@/lib/ui";
import { CheckToggle } from "@/components/CheckToggle";

export function formatEcheance(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const PRIORITE_LABELS: Record<Enums<"priorite_tache">, string> = {
  aucune: "Aucune",
  basse: "Basse",
  moyenne: "Moyenne",
  haute: "Haute",
};

// Réutilise les couleurs de module existantes (accent-agenda/carbs/alert)
// plutôt que d'en introduire de nouvelles : basse = bleu (calme), moyenne =
// orange, haute = rouge/alerte.
const PRIORITE_BADGE: Record<Enums<"priorite_tache">, string> = {
  aucune: "",
  basse: "bg-agenda/10 text-agenda",
  moyenne: "bg-carbs/10 text-carbs",
  haute: "bg-alert/10 text-alert",
};

function couleurStyle(couleur: string | null): React.CSSProperties | undefined {
  if (!couleur) return undefined;
  return { backgroundColor: `${couleur}1a`, color: couleur };
}

function SousTachesList({ tache }: { tache: TacheAvecRelations }) {
  const [isPending, startTransition] = useTransition();
  const [titre, setTitre] = useState("");

  function handleAjouter(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = titre.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createSousTache(tache.id, trimmed);
    });
    setTitre("");
  }

  return (
    <div className="mt-1 flex flex-col gap-1.5 border-t border-line pt-2">
      {tache.sous_taches.length > 0 && (
        <ul className="flex flex-col gap-1">
          {tache.sous_taches.map((sousTache, index) => (
            <li key={sousTache.id} className="flex items-center gap-2">
              <CheckToggle
                checked={sousTache.fait}
                disabled={isPending}
                onToggle={() => startTransition(() => toggleSousTache(sousTache.id, !sousTache.fait))}
                size={17}
                label={sousTache.fait ? "Marquer non fait" : "Marquer fait"}
              />
              <span
                className={`flex-1 text-[13.5px] ${
                  sousTache.fait ? "text-ink-2 line-through" : "text-ink"
                }`}
              >
                {sousTache.titre}
              </span>
              <button
                type="button"
                disabled={isPending || index === 0}
                onClick={() =>
                  startTransition(() => reordonnerSousTaches(tache.id, sousTache.id, "haut"))
                }
                className="text-ink-2 disabled:opacity-30"
                aria-label="Monter la sous-tâche"
              >
                ↑
              </button>
              <button
                type="button"
                disabled={isPending || index === tache.sous_taches.length - 1}
                onClick={() =>
                  startTransition(() => reordonnerSousTaches(tache.id, sousTache.id, "bas"))
                }
                className="text-ink-2 disabled:opacity-30"
                aria-label="Descendre la sous-tâche"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => startTransition(() => deleteSousTache(sousTache.id))}
                className="text-alert"
                aria-label="Supprimer la sous-tâche"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAjouter} className="flex gap-2">
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="+ Sous-tâche"
          className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-kcal/60"
        />
        <button
          type="submit"
          disabled={isPending || !titre.trim()}
          className="text-sm font-semibold text-kcal disabled:opacity-50"
        >
          Ajouter
        </button>
      </form>
    </div>
  );
}

export function TaskCard({
  tache,
  listes,
  tags,
}: {
  tache: TacheAvecRelations;
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className={card}>
        <AddTaskForm tache={tache} listes={listes} tags={tags} onDone={() => setEditing(false)} />
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

  const sousTachesFaites = tache.sous_taches.filter((s) => s.fait).length;

  return (
    <li className={listCard}>
      <div className="flex items-start gap-3">
        <CheckToggle
          checked={tache.fait}
          disabled={isPending}
          onToggle={() => startTransition(() => toggleTache(tache.id))}
          className="mt-0.5"
          label={tache.fait ? "Marquer non fait" : "Marquer fait"}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <p className={`${nameText} min-w-0 flex-1 ${tache.fait ? "text-ink-2 line-through" : ""}`}>
              {tache.titre}
            </p>
            {tache.recurrence_frequence && (
              <span className="shrink-0 text-ink-2" title="Tâche récurrente">
                ↻
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {tache.liste && (
              <span className={pillTag} style={couleurStyle(tache.liste.couleur)}>
                {tache.liste.nom}
              </span>
            )}
            {tache.priorite !== "aucune" && (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${PRIORITE_BADGE[tache.priorite]}`}
              >
                {PRIORITE_LABELS[tache.priorite]}
              </span>
            )}
            {tache.tags.map((tag) => (
              <span key={tag.id} className={pillTag} style={couleurStyle(tag.couleur)}>
                #{tag.nom}
              </span>
            ))}
            <button type="button" onClick={() => setExpanded((v) => !v)} className={pillTag}>
              {tache.sous_taches.length > 0
                ? `${sousTachesFaites}/${tache.sous_taches.length}`
                : "+ sous-tâches"}
            </button>
          </div>

          {tache.notes && (
            <p className="whitespace-pre-wrap text-[13px] text-ink-2">{tache.notes}</p>
          )}

          {tache.echeance && (
            <span className={metaText}>
              Échéance : {formatEcheance(tache.echeance)}
              {tache.heure && ` à ${tache.heure.slice(0, 5)}`}
            </span>
          )}

          {expanded && <SousTachesList tache={tache} />}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => reordonnerTaches(tache.id, "haut"))}
            className={ghostButton}
            aria-label="Monter"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => reordonnerTaches(tache.id, "bas"))}
            className={ghostButton}
            aria-label="Descendre"
          >
            ↓
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
            Modifier
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => deleteTache(tache.id))}
            className={dangerButton}
          >
            Suppr.
          </button>
        </div>
      </div>
    </li>
  );
}

export function TasksList({
  taches,
  listes,
  tags,
}: {
  taches: TacheAvecRelations[];
  listes: Tables<"listes_taches">[];
  tags: Tables<"tags">[];
}) {
  if (taches.length === 0) {
    return <p className="text-ink-2">Aucune tâche pour l&apos;instant.</p>;
  }

  const actives = taches.filter((tache) => !tache.fait);
  // Trié par updated_at décroissant : proxy imparfait de la date de cochage
  // (updated_at change aussi si la tâche est éditée après coup), faute de
  // colonne dédiée type `fait_le`.
  const archivees = taches
    .filter((tache) => tache.fait)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0));

  return (
    <>
      {actives.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {actives.map((tache) => (
            <TaskCard key={tache.id} tache={tache} listes={listes} tags={tags} />
          ))}
        </ul>
      )}
      {archivees.length > 0 && (
        <details className={`${card} mt-2.5`}>
          <summary className="cursor-pointer text-[14.5px] font-semibold text-ink-2">
            Tâches archivées ({archivees.length})
          </summary>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {archivees.map((tache) => (
              <TaskCard key={tache.id} tache={tache} listes={listes} tags={tags} />
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
