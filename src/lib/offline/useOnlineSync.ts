"use client";

import { useEffect, useState } from "react";
import { flushQueue } from "./queue";

// Écoute online/offline et rejoue la file d'attente au retour en ligne.
// Monté une seule fois dans src/app/providers.tsx (comme ToastHost) pour
// couvrir toute l'app, pas seulement l'écran actif.
export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState(
    () => typeof navigator === "undefined" || navigator.onLine
  );

  useEffect(() => {
    // Au cas où l'app est rouverte alors que des actions étaient restées en
    // attente d'une session précédente déjà en ligne.
    if (navigator.onLine) flushQueue();

    function handleOnline() {
      setIsOnline(true);
      flushQueue();
    }
    function handleOffline() {
      setIsOnline(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
