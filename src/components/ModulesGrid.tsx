"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MODULES } from "@/lib/modules";
import { card } from "@/lib/ui";

export function ModulesGrid() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {MODULES.map((mod, index) => (
        <motion.div
          key={mod.href}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          whileTap={{ scale: 0.96 }}
        >
          <Link href={mod.href} className={`${card} flex flex-col gap-2.5`}>
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
        </motion.div>
      ))}
    </div>
  );
}
