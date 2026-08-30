import { getComptesAvecSolde } from "@/app/actions/comptes";
import { screenTitle } from "@/lib/ui";
import { AddCompteToggle } from "./AddCompteToggle";
import { ComptesList } from "./ComptesList";

export default async function ComptesPage() {
  const comptes = await getComptesAvecSolde();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Comptes</h1>
      <AddCompteToggle />
      <ComptesList comptes={comptes} />
    </div>
  );
}
