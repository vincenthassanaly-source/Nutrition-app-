import { ModulesGrid } from "@/components/ModulesGrid";
import { eyebrow, screenTitle } from "@/lib/ui";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background px-4 py-6">
      <header className="mb-6">
        <p className={eyebrow}>Kilio</p>
        <h1 className={screenTitle}>Accueil</h1>
      </header>
      <ModulesGrid />
    </div>
  );
}
