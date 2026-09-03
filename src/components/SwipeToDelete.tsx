"use client";

import { useRef, useState } from "react";
import { vibrate } from "@/lib/haptics";

const DELETE_WIDTH = 84;
const SWIPE_THRESHOLD = 64;

/** Enveloppe un item de liste (à insérer à la place de son contenu direct,
 * à l'intérieur du <li>/carte existant·e qui porte déjà le fond/bordure/
 * ombre) pour révéler un bouton "Supprimer" au swipe horizontal vers la
 * gauche. Gestes tactiles natifs, pas de dépendance de geste ajoutée. */
export function SwipeToDelete({
  onDelete,
  children,
  disabled,
  contentClassName = "",
}: {
  onDelete: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  /** Classes appliquées au conteneur qui glisse (ex. le layout flex du
   * contenu d'origine, quand il vivait sur le <li>/carte englobant·e). */
  contentClassName?: string;
}) {
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const revealed = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axis = useRef<"x" | "y" | null>(null);
  const passedThreshold = useRef(false);

  function handleTouchStart(e: React.TouchEvent) {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    axis.current = null;
    passedThreshold.current = revealed.current;
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (disabled) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    if (axis.current === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "x") setDragging(true);
    }
    if (axis.current !== "x") return;

    const base = revealed.current ? -DELETE_WIDTH : 0;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, base + dx));
    setDragX(next);

    const crossed = next <= -SWIPE_THRESHOLD;
    if (crossed && !passedThreshold.current) vibrate(12);
    passedThreshold.current = crossed;
  }

  function handleTouchEnd() {
    if (disabled) return;
    setDragging(false);
    if (axis.current === "x" && dragX <= -SWIPE_THRESHOLD) {
      setDragX(-DELETE_WIDTH);
      revealed.current = true;
    } else {
      setDragX(0);
      revealed.current = false;
    }
    axis.current = null;
  }

  function handleDelete() {
    vibrate(15);
    revealed.current = false;
    setDragX(0);
    onDelete();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Supprimer"
        className="absolute inset-y-0 right-0 flex items-center justify-center rounded-xl bg-alert text-[13px] font-semibold text-white"
        style={{ width: DELETE_WIDTH }}
      >
        Supprimer
      </button>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative ${contentClassName}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? "none" : "transform 0.18s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
