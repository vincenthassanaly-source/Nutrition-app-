"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arraySwap } from "@dnd-kit/sortable";
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

  // Bouton/geste "retour" (Android) pendant le mode édition : au lieu de
  // quitter /plus, referme juste le mode édition, comme un tap dans le
  // vide. Technique standard pour intercepter le retour dans une SPA :
  // pousser une entrée d'historique "sentinelle" à l'entrée en édition, que
  // le retour dépile (déclenchant "popstate" sans navigation réelle, même
  // URL). Si on sort du mode édition autrement (bouton "Terminé", tap en
  // dehors), on dépile nous-mêmes cette sentinelle pour ne pas laisser une
  // entrée fantôme forcer un double retour plus tard.
  useEffect(() => {
    if (!isEditing) return;

    window.history.pushState({ navEditSentinel: true }, "");

    function handlePopState() {
      setIsEditingRaw(false);
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      const state = window.history.state as { navEditSentinel?: boolean } | null;
      if (state?.navEditSentinel) window.history.back();
    };
  }, [isEditing]);

  // Appui long ~400ms (avec tolérance de mouvement pour ne pas gêner le
  // scroll) déclenche à la fois le mode édition et le drag : pas besoin
  // d'un second système de détection de long-press séparé.
  //
  // TouchSensor + MouseSensor (à la place de PointerSensor) a été testé pour
  // ce même correctif : en théorie, `touchcancel` est déclenché par les
  // navigateurs de façon plus rare que `pointercancel` pour un simple pan
  // natif reconnu pendant la fenêtre d'activation (voir le rapport
  // reports/2026-09-05-fiabilite-drag-preview-swap.md pour l'analyse du
  // code source de dnd-kit). En pratique sur le téléphone de Vincent
  // (Brave / Android), ce changement a cassé l'activation à 100% (contre un
  // problème seulement intermittent avec PointerSensor) — abandonné, retour
  // à PointerSensor. À ne pas retenter sans un moyen de tester directement
  // sur cet appareil.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 400, tolerance: 8 } })
  );

  // Instantané de l'état pris au tout début du drag : sert de base pure pour
  // calculer le preview à chaque `dragOver` (voir handleDragOver) et de
  // référence de rollback en cas d'échec de la Server Action ou d'annulation
  // du drag — jamais l'état juste avant le dernier survol.
  const dragStartSnapshotRef = useRef<{ ordreGrillePlus: string[]; modulesBarreBasse: string[] } | null>(null);
  // Dernier id survolé traité par handleDragOver, pour ignorer les appels
  // répétés tant que la cible survolée n'a pas changé (évite de recalculer
  // et de re-render à chaque pointermove pendant un survol immobile).
  const lastOverIdRef = useRef<string | null>(null);

  function handleDragStart(event: DragStartEvent) {
    setIsEditingRaw(true);
    setActiveHref(String(event.active.id));
    lastOverIdRef.current = null;
    dragStartSnapshotRef.current = { ordreGrillePlus, modulesBarreBasse };
  }

  // Le preview pendant le drag est toujours recalculé à partir de
  // l'instantané du dragStart + la cible actuellement survolée (jamais en
  // accumulant depuis l'état déjà mutable), pour rester cohérent quel que
  // soit l'enchaînement de survols pendant le geste : à tout instant, l'état
  // local montre exactement ce qui serait persisté si on lâchait maintenant.
  function handleDragOver(event: DragOverEvent) {
    const snapshot = dragStartSnapshotRef.current;
    if (!snapshot) return;

    const { active, over } = event;
    const draggedHref = String(active.id);
    const overId = over ? String(over.id) : null;

    if (lastOverIdRef.current === overId) return;
    lastOverIdRef.current = overId;

    if (overId && overId.startsWith(BOTTOM_BAR_SLOT_PREFIX)) {
      setOrdreGrillePlus(snapshot.ordreGrillePlus);
      const index = Number(overId.slice(BOTTOM_BAR_SLOT_PREFIX.length));
      if (Number.isNaN(index)) return;
      const base = snapshot.modulesBarreBasse;
      setModulesBarreBasse(base[index] === draggedHref ? base : base.map((href, i) => (i === index ? draggedHref : href)));
      return;
    }

    setModulesBarreBasse(snapshot.modulesBarreBasse);

    if (!overId || overId === draggedHref) {
      setOrdreGrillePlus(snapshot.ordreGrillePlus);
      return;
    }

    const base = snapshot.ordreGrillePlus;
    const activeIndex = base.indexOf(draggedHref);
    const overIndex = base.indexOf(overId);
    setOrdreGrillePlus(activeIndex === -1 || overIndex === -1 ? base : arraySwap(base, activeIndex, overIndex));
  }

  function handleDragCancel() {
    setActiveHref(null);
    lastOverIdRef.current = null;
    const snapshot = dragStartSnapshotRef.current;
    dragStartSnapshotRef.current = null;
    if (!snapshot) return;
    setOrdreGrillePlus(snapshot.ordreGrillePlus);
    setModulesBarreBasse(snapshot.modulesBarreBasse);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveHref(null);
    lastOverIdRef.current = null;
    const snapshot = dragStartSnapshotRef.current;
    dragStartSnapshotRef.current = null;
    if (!snapshot) return;

    const { over } = event;
    const overId = over ? String(over.id) : null;

    if (overId && overId.startsWith(BOTTOM_BAR_SLOT_PREFIX)) {
      // Épinglage en barre du bas confirmé : un éventuel swap de grille
      // prévisualisé plus tôt dans ce même drag (avant d'atteindre la barre
      // du bas) n'a jamais été confirmé, on le défait.
      setOrdreGrillePlus(snapshot.ordreGrillePlus);
      const next = modulesBarreBasse;
      if (next === snapshot.modulesBarreBasse) return; // Aucun changement réel (déjà épinglé à cet emplacement).
      updateModulesBarreBasse(next).catch(() => {
        setModulesBarreBasse(snapshot.modulesBarreBasse);
        showToast("Échec de l'épinglage, réessaie.");
      });
      return;
    }

    // Sinon : réordonnancement de grille confirmé, ou lâcher hors de toute
    // cible (annulation) — dans les deux cas, un éventuel preview
    // d'épinglage jamais confirmé ne doit pas être conservé.
    setModulesBarreBasse(snapshot.modulesBarreBasse);

    const next = ordreGrillePlus;
    if (!overId || next === snapshot.ordreGrillePlus) {
      // Lâcher hors de toute cible, ou aucun swap réel (ex. lâcher sur la
      // tuile d'origine) : rien à persister.
      setOrdreGrillePlus(snapshot.ordreGrillePlus);
      return;
    }

    updateOrdreGrillePlus(next).catch(() => {
      setOrdreGrillePlus(snapshot.ordreGrillePlus);
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
        onDragOver={handleDragOver}
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
