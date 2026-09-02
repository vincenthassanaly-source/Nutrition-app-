"use client";

import { motion, AnimatePresence } from "framer-motion";

/** Bouton rond à coche, remplace les `<input type="checkbox">` natifs pour
 * matcher le style de la maquette (cercle plein coché, contour sinon).
 * Micro-feedback au check : léger "pop" du cercle + tracé du check qui se
 * dessine, ~180ms — assez court pour ne pas ralentir la perception du tap. */
export function CheckToggle({
  checked,
  onToggle,
  disabled,
  size = 22,
  color = "var(--accent-kcal)",
  label,
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={checked}
      className={`shrink-0 ${className}`}
    >
      <motion.span
        className="flex items-center justify-center rounded-full border-2"
        style={{
          width: size,
          height: size,
          borderColor: checked ? color : "var(--line)",
          background: checked ? color : "transparent",
        }}
        animate={checked ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <AnimatePresence>
          {checked && (
            <motion.svg
              width={size * 0.5}
              height={size * 0.5}
              viewBox="0 0 12 12"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <path d="M1 6l3.2 3.2L11 2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.span>
    </button>
  );
}
