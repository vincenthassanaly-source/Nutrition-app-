import { differenceInCalendarWeeks, getDay } from "date-fns";
import type { Tables } from "@/lib/supabase/types";
import { parseISODate } from "@/app/(app)/agenda/date-utils";

// Un créneau "une_semaine_sur_deux" est actif une semaine sur deux, en
// parité avec sa semaine de référence : on compare le lundi de la semaine
// de `date` à celui de la semaine de référence (weekStartsOn: 1, cohérent
// avec le reste de l'Agenda), un écart pair signifiant "même parité".
export function estSemaineTravaillee(date: Date, semaineReference: Date): boolean {
  const diff = differenceInCalendarWeeks(date, semaineReference, { weekStartsOn: 1 });
  return Math.abs(diff) % 2 === 0;
}

export function getCreneauxDuJour(
  creneaux: Tables<"horaires_travail_creneaux">[],
  date: Date
): Tables<"horaires_travail_creneaux">[] {
  const jour = getDay(date);
  return creneaux.filter((creneau) => {
    if (creneau.jour_semaine !== jour) return false;
    if (creneau.frequence === "toutes_les_semaines") return true;
    if (!creneau.semaine_reference) return false;
    return estSemaineTravaillee(date, parseISODate(creneau.semaine_reference));
  });
}
