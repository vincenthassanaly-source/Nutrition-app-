"use client";

import { useState, useTransition } from "react";
import { enregistrerEntreeHabitude, supprimerHabitude, type HabitudeDuJour } from "@/app/actions/habitudes";
import { HabitudeForm } from "./HabitudeForm";
import { ProgressRing } from "@/components/ProgressRing";
import { card, dangerButton, ghostButton, input, listCard, metaText, nameText, pillTag } from "@/lib/ui";
import { useBackCloseToggle } from "@/hooks/useBackClose";

export function HabitudeCard({ habitude, date }: { habitude: HabitudeDuJour; date: string }) {
  const [editing, edit] = useBackCloseToggle();
  const [isPending, startTransition] = useTransition();
  const [valeurInput, setValeurInput] = useState(
    habitude.entreeDuJour ? String(habitude.entreeDuJour.valeur) : ""
  );

  if (editing) {
    return (
      <li className={card}>
        <HabitudeForm habitude={habitude} onDone={() => history.back()} />
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

  const valeur = habitude.entreeDuJour?.valeur ?? 0;
  const fait = valeur > 0;
  const atteint = habitude.valeur_cible != null && valeur >= habitude.valeur_cible;
  const pct = habitude.type === "quantifiee" && habitude.valeur_cible ? valeur / habitude.valeur_cible : fait ? 1 : 0;

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
        <ProgressRing size={34} strokeWidth={4} pct={pct} color="var(--accent-habitudes)">
          {habitude.type !== "quantifiee" && (
            <button
              type="button"
              disabled={isPending}
              onClick={toggleFait}
              aria-label={fait ? "Marquer non fait" : "Marquer fait"}
              className="flex h-full w-full items-center justify-center"
            >
              {fait ? (
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M1 6l3.2 3.2L11 2" stroke="var(--accent-habitudes)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <span className="text-sm">{habitude.icone || ""}</span>
              )}
            </button>
          )}
        </ProgressRing>
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
        <button type="button" onClick={edit} className={ghostButton}>
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
