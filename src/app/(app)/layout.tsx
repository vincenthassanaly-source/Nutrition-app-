import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-background">
      <div className="fixed right-4 z-40" style={{ top: "calc(env(safe-area-inset-top) + 14px)" }}>
        <ThemeToggle />
      </div>
      <main
        className="flex-1 overflow-y-auto px-4 pb-28"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 64px)" }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
