"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ITEMS: { href: string; label: string; icon: (color: string) => ReactNode }[] = [
  {
    href: "/journal",
    label: "Journal",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="19" x2="5" y2="11" />
        <line x1="12" y1="19" x2="12" y2="5" />
        <line x1="19" y1="19" x2="19" y2="14" />
      </svg>
    ),
  },
  {
    href: "/recettes",
    label: "Recettes",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6c2.4-1.6 5.6-1.6 8 0v13c-2.4-1.6-5.6-1.6-8 0V6z" />
        <path d="M20 6c-2.4-1.6-5.6-1.6-8 0v13c2.4-1.6 5.6-1.6 8 0V6z" />
      </svg>
    ),
  },
  {
    href: "/notes",
    label: "Notes",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z" />
        <path d="M9 9.5h6M9 13h6M9 16.5h3.5" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 inset-x-0 z-10 flex justify-center gap-10 border-t border-line bg-surface/92 px-2 pt-2.5 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+10px)]">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
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
