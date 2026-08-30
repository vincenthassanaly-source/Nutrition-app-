import { notFound } from "next/navigation";
import { getObjectif } from "@/app/actions/objectifs";
import { ObjectifHeader } from "./ObjectifHeader";
import { ObjectifSuiviBinaire } from "./ObjectifSuiviBinaire";
import { ObjectifSuiviEtapes } from "./ObjectifSuiviEtapes";
import { ObjectifSuiviValeur } from "./ObjectifSuiviValeur";

export default async function ObjectifDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getObjectif(id);

  if (!detail) {
    notFound();
  }

  const { objectif, etapes, entries } = detail;

  return (
    <div className="flex flex-col gap-5">
      <ObjectifHeader objectif={objectif} />

      {objectif.type_suivi === "valeur" && (
        <ObjectifSuiviValeur objectifId={id} objectif={objectif} entries={entries} />
      )}
      {objectif.type_suivi === "etapes" && (
        <ObjectifSuiviEtapes objectifId={id} etapes={etapes} />
      )}
      {objectif.type_suivi === "binaire" && <ObjectifSuiviBinaire objectif={objectif} />}
    </div>
  );
}
