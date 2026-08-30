"use client";

import { useState, useTransition } from "react";
import { enregistrerEntreeHabitude, supprimerHabitude, type HabitudeDuJour } from "@/app/actions/habitudes";
import { HabitudeForm } from "./HabitudeForm";
import { card, dangerButton, ghostButton, input, listCard, metaText, nameText, pillTag } from "@/lib/ui";

export function HabitudeCard({ habitude, date }: { habitude: HabitudeDuJour; date: string }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [valeurInput, setValeurInput] = useState(
    habitude.entreeDuJour ? String(habitude.entreeDuJour.valeur) : ""
  );

  if (editing) {
    return (
      <li className={card}>
        <HabitudeForm habitude={habitude} onDone={() => setEditing(false)} />
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

  const fait = (habitude.entreeDuJour?.valeur ?? 0) > 0;
  const atteint =
    habitude.valeur_cible != null && (habitude.entreeDuJour?.valeur ?? 0) >= habitude.valeur_cible;

  function toggleFait() {
    startTransition(() => enregistrerEntreeHabitude(habitude.id, date, fait ? 0 : 1));
  }

  function enregistrerValeur() {
    const valeur = Number(valeurInput);
    if (!Number.isFinite(valeur) || valeur < 0) return;
    startTransition(() => enregistrerEntreeHabitude(habitude.id, date, valeur));
  }

  return (
    <li className={listCard}>
      <div className="flex items-start gap-3">
        {habitude.type !== "quantifiee" && (
          <input
            type="checkbox"
            checked={fait}
            disabled={isPending}
            onChange={toggleFait}
            className="mt-0.5 h-5 w-5 shrink-0 accent-habitudes"
          />
        )}
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className={nameText}>
              {habitude.icone && <span className="mr-1.5">{habitude.icone}</span>}
              {habitude.nom}
            </p>
            {habitude.type === "streak" && habitude.streak > 0 && (
              <span className={pillTag}>🔥 {habitude.streak}j</span>
            )}
          </div>

          {habitude.type === "quantifiee" && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={valeurInput}
                onChange={(e) => setValeurInput(e.target.value)}
                onBlur={enregistrerValeur}
                disabled={isPending}
                className={`${input} w-24 py-1.5`}
              />
              <span className={metaText}>
                {habitude.unite}
                {habitude.valeur_cible != null && ` / ${habitude.valeur_cible}`}
              </span>
              {atteint && <span className={metaText}>✓ objectif atteint</span>}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setEditing(true)} className={ghostButton}>
          Modifier
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => supprimerHabitude(habitude.id))}
          className={dangerButton}
        >
          Archiver
        </button>
      </div>
    </li>
  );
}
