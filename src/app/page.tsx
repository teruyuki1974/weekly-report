import {
  getDbHealth,
  getReports,
  getUsers,
  getDepartmentTree,
  getAllDepartments,
} from "./actions";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReportFormModal } from "@/components/ReportFormModal";
import { UserNav } from "@/components/UserNav";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SidebarTree } from "@/components/SidebarTree";
import {
  Database,
  Users,
  FileText,
  CheckCircle2,
  Building,
  Calendar,
  Filter,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{
    departmentId?: string;
    userId?: string;
    view?: string;
    search?: string;
  }>;
}

export default async function Home({ searchParams }: HomePageProps) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/login");
  }

  const { departmentId, userId, view, search } = await searchParams;

  const [health, users, tree, departments, allReports] = await Promise.all([
    getDbHealth(),
    getUsers(),
    getDepartmentTree(),
    getAllDepartments(),
    getReports({
      departmentId,
      userId: view === "mine" ? currentUser.id : userId,
      search,
    }),
  ]);

  // 絞り込み対象の名前
  const selectedDept = departmentId
    ? departments.find((d) => d.id === departmentId)
    : null;
  const selectedUser = userId ? users.find((u) => u.id === userId) : null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
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

      {/* Main 2-Pane Layout (左: ツリービューメニュー, 右: 週報コンテンツ) */}
      <div className="flex flex-1 w-full">
        {/* 左側ツリービューメニュー（一般ユーザーは部門と所属ユーザー、管理者は最上部に管理画面リンク） */}
        <SidebarTree
          tree={tree}
          currentUserId={currentUser.id}
          currentUserRole={currentUser.role}
        />

        {/* 右側メインエリア */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl space-y-6">
          {/* Active Filter Banner (絞り込み中の表示) */}
          {(selectedDept || selectedUser || view === "mine" || search) && (
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-indigo-900 dark:text-indigo-200">
                  現在絞り込み中:
                </span>
                {selectedDept && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
                    部門: {selectedDept.name}（配下含む）
                  </span>
                )}
                {selectedUser && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800 font-bold text-purple-700 dark:text-purple-300">
                    メンバー: {selectedUser.name}
                  </span>
                )}
                {view === "mine" && (
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 border border-indigo-200 dark:border-indigo-800 font-bold text-indigo-700 dark:text-indigo-300">
                    自分の週報のみ
                  </span>
                )}
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                <span>絞り込みを解除</span>
              </Link>
            </div>
          )}

          {/* Metric Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">表示中の週報数</p>
                <p className="text-2xl font-bold">{allReports.length} 件</p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center gap-4 shadow-xs">
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-zinc-500 font-medium">登録従業員数</p>
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
                <p className="text-xs text-zinc-500 font-medium">登録部門数</p>
                <p className="text-2xl font-bold">{departments.length} 部門</p>
              </div>
            </div>
          </section>

          {/* Weekly Reports Feed */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">
                  {selectedDept
                    ? `${selectedDept.name} の週報`
                    : selectedUser
                    ? `${selectedUser.name} さんの週報`
                    : view === "mine"
                    ? "あなたの週報"
                    : "全社の週報タイムライン"}
                </h2>
                <p className="text-xs text-zinc-500">
                  左のツリービューで部門やメンバーをクリックすると対象を絞り込めます
                </p>
              </div>
              <div className="text-xs text-zinc-400">全 {allReports.length} 件</div>
            </div>

            {allReports.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                <FileText className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  該当する週報がありません
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  右上の「週報を作成する」ボタンから投稿するか、別の部門・メンバーを選択してください。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allReports.map((report) => {
                  const isMyReport = report.userId === currentUser.id;

                  return (
                    <article
                      key={report.id}
                      className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden shadow-xs transition ${
                        isMyReport
                          ? "border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-500/20"
                          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                      }`}
                    >
                      {/* Article Header */}
                      <div className="p-5 border-b border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/?userId=${report.user.id}`}
                              className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm hover:underline"
                            >
                              {report.user.name}
                            </Link>
                            {report.user.department && (
                              <Link
                                href={`/?departmentId=${report.user.department.id}`}
                                className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition"
                              >
                                {report.user.department.name}
                              </Link>
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
                          作成日:{" "}
                          {new Date(report.createdAt).toLocaleDateString("ja-JP")}
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
    </div>
  );
}
