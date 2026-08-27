"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/aliments", label: "Aliments", icon: "🥕" },
  { href: "/recettes", label: "Recettes", icon: "📖" },
  { href: "/courses", label: "Courses", icon: "🛒" },
  { href: "/placard", label: "Placard", icon: "🗄️" },
  { href: "/journal", label: "Journal", icon: "📊" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 inset-x-0 border-t border-neutral-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <ul className="flex justify-between">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
                  active ? "text-green-700 font-medium" : "text-neutral-500"
                }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
