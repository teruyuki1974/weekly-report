"use client";

import { useTransition } from "react";
import { logoutAction, quickLoginAction } from "@/app/actions";
import { LogOut, User as UserIcon, ArrowRightLeft } from "lucide-react";

interface UserNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    department: string | null;
    role: string;
  };
}

export function UserNav({ user }: UserNavProps) {
  const [isPending, startTransition] = useTransition();

  const otherUsers = [
    { name: "山田 太郎 (開発)", email: "alice@example.com" },
    { name: "佐藤 花子 (デザイン)", email: "bob@example.com" },
    { name: "鈴木 一郎 (営業)", email: "charlie@example.com" },
  ].filter((u) => u.email !== user.email);

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  function handleSwitchUser(email: string) {
    startTransition(async () => {
      await quickLoginAction(email);
    });
  }

  return (
    <div className="flex items-center gap-3">
      {/* ログインユーザー情報 */}
      <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-zinc-200 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-xs">
          {user.name.slice(0, 1)}
        </div>
        <div className="text-left text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {user.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-normal">
              {user.department || "未所属"}
            </span>
          </div>
          <span className="text-[10px] text-zinc-400">
            {user.role === "MANAGER" ? "マネージャー" : "メンバー"}
          </span>
        </div>
      </div>

      {/* ユーザー切り替え（デモ用） */}
      <div className="hidden md:flex items-center gap-1">
        <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
          <ArrowRightLeft className="w-3 h-3" />
          切替:
        </span>
        {otherUsers.map((u) => (
          <button
            key={u.email}
            onClick={() => handleSwitchUser(u.email)}
            disabled={isPending}
            className="text-[11px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition"
          >
            {u.name.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* ログアウトボタン */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        title="ログアウト"
        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </div>
  );
}
