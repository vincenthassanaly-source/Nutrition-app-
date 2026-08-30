"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const ACCUEIL_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 11.5 12 4l8 7.5" />
    <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
  </svg>
);

const NUTRITION_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 6c2.4-1.6 5.6-1.6 8 0v13c-2.4-1.6-5.6-1.6-8 0V6z" />
    <path d="M20 6c-2.4-1.6-5.6-1.6-8 0v13c2.4-1.6 5.6-1.6 8 0V6z" />
  </svg>
);

const TACHES_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M7.5 12.5l2.5 2.5 6-6" />
  </svg>
);

const HABITUDES_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5c1.2 2.6-.4 3.9-1.4 5-1.3 1.4-1.9 2.7-1.9 4.2a5.3 5.3 0 0 0 10.6 0c0-1.9-1-3.4-2.1-4.5.2 1.6-.5 2.3-1.2 2.3-1 0-1.4-.9-1.1-2 .4-1.5.4-3.2-2.9-5z" />
  </svg>
);

const PLUS_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);

const ITEMS: { href: string; label: string; icon: (color: string) => ReactNode; match: (path: string) => boolean }[] = [
  { href: "/", label: "Accueil", icon: ACCUEIL_ICON, match: (p) => p === "/" },
  { href: "/nutrition", label: "Nutrition", icon: NUTRITION_ICON, match: (p) => p.startsWith("/nutrition") },
  { href: "/taches", label: "Tâches", icon: TACHES_ICON, match: (p) => p.startsWith("/taches") || p.startsWith("/agenda") },
  { href: "/habitudes", label: "Habitudes", icon: HABITUDES_ICON, match: (p) => p.startsWith("/habitudes") },
  { href: "/plus", label: "Plus", icon: PLUS_ICON, match: (p) => p === "/plus" || ["/courses", "/budget", "/objectifs", "/notes", "/reglages"].some((m) => p.startsWith(m)) },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <nav className="flex items-center gap-0.5 rounded-[26px] border border-line bg-nav p-[7px] shadow-card backdrop-blur-xl">
        {ITEMS.map((item) => {
          const active = item.match(pathname);
          const color = active ? "var(--accent-kcal)" : "var(--ink-3)";
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 rounded-[18px] px-3 py-[7px] transition-colors"
              style={{ background: active ? "var(--accent-kcal-soft)" : "transparent" }}
            >
              {item.icon(color)}
              <span
                className="text-[10px]"
                style={{ color, fontWeight: active ? 700 : 500 }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
