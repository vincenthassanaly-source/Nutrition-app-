"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { findNavItem } from "@/lib/navigation/registry";
import { updateModulesBarreBasse, updateOrdreGrillePlus } from "@/app/actions/preferences-navigation";
import { showToast } from "@/components/toast/toast-store";
import { card } from "@/lib/ui";

// Préfixe des ids `useDroppable` des 4 emplacements configurables de
// BottomNav (voir BottomNav.tsx) : sert à distinguer un drop "épingler en
// barre du bas" d'un drop "réordonner dans la grille" dans handleDragEnd.
export const BOTTOM_BAR_SLOT_PREFIX = "bottombar-slot-";

type NavigationEditContextValue = {
  ordreGrillePlus: string[];
  modulesBarreBasse: string[];
  isEditing: boolean;
  activeHref: string | null;
  exitEditing: () => void;
};

const NavigationEditContext = createContext<NavigationEditContextValue | null>(null);

export function useNavigationEdit(): NavigationEditContextValue {
  const ctx = useContext(NavigationEditContext);
  if (!ctx) throw new Error("useNavigationEdit doit être utilisé sous NavigationEditProvider.");
  return ctx;
}

// Englobe children (dont /plus, où vit ModulesGrid) ET BottomNav dans un
// seul DndContext, tous deux montés côte à côte dans AppLayout : dnd-kit ne
// requiert pas que draggable et droppable soient proches dans le DOM, juste
// descendants du même DndContext. Évite d'avoir à faire remonter un état de
// drag "à la main" entre deux sous-arbres qui ne se recroisent qu'ici.
export function NavigationEditProvider({
  initialOrdreGrillePlus,
  initialModulesBarreBasse,
  children,
}: {
  initialOrdreGrillePlus: string[];
  initialModulesBarreBasse: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [ordreGrillePlus, setOrdreGrillePlus] = useState(initialOrdreGrillePlus);
  const [modulesBarreBasse, setModulesBarreBasse] = useState(initialModulesBarreBasse);
  const [isEditingRaw, setIsEditingRaw] = useState(false);
  const [activeHref, setActiveHref] = useState<string | null>(null);

  // Le mode édition ne fait sens que sur /plus (grille visible) : dérivé du
  // pathname plutôt que synchronisé via un effet, pour qu'il redevienne
  // automatiquement false dès qu'on quitte /plus, sans jamais laisser le
  // bouton "Terminé" ou le tremblement des tuiles actifs ailleurs.
  const isEditing = isEditingRaw && pathname === "/plus";

  // Sortie du mode édition en tapant en dehors d'une tuile éditable ou du
  // bouton "Terminé" (voir data-nav-edit-tile / data-nav-edit-exit).
  useEffect(() => {
    if (!isEditing) return;
    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-nav-edit-tile], [data-nav-edit-exit]")) return;
      setIsEditingRaw(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isEditing]);

  // Appui long ~400ms (avec tolérance de mouvement pour ne pas gêner le
  // scroll) déclenche à la fois le mode édition et le drag : pas besoin
  // d'un second système de détection de long-press séparé.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 400, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setIsEditingRaw(true);
    setActiveHref(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveHref(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveHref(null);
    if (!over) return;

    const draggedHref = String(active.id);
    const overId = String(over.id);

    if (overId.startsWith(BOTTOM_BAR_SLOT_PREFIX)) {
      const index = Number(overId.slice(BOTTOM_BAR_SLOT_PREFIX.length));
      if (Number.isNaN(index) || modulesBarreBasse[index] === draggedHref) return;

      const previous = modulesBarreBasse;
      const next = modulesBarreBasse.map((href, i) => (i === index ? draggedHref : href));
      setModulesBarreBasse(next);
      updateModulesBarreBasse(next).catch(() => {
        setModulesBarreBasse(previous);
        showToast("Échec de l'épinglage, réessaie.");
      });
      return;
    }

    if (overId === draggedHref) return;
    const oldIndex = ordreGrillePlus.indexOf(draggedHref);
    const newIndex = ordreGrillePlus.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const previous = ordreGrillePlus;
    const next = arrayMove(ordreGrillePlus, oldIndex, newIndex);
    setOrdreGrillePlus(next);
    updateOrdreGrillePlus(next).catch(() => {
      setOrdreGrillePlus(previous);
      showToast("Échec de la réorganisation, réessaie.");
    });
  }

  const value = useMemo<NavigationEditContextValue>(
    () => ({
      ordreGrillePlus,
      modulesBarreBasse,
      isEditing,
      activeHref,
      exitEditing: () => setIsEditingRaw(false),
    }),
    [ordreGrillePlus, modulesBarreBasse, isEditing, activeHref]
  );

  const activeModule = activeHref ? findNavItem(activeHref) : null;

  return (
    <NavigationEditContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        {children}
        <DragOverlay dropAnimation={null}>
          {activeModule ? (
            <div className={`${card} flex w-[130px] flex-col gap-2 opacity-90`}>
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in oklch, ${activeModule.accentVar} 12%, transparent)` }}
              >
                {activeModule.icon(activeModule.accentVar)}
              </span>
              <p className="font-display text-[13px] font-semibold text-ink">{activeModule.label}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </NavigationEditContext.Provider>
  );
}
