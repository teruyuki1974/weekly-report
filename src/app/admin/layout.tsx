import { requireAdminUser } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Building2, Users, ShieldAlert, LayoutDashboard } from "lucide-react";
import { UserNav } from "@/components/UserNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentUser = await requireAdminUser();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>週報一覧へ戻る</span>
            </Link>

            <div className="h-5 w-px bg-zinc-200 dark:border-zinc-800" />

            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                管
              </span>
              <h1 className="font-bold text-base">システム管理画面</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                管理者専用エリア
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserNav user={currentUser} />
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 transition"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              ダッシュボード
            </Link>
            <Link
              href="/admin/departments"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              部門マスタ管理
            </Link>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-zinc-800 transition"
            >
              <Users className="w-3.5 h-3.5" />
              ユーザーマスタ管理
            </Link>
          </div>
        </div>
      </header>

      {/* Admin Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
