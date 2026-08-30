"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export function AppearanceRow() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <div className="flex items-center justify-between py-3.5">
      <span className="text-[14px] font-medium text-ink">Apparence</span>
      <button
        type="button"
        onClick={toggle}
        className="rounded-full bg-surface-alt px-3.5 py-2 text-[12.5px] font-semibold text-ink"
      >
        {isDark === null ? "…" : isDark ? "Sombre" : "Clair"}
      </button>
    </div>
  );
}
