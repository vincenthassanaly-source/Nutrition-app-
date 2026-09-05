"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { findNavItem } from "@/lib/navigation/registry";
import { useNavigationEdit } from "@/lib/navigation/NavigationEditContext";
import { card } from "@/lib/ui";

function ModuleTile({ href, isEditing }: { href: string; isEditing: boolean }) {
  const mod = findNavItem(href);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: href });

  if (!mod) return null;

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    // "none" bloquerait le scroll vertical de la page dès qu'un doigt touche
    // une tuile (touch-action est tranché par le navigateur au premier
    // contact, indépendamment du délai JS de l'activationConstraint de
    // PointerSensor) : "manipulation" laisse le scroll natif fonctionner
    // normalement, tout en laissant l'appui long (400ms sans déplacement,
    // voir NavigationEditContext) déclencher le drag.
    touchAction: "manipulation",
  };

  const content = (
    <>
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
    </>
  );

  // En mode édition, un <div> remplace <Link> : un tap sur une tuile ne doit
  // pas naviguer (comme l'écran d'accueil iOS en mode jiggle), seuls le
  // drag (réordonner / épingler en barre du bas) et la sortie du mode
  // édition (bouton "Terminé" ou tap en dehors, voir NavigationEditContext)
  // restent actifs.
  return (
    <div ref={setNodeRef} style={style} data-nav-edit-tile {...attributes} {...listeners}>
      {isEditing ? (
        <div className={`${card} flex flex-col gap-2.5 select-none plus-tuile-edition`}>{content}</div>
      ) : (
        <Link href={mod.href} className={`${card} flex flex-col gap-2.5`}>
          {content}
        </Link>
      )}
    </div>
  );
}

export function ModulesGrid() {
  const { ordreGrillePlus, isEditing } = useNavigationEdit();

  return (
    <SortableContext items={ordreGrillePlus} strategy={rectSortingStrategy}>
      <div className="grid grid-cols-2 gap-3">
        {ordreGrillePlus.map((href, index) => (
          <motion.div
            key={href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            whileTap={!isEditing ? { scale: 0.96 } : undefined}
          >
            <ModuleTile href={href} isEditing={isEditing} />
          </motion.div>
        ))}
      </div>
    </SortableContext>
  );
}
