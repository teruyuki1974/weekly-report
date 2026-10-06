import { getDbHealth, getReports, getUsers } from "./actions";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportFormModal } from "@/components/ReportFormModal";
import { UserNav } from "@/components/UserNav";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  Database,
  Users,
  FileText,
  CheckCircle2,
  Building,
  Calendar,
  Filter,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    department?: string;
    view?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const { department, view } = await searchParams;

  const [health, users, allReports] = await Promise.all([
    getDbHealth(),
    getUsers(),
    getReports(department),
  ]);

  // 部署一覧の集計
  const departments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  ) as string[];

  // 「全員」か「自分の週報のみ」かのフィルタリング
  const reports =
    view === "mine"
      ? allReports.filter((r) => r.userId === currentUser.id)
      : allReports;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                週
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg">週報システム</h1>
                  <span className="hidden sm:inline-block text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    300人利用想定
                  </span>
                </div>
                <p className="text-xs text-zinc-500">Next.js + PostgreSQL (Docker)</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* DB Health Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5" />
              <span>DB接続中</span>
            </div>

            {/* 週報新規作成モーダル（ログインユーザーが提出者） */}
            <ReportFormModal currentUser={currentUser} />

            {/* ログインユーザーメニュー & ログアウト */}
            <UserNav user={currentUser} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">登録週報総数</p>
              <p className="text-2xl font-bold">{allReports.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">登録ユーザー数</p>
              <p className="text-2xl font-bold">
                {users.length}{" "}
                <span className="text-xs font-normal text-zinc-400">/ 300名規模</span>
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">部署数</p>
              <p className="text-2xl font-bold">{departments.length} 部署</p>
            </div>
          </div>
        </section>

        {/* フィルタ & タブバー */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          {/* 表示切り替えタブ */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition ${
                !view
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
              }`}
            >
              全員の週報
            </Link>
            <Link
              href="/?view=mine"
              className={`text-xs sm:text-sm font-medium px-3.5 py-1.5 rounded-lg transition ${
                view === "mine"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
              }`}
            >
              自分の週報のみ
            </Link>
          </div>

          {/* 部署絞り込み（300人規模での一覧性確保） */}
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500 font-medium">部署:</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <Link
                href={view ? `/?view=${view}` : "/"}
                className={`px-2.5 py-1 rounded-md transition ${
                  !department
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                }`}
              >
                すべて
              </Link>
              {departments.map((dept) => {
                const isSelected = department === dept;
                const query = new URLSearchParams();
                if (view) query.set("view", view);
                query.set("department", dept);

                return (
                  <Link
                    key={dept}
                    href={`/?${query.toString()}`}
                    className={`px-2.5 py-1 rounded-md transition whitespace-nowrap ${
                      isSelected
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200"
                    }`}
                  >
                    {dept}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Weekly Reports Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {view === "mine" ? "あなたの週報" : "週報タイムライン"}
              </h2>
              <p className="text-xs text-zinc-500">
                {view === "mine"
                  ? "あなたが提出・作成した週報一覧"
                  : "社内メンバーが提出した週報一覧（マークダウン形式表示）"}
              </p>
            </div>
            <div className="text-xs text-zinc-400">全 {reports.length} 件</div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                表示できる週報がありません
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                右上の「週報を作成する」ボタンから週報を投稿してみましょう！
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => {
                const isMyReport = report.userId === currentUser.id;

                return (
                  <article
                    key={report.id}
                    className={`bg-white dark:bg-zinc-900 border rounded-xl overflow-hidden shadow-xs transition ${
                      isMyReport
                        ? "border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-500/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                    }`}
                  >
                    {/* Article Header */}
                    <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                            {report.user.name}
                          </span>
                          {report.user.department && (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {report.user.department}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              report.status === "SUBMITTED"
                                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                            }`}
                          >
                            {report.status === "SUBMITTED" ? "提出済" : "下書き"}
                          </span>

                          {isMyReport && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              あなたの週報
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                          {report.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-zinc-400 shrink-0">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {report.year}年 第{report.weekNumber}週
                        </span>
                      </div>
                    </div>

                    {/* Article Body (Markdown) */}
                    <div className="p-6">
                      <MarkdownRenderer content={report.content} />
                    </div>

                    {/* Article Footer */}
                    <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-900/30 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                      <span>
                        作成日: {new Date(report.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PostgreSQL 同期完了
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
