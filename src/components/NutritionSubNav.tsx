"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/nutrition/journal", label: "Journal" },
  { href: "/nutrition/recettes", label: "Recettes" },
];

export function NutritionSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 rounded-lg py-2 text-center text-[13.5px] font-semibold transition-colors"
            style={
              active
                ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 3px oklch(0.2 0.02 255 / 0.1)" }
                : { color: "var(--ink-2)" }
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
