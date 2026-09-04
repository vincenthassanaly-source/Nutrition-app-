import { BottomNav } from "@/components/BottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Providers } from "@/app/providers";
import { TabSwipeWrapper } from "@/components/TabSwipeWrapper";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="relative flex h-full flex-1 flex-col bg-background">
        <div className="fixed right-4 z-40" style={{ top: "calc(env(safe-area-inset-top) + 14px)" }}>
          <ThemeToggle />
        </div>
        <TabSwipeWrapper>{children}</TabSwipeWrapper>
        <BottomNav />
      </div>
    </Providers>
  );
}
