import { format } from "date-fns";

// Une échéance est stockée en base comme une date (colonne `date`, pas de
// fuseau horaire) : on la parse/formatte toujours en heure locale à minuit
// pour éviter les décalages de jour liés au fuseau du navigateur/serveur.

export function parseISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function sortByHeure(a: { heure: string | null }, b: { heure: string | null }): number {
  return (a.heure ?? "99:99").localeCompare(b.heure ?? "99:99");
}
