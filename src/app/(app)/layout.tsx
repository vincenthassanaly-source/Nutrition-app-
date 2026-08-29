import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-line bg-surface/92 px-4 py-3 backdrop-blur-md">
        <span className="font-display text-[15px] font-semibold text-kcal">Nutricio</span>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
