import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="fixed right-4 z-40" style={{ top: "calc(env(safe-area-inset-top) + 14px)" }}>
        <ThemeToggle />
      </div>
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 64px)",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 112px)",
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
