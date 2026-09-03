// Retour haptique court sur les interactions tactiles clés (cocher une
// tâche/habitude, confirmer une suppression). No-op silencieux si l'API
// Vibration n'est pas supportée (Safari iOS, desktop) ou refuse l'appel.
export function vibrate(pattern: number | number[] = 12) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignoré : certains navigateurs lèvent si l'appel n'est pas rattaché à
    // un geste utilisateur direct.
  }
}
