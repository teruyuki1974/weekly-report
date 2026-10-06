import { getDbHealth, getReports, getUsers } from "./actions";
import { ReportFormModal } from "@/components/ReportFormModal";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { Database, Users, FileText, CheckCircle2, Building, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [health, users, reports] = await Promise.all([
    getDbHealth(),
    getUsers(),
    getReports(),
  ]);

  // 部署一覧の集計
  const departments = Array.from(
    new Set(users.map((u) => u.department).filter(Boolean))
  ) as string[];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              週
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg">週報システム</h1>
                <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  Prototype (300人想定)
                </span>
              </div>
              <p className="text-xs text-zinc-500">Next.js + TypeScript + PostgreSQL (Docker)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* DB Health Status Badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Database className="w-3.5 h-3.5" />
              <span>PostgreSQL 稼働中</span>
            </div>

            <ReportFormModal users={users} />
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
              <p className="text-xs text-zinc-500 font-medium">登録週報数</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-medium">利用ユーザー数</p>
              <p className="text-2xl font-bold">{users.length} <span className="text-xs font-normal text-zinc-400">/ 300名想定</span></p>
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

        {/* Weekly Reports Feed */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">週報タイムライン</h2>
              <p className="text-xs text-zinc-500">
                メンバーが提出した週報一覧（マークダウン形式表示）
              </p>
            </div>
            <div className="text-xs text-zinc-400">
              全 {reports.length} 件
            </div>
          </div>

          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
              <FileText className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                まだ週報が登録されていません
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                右上の「週報を作成する」ボタンから最初の週報を投稿してみましょう！
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  {/* Article Header */}
                  <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
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
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
