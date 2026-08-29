"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { MODULES } from "@/lib/modules";

const ACCUEIL_ICON = (c: string) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
  </svg>
);

const ITEMS: { href: string; label: string; icon: (color: string) => ReactNode }[] = [
  { href: "/", label: "Accueil", icon: ACCUEIL_ICON },
  ...MODULES.map((mod) => ({ href: mod.href, label: mod.label, icon: mod.icon })),
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 inset-x-0 z-10 flex justify-center gap-10 border-t border-line bg-surface/92 px-2 pt-2.5 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+10px)]">
      {ITEMS.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const color = active ? "var(--accent-kcal)" : "var(--ink-3)";
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex w-20 flex-col items-center gap-1 px-1 py-1.5"
          >
            {item.icon(color)}
            <span
              className="text-[10.5px] tracking-wide"
              style={{ color, fontWeight: active ? 600 : 500 }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
