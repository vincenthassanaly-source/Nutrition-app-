"use client";

import { THEME_STORAGE_KEY } from "@/lib/theme";

function toggleTheme() {
  const next = !document.documentElement.classList.contains("dark");
  document.documentElement.classList.toggle("dark", next);
  localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
}

// Les deux libellés sont rendus côté serveur, la classe `dark:` choisit
// lequel afficher : pas d'état React, donc pas de mismatch d'hydratation.
export function AppearanceRow() {
  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[14px] font-medium text-ink">Apparence</span>
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-full bg-surface-alt px-3.5 py-2 text-[12.5px] font-semibold text-ink"
      >
        <span className="dark:hidden">Clair</span>
        <span className="hidden dark:inline">Sombre</span>
      </button>
    </div>
  );
}
