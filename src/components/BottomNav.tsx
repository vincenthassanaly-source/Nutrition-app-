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
    href: "/aliments",
    label: "Aliments",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="14" r="6.5" />
        <path d="M12 7.5V6c0-1.2 1-2 2.2-2" />
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
    href: "/placard",
    label: "Placard",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="18" rx="1.5" />
        <line x1="12" y1="3" x2="12" y2="21" />
        <line x1="9.5" y1="11" x2="9.5" y2="13" />
        <line x1="14.5" y1="11" x2="14.5" y2="13" />
      </svg>
    ),
  },
  {
    href: "/courses",
    label: "Courses",
    icon: (c) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8h12l-1 12H7L6 8z" />
        <path d="M9 8V6a3 3 0 016 0v2" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 inset-x-0 z-10 flex border-t border-line bg-surface/92 px-2 pt-2.5 backdrop-blur-md pb-[calc(env(safe-area-inset-bottom)+10px)]">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const color = active ? "var(--accent-kcal)" : "var(--ink-3)";
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 flex-col items-center gap-1 px-1 py-1.5"
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
