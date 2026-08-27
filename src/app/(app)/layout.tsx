import { requireUser } from "@/lib/supabase/auth";
import { BottomNav } from "@/components/BottomNav";
import { signOut } from "@/app/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <header className="flex items-center justify-between border-b border-line bg-surface/92 px-4 py-3 backdrop-blur-md">
        <span className="font-display text-[15px] font-semibold text-kcal">Nutrition</span>
        <div className="flex items-center gap-3 text-xs text-ink-2">
          <span className="truncate max-w-[10rem]">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="font-semibold text-kcal">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-5">{children}</main>
      <BottomNav />
    </div>
  );
}
