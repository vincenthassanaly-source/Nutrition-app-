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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <span className="font-semibold text-green-800">Nutrition</span>
        <div className="flex items-center gap-3 text-sm text-neutral-500">
          <span className="truncate max-w-[10rem]">{user.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline">
              Déconnexion
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
