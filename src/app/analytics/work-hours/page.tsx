import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getManagerWorkHoursAnalytics } from "@/app/actions";
import { Role } from "@prisma/client";
import { WorkHoursStackedChart } from "@/components/analytics/WorkHoursStackedChart";
import { UserNav } from "@/components/UserNav";
import {
  BarChart3,
  ArrowLeft,
  ShieldAlert,
  Clock,
  Users,
  Calendar,
} from "lucide-react";

interface WorkHoursAnalyticsPageProps {
  searchParams: Promise<{
    departmentId?: string;
  }>;
}

export default async function WorkHoursAnalyticsPage({
  searchParams,
}: WorkHoursAnalyticsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // マネージャーまたは管理者のみアクセス許可
  if (user.role !== Role.MANAGER && user.role !== Role.ADMIN) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            アクセス権限がありません
          </h1>
          <p className="text-sm text-zinc-500">
            配下メンバーの稼働時間集計グラフは、マネージャー（課長・部長等）または管理者のみ閲覧可能です。
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              週報一覧へ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { departmentId } = await searchParams;
  const analyticsData = await getManagerWorkHoursAnalytics(departmentId);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm font-medium transition mr-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
              title="週報一覧に戻る"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">一覧に戻る</span>
            </Link>

            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
              <BarChart3 className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg">
                  稼働時間集計（マネージャー用）
                </h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  積み上げグラフ
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                配下全メンバーの週次稼働時間モニタリング & 36協定・過重労働チェック
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UserNav user={user} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <WorkHoursStackedChart data={analyticsData} currentDeptId={departmentId} />
      </main>
    </div>
  );
}
