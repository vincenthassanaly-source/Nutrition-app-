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
    <div className="flex gap-1.5 rounded-2xl bg-surface-alt p-1">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 rounded-xl py-2 text-center text-[13.5px] font-semibold transition-colors ${
              active ? "bg-kcal text-white" : "text-ink-2"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
