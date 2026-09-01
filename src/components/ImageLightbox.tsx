"use client";

/** Overlay plein écran pour agrandir une image au tap. Fermeture au tap
 * n'importe où (y compris sur l'image, cf. object-contain qui laisse de
 * l'espace vide autour) ou sur le bouton ×. Générique, pas spécifique au
 * module Tâches. */
export function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-[calc(env(safe-area-inset-top)+16px)] flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- image issue du bucket Storage public, agrandie telle quelle sans optimisation next/image */}
      <img src={src} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
    </div>
  );
}
