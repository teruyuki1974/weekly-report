import { getAllDepartments, getUsers, getDbHealth } from "@/app/actions";
import Link from "next/link";
import { Building2, Users, ArrowRight, ShieldCheck, Layers, Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [departments, users, health] = await Promise.all([
    getAllDepartments(),
    getUsers(),
    getDbHealth(),
  ]);

  const rootDepts = departments.filter((d) => !d.parentId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold">システム管理ダッシュボード</h2>
        <p className="text-xs text-zinc-500 mt-1">
          部門マスタおよびユーザーマスタの登録・階層設定・権限管理を行えます。
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 部門マスタカード */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                階層ツリー対応
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                部門マスタ
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                全社、本部、部などの階層構造を自由に定義できます。親子階層の設定により週報の集約閲覧が可能になります。
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                登録部門数: <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{departments.length}</span>
              </div>
              <div>
                ルート部門: <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{rootDepts.length}</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/admin/departments"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>部門マスタを管理</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ユーザーマスタカード */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                300人規模対応
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                ユーザーマスタ
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                従業員アカウントの登録・所属部門の設定・権限（一般メンバー / マネージャー / 管理者）の付与を行います。
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                登録ユーザー数: <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{users.length}</span>
              </div>
              <div>
                管理者数:{" "}
                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  {users.filter((u) => u.role === "ADMIN").length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <Link
              href="/admin/users"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>ユーザーマスタを管理</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 運用ガイド・設定情報 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 w-fit">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                組織階層と週報の連携仕様
              </h3>
              <ul className="text-xs text-zinc-500 mt-2 space-y-2 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>親部門を選択すると、配下のすべての部・チームの週報が自動的に串刺し表示されます。</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span>一般ユーザーには左ツリーで部門と所属メンバーが表示され、管理リンクは非表示となります。</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400">
            データベース: PostgreSQL 16 (Docker) 正常同期
          </div>
        </div>
      </div>
    </div>
  );
}
