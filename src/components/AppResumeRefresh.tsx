"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Quand l'app repasse au premier plan (retour depuis l'arrière-plan sur mobile,
// restauration bfcache du navigateur), aucune navigation ni fetch RSC n'a lieu :
// React réaffiche simplement l'arbre déjà en mémoire. Si des données ont changé
// pendant que l'app était en arrière-plan (ex: écriture directe en base par une
// session Claude Code, sans passer par une Server Action de ce site qui
// déclencherait un revalidatePath), rien ne les rafraîchit sans ce listener.
export function AppResumeRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refresh = () => router.refresh();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refresh();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [router]);

  return null;
}
