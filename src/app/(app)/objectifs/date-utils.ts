import { format } from "date-fns";

// Une entrée d'objectif est stockée en base comme une date (colonne `date`,
// pas de fuseau horaire) : on la formatte toujours en heure locale à minuit
// pour éviter les décalages de jour liés au fuseau du navigateur/serveur.

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
