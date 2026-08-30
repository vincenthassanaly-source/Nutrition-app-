import { ModulesGrid } from "@/components/ModulesGrid";
import { screenTitle } from "@/lib/ui";

export default function PlusPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Plus</h1>
      <ModulesGrid />
    </div>
  );
}
