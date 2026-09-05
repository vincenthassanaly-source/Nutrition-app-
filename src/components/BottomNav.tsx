"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useDroppable } from "@dnd-kit/core";
import { useViewTransitionNavigate } from "@/hooks/useViewTransitionNavigate";
import { findNavItem, resolveActiveHref } from "@/lib/navigation/registry";
import { useNavigationEdit, BOTTOM_BAR_SLOT_PREFIX } from "@/lib/navigation/NavigationEditContext";

const PLUS_ICON = (c: string) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.6" />
  </svg>
);

// Chaque emplacement configurable est une zone `useDroppable` distincte
// (id `bottombar-slot-{index}`, lu par NavigationEditContext.handleDragEnd)
// pour que déposer une tuile de ModulesGrid dessus l'épingle à cet index.
function BottomNavSlot({
  href,
  index,
  active,
  isDropTarget,
  onClick,
}: {
  href: string;
  index: number;
  active: boolean;
  isDropTarget: boolean;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const item = findNavItem(href);
  const { setNodeRef, isOver } = useDroppable({ id: `${BOTTOM_BAR_SLOT_PREFIX}${index}` });

  if (!item) return null;

  const color = active ? "var(--accent-kcal)" : "var(--ink-3)";
  const showDropRing = isDropTarget && isOver;

  return (
    <Link
      ref={setNodeRef}
      href={item.href}
      onClick={onClick}
      className="flex flex-col items-center gap-0.5 rounded-[18px] px-3 py-[7px] transition-colors"
      style={{
        background: active ? "var(--accent-kcal-soft)" : "transparent",
        outline: showDropRing ? "2px dashed var(--accent-kcal)" : undefined,
        outlineOffset: showDropRing ? "2px" : undefined,
      }}
    >
      {item.icon(color)}
      <span className="text-[10px]" style={{ color, fontWeight: active ? 700 : 500 }}>
        {item.label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const navigate = useViewTransitionNavigate();
  const { modulesBarreBasse, activeHref } = useNavigationEdit();

  // Un drag est en cours depuis ModulesGrid (voir NavigationEditContext) :
  // les 4 emplacements deviennent des zones de dépôt visibles.
  const isDropTarget = activeHref !== null;

  function handleClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    // Ne bloque la navigation native de <Link> (et son prefetch) que si
    // l'API View Transitions est disponible : sinon on laisse Next.js gérer
    // la navigation comme avant, sans rien casser sur Safari/Firefox.
    if (typeof document !== "undefined" && "startViewTransition" in document) {
      e.preventDefault();
      navigate(href);
    }
  }

  const activeItemHref = resolveActiveHref(pathname);
  // Le bouton "Plus" est actif dès que l'onglet résolu n'est ni l'accueil ni
  // l'un des 4 modules actuellement épinglés en barre du bas (ex. /agenda
  // tant qu'Agenda n'est pas épinglé).
  const plusActive = activeItemHref !== null && !modulesBarreBasse.includes(activeItemHref);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+14px)]">
      <nav className="flex items-center gap-0.5 rounded-[26px] border border-line bg-nav p-[7px] shadow-card backdrop-blur-xl">
        {modulesBarreBasse.map((href, index) => (
          <BottomNavSlot
            key={`${href}-${index}`}
            href={href}
            index={index}
            active={activeItemHref === href}
            isDropTarget={isDropTarget}
            onClick={(e) => handleClick(e, href)}
          />
        ))}
        <Link
          href="/plus"
          onClick={(e) => handleClick(e, "/plus")}
          className="flex flex-col items-center gap-0.5 rounded-[18px] px-3 py-[7px] transition-colors"
          style={{ background: plusActive ? "var(--accent-kcal-soft)" : "transparent" }}
        >
          {PLUS_ICON(plusActive ? "var(--accent-kcal)" : "var(--ink-3)")}
          <span
            className="text-[10px]"
            style={{ color: plusActive ? "var(--accent-kcal)" : "var(--ink-3)", fontWeight: plusActive ? 700 : 500 }}
          >
            Plus
          </span>
        </Link>
      </nav>
    </div>
  );
}
