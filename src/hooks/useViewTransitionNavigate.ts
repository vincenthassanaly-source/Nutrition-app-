"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Navigue vers `href` en enrobant `router.push` dans
 * `document.startViewTransition` quand l'API est disponible, pour un
 * crossfade léger entre deux pages (voir règles `::view-transition-old(root)`
 * / `::view-transition-new(root)` dans globals.css). Feature detection pure :
 * fallback silencieux sur `router.push` direct sur les navigateurs qui ne
 * supportent pas encore l'API (Safari, Firefox), aucune erreur levée.
 */
export function useViewTransitionNavigate() {
  const router = useRouter();

  return useCallback(
    (href: string) => {
      if (typeof document !== "undefined" && "startViewTransition" in document) {
        (document as Document & { startViewTransition: (callback: () => void) => void }).startViewTransition(
          () => {
            router.push(href);
          }
        );
      } else {
        router.push(href);
      }
    },
    [router]
  );
}
