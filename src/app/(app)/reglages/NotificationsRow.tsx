"use client";

import { useState } from "react";

// Pas de backend de notifications pour l'instant : préférence locale à la
// session, pas persistée (rien à synchroniser côté serveur).
export function NotificationsRow() {
  const [on, setOn] = useState(true);

  return (
    <div className="flex items-center justify-between border-t border-line py-3.5">
      <span className="text-[14px] font-medium text-ink">Notifications</span>
      <button
        type="button"
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        className="relative h-[26px] w-11 rounded-full transition-colors"
        style={{ background: on ? "var(--accent-kcal)" : "var(--surface-alt)" }}
      >
        <span
          className="absolute top-0.5 h-[22px] w-[22px] rounded-full bg-white transition-all"
          style={{ left: on ? "20px" : "2px" }}
        />
      </button>
    </div>
  );
}
