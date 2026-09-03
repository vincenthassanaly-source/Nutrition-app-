// Fonction pure, appelée aussi bien depuis `page.tsx` (Server Component)
// que depuis `JournalSwipeWrapper.tsx` ("use client") : elle doit donc
// vivre dans un module sans directive "use client", sinon toute référence
// directe côté serveur plante au runtime (les exports d'un module client
// ne peuvent être qu'affichés comme Component ou passés en props, jamais
// appelés directement depuis le serveur).
export function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
