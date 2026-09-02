"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type TouchEvent as ReactTouchEvent,
} from "react";

// Dimensions par défaut de la grille horaire (= zoom 1, rendu actuel
// inchangé). WeekView utilise BASE_DAY_COLUMN_WIDTH, TimeGrid utilise
// BASE_HOUR_HEIGHT pour dériver hourHeight(zoom)/gridHeight(zoom).
export const BASE_HOUR_HEIGHT = 56;
export const BASE_DAY_COLUMN_WIDTH = 96;
export const DEFAULT_ZOOM = 1;
// Bornes choisies empiriquement : au zoom minimal, un écran mobile standard
// (~380px de large, ~500-600px de grille visible) affiche les 7 colonnes de
// la semaine et une journée complète de 24h sans double scroll. Le zoom
// maximal dépasse le rendu par défaut pour le confort de lecture fine.
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2;

const STORAGE_KEY = "kilio-agenda-zoom";

function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

function readStoredZoom(): number {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw !== null ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? clampZoom(parsed) : DEFAULT_ZOOM;
}

// Resynchronise si le zoom est modifié depuis un autre onglet.
function subscribeToStoredZoom(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getServerZoom(): number {
  return DEFAULT_ZOOM;
}

function touchDistance(a: React.Touch, b: React.Touch): number {
  return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

// Zoom combiné (hauteur des heures + largeur des colonnes jour) partagé
// entre WeekView et DayView via la même clé localStorage. Chaque vue
// appelle ce hook indépendamment ; pas besoin de le faire remonter en props.
export function useAgendaZoom() {
  // Valeur persistée, lue via useSyncExternalStore : getServerZoom() rend
  // un zoom 1 identique serveur/client au premier rendu (pas de mismatch
  // d'hydratation), puis React se resynchronise automatiquement sur la
  // vraie valeur localStorage juste après, sans passer par un effect qui
  // appellerait setState (évite les rendus en cascade).
  const storedZoom = useSyncExternalStore(subscribeToStoredZoom, readStoredZoom, getServerZoom);

  // Valeur "live" pendant un pinch en cours ; `null` = pas de geste actif,
  // on affiche alors storedZoom.
  const [liveZoom, setLiveZoom] = useState<number | null>(null);
  const zoom = liveZoom ?? storedZoom;

  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const gestureRef = useRef<{ startDistance: number; startZoom: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length === 2) {
      gestureRef.current = {
        startDistance: touchDistance(e.touches[0], e.touches[1]),
        startZoom: zoomRef.current,
      };
    }
  }, []);

  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    const gesture = gestureRef.current;
    if (!gesture || e.touches.length !== 2 || gesture.startDistance <= 0) return;
    const ratio = touchDistance(e.touches[0], e.touches[1]) / gesture.startDistance;
    pendingZoomRef.current = clampZoom(gesture.startZoom * ratio);
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (pendingZoomRef.current !== null) {
        setLiveZoom(pendingZoomRef.current);
        pendingZoomRef.current = null;
      }
    });
  }, []);

  // Persistance en fin de geste uniquement (pas à chaque touchmove) pour
  // éviter d'écrire en boucle dans localStorage pendant le pinch.
  const onTouchEnd = useCallback((e: ReactTouchEvent) => {
    if (e.touches.length >= 2 || !gestureRef.current) return;
    gestureRef.current = null;
    window.localStorage.setItem(STORAGE_KEY, String(zoomRef.current));
    setLiveZoom(null);
  }, []);

  return {
    zoom,
    touchHandlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
