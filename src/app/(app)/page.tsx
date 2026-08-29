import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { card, eyebrow, screenTitle } from "@/lib/ui";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background px-4 py-6">
      <header className="mb-6">
        <p className={eyebrow}>Kilio</p>
        <h1 className={screenTitle}>Accueil</h1>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {MODULES.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className={`${card} flex flex-col gap-2.5`}
          >
            <span
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in oklch, ${mod.accentVar} 12%, transparent)` }}
            >
              {mod.icon(mod.accentVar)}
            </span>
            <div>
              <p className="font-display text-[15px] font-semibold text-ink">{mod.label}</p>
              <p className="text-[12.5px] text-ink-2">{mod.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
