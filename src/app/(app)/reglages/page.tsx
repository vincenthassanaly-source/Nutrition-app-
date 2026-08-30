import { screenTitle } from "@/lib/ui";
import { AppearanceRow } from "./AppearanceRow";
import { NotificationsRow } from "./NotificationsRow";

export default function ReglagesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className={screenTitle}>Réglages</h1>
      <div className="rounded-[22px] border border-line bg-surface px-4 shadow-card">
        <AppearanceRow />
        <NotificationsRow />
        <div className="flex items-center justify-between border-t border-line py-3.5">
          <span className="text-[14px] font-medium text-ink">Profil</span>
          <span className="text-[13px] font-medium text-ink-2">Vincent</span>
        </div>
        <div className="flex items-center justify-between border-t border-line py-3.5">
          <span className="text-[14px] font-medium text-ink">Version</span>
          <span className="text-[13px] font-medium text-ink-3">0.1.0</span>
        </div>
      </div>
    </div>
  );
}
