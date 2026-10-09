"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DepartmentTreeNode } from "@/app/actions";
import { Role } from "@prisma/client";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  User as UserIcon,
  Settings,
  Users,
  Building2,
  FileText,
  ShieldCheck,
  Briefcase,
  Layers,
  BarChart3,
  Clock,
  Star,
} from "lucide-react";
import { UserCheckButton } from "@/components/UserCheckButton";

interface SidebarTreeProps {
  tree: DepartmentTreeNode[];
  currentUserId: string;
  currentUserRole: Role;
  checkedUserIds?: string[];
}

export function SidebarTree({
  tree,
  currentUserId,
  currentUserRole,
  checkedUserIds = [],
}: SidebarTreeProps) {
  const searchParams = useSearchParams();
  const currentDeptId = searchParams.get("departmentId");
  const currentFilterUserId = searchParams.get("userId");
  const currentView = searchParams.get("view");

  const isAdmin = currentUserRole === Role.ADMIN;
  const isManager = currentUserRole === Role.MANAGER || currentUserRole === Role.ADMIN;
  const isCheckedView = !currentDeptId && !currentFilterUserId && (!currentView || currentView === "checked");

  return (
    <aside className="w-72 shrink-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 overflow-hidden">
      {/* 1. 管理者リンク（最上部: 要望の通り管理者は一番上に管理用画面へのリンクを配置） */}
      {isAdmin && (
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-linear-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-950/40 dark:to-purple-950/40">
          <Link
            href="/admin"
            className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1 rounded-lg bg-white/20">
                <Settings className="w-4 h-4 text-white animate-spin-hover" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold flex items-center gap-1.5">
                  システム管理画面
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-normal">
                    管理者専用
                  </span>
                </div>
                <p className="text-[10px] text-indigo-100">
                  部門マスタ・ユーザーマスタ設定
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/70 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      )}

      {/* 2. 基本ナビゲーション & マネージャー向けリンク */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 space-y-1">
        {/* ★ チェック対象のタイムライン（最新週報）- デフォルト */}
        <Link
          href="/"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
            isCheckedView
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/80 dark:border-amber-900/60"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className={`w-4 h-4 ${isCheckedView ? "fill-amber-400 text-amber-500" : "text-amber-500"}`} />
            <span>チェック対象（最新週報）</span>
          </div>
          {checkedUserIds.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 font-bold">
              {checkedUserIds.length}名
            </span>
          )}
        </Link>

        {/* すべての週報 */}
        <Link
          href="/?view=all"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
            !currentDeptId && !currentFilterUserId && currentView === "all"
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-500" />
          <span>すべての週報</span>
        </Link>

        {/* 自分の週報 */}
        <Link
          href="/?view=mine"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
            currentView === "mine"
              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <UserIcon className="w-4 h-4 text-purple-500" />
          <span>自分の週報</span>
        </Link>

        {/* マネージャー向け稼働時間集計リンク */}
        {isManager && (
          <Link
            href="/analytics/work-hours"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition group"
          >
            <div className="flex items-center gap-2.5">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="font-bold flex items-center gap-1">
                  配下メンバー稼働集計
                </span>
                <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">
                  積み上げグラフ表示
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition" />
          </Link>
        )}
      </div>

      {/* 3. 組織・ユーザー ツリービュー */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            組織・メンバーツリー
          </span>
          <span className="text-[10px] text-zinc-400">階層別</span>
        </div>

        <div className="space-y-0.5">
          {tree.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              level={0}
              currentDeptId={currentDeptId}
              currentFilterUserId={currentFilterUserId}
              currentUserId={currentUserId}
              checkedUserIds={checkedUserIds}
            />
          ))}
        </div>
      </div>

      {/* フッター情報 */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-[11px] text-zinc-400 flex items-center justify-between">
        <span>300名利用対応組織構成</span>
        <span className="font-mono text-[10px]">v1.0</span>
      </div>
    </aside>
  );
}

interface TreeNodeItemProps {
  node: DepartmentTreeNode;
  level: number;
  currentDeptId: string | null;
  currentFilterUserId: string | null;
  currentUserId: string;
  checkedUserIds: string[];
}

function TreeNodeItem({
  node,
  level,
  currentDeptId,
  currentFilterUserId,
  currentUserId,
  checkedUserIds,
}: TreeNodeItemProps) {
  // 初期状態では第1〜第2階層を開いておく
  const [isOpen, setIsOpen] = useState(level < 2);

  const isDeptSelected = currentDeptId === node.id;
  const hasChildren = node.children.length > 0;
  const hasUsers = node.users.length > 0;
  const totalUsers = node.users.length;

  return (
    <div className="select-none text-xs">
      {/* 部門行 */}
      <div
        className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition group ${
          isDeptSelected
            ? "bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-200 font-semibold"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        }`}
        style={{ paddingLeft: `${Math.max(8, level * 16 + 8)}px` }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {(hasChildren || hasUsers) ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5" />
          )}

          <Link
            href={`/?departmentId=${node.id}`}
            className="flex items-center gap-1.5 flex-1 min-w-0 truncate"
            title={`${node.name} の週報を表示`}
          >
            {isOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-500 shrink-0 transition" />
            )}
            <span className="truncate">{node.name}</span>
          </Link>
        </div>

        {totalUsers > 0 && (
          <span className="text-[10px] text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 ml-1 px-1.5 py-0.2 rounded-full bg-zinc-100 dark:bg-zinc-800">
            {totalUsers}名
          </span>
        )}
      </div>

      {/* 配下の子部門およびユーザー */}
      {isOpen && (
        <div className="space-y-0.5 mt-0.5">
          {/* 子部門 */}
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              currentDeptId={currentDeptId}
              currentFilterUserId={currentFilterUserId}
              currentUserId={currentUserId}
              checkedUserIds={checkedUserIds}
            />
          ))}

          {/* 部門に所属するユーザー */}
          {node.users.map((user) => {
            const isUserSelected = currentFilterUserId === user.id;
            const isMe = user.id === currentUserId;
            const isChecked = checkedUserIds.includes(user.id);

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between rounded-lg py-1 px-2 transition group ${
                  isUserSelected
                    ? "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 font-semibold"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                }`}
                style={{
                  paddingLeft: `${(level + 1) * 16 + 18}px`,
                }}
              >
                <Link
                  href={`/?userId=${user.id}`}
                  className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1"
                >
                  <UserIcon className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shrink-0" />
                  <span className="truncate">{user.name}</span>
                  {isMe && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                      自分
                    </span>
                  )}
                </Link>

                <div className="flex items-center gap-1 shrink-0">
                  {user.role === Role.ADMIN ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                      管理者
                    </span>
                  ) : user.role === Role.MANAGER ? (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                      MG
                    </span>
                  ) : null}

                  {/* チェック（★）ボタン */}
                  {!isMe && (
                    <UserCheckButton
                      targetUserId={user.id}
                      targetUserName={user.name}
                      initialChecked={isChecked}
                      size="sm"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
