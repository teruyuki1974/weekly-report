"use client";

import { useState, useTransition } from "react";
import { loginAction, quickLoginAction } from "@/app/actions";
import { LogIn, KeyRound, Mail, UserCheck, AlertCircle, ArrowRight } from "lucide-react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const demoUsers = [
    {
      name: "山田 太郎",
      department: "開発部",
      role: "一般メンバー",
      email: "alice@example.com",
      color: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100",
    },
    {
      name: "佐藤 花子",
      department: "デザイン部",
      role: "マネージャー",
      email: "bob@example.com",
      color: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
    },
    {
      name: "鈴木 一郎",
      department: "営業部",
      role: "一般メンバー",
      email: "charlie@example.com",
      color: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
    },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await loginAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    });
  }

  function handleQuickLogin(email: string) {
    setError(null);
    startTransition(async () => {
      await quickLoginAction(email);
    });
  }

  return (
    <div className="space-y-6">
      {/* 通常ログインフォーム */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
            メールアドレス
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              name="email"
              type="email"
              required
              placeholder="例: alice@example.com"
              defaultValue="alice@example.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              パスワード
            </label>
            <span className="text-[11px] text-zinc-400">初期PW: password123</span>
          </div>
          <div className="relative">
            <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              name="password"
              type="password"
              required
              placeholder="パスワードを入力"
              defaultValue="password123"
              className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition disabled:opacity-50"
        >
          <LogIn className="w-4 h-4" />
          {isPending ? "ログイン中..." : "ログインする"}
        </button>
      </form>

      {/* プロトタイプ用 クイックログイン */}
      <div className="pt-5 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
            <UserCheck className="w-4 h-4 text-indigo-500" />
            <span>テスト用クイックログイン（1クリック）</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            開発・検証用
          </span>
        </div>

        <p className="text-[11px] text-zinc-500 leading-relaxed">
          クリックすると各ユーザーとして即座にログインし、週報の作成や閲覧権限を検証できます。
        </p>

        <div className="space-y-2">
          {demoUsers.map((u) => (
            <button
              key={u.email}
              type="button"
              disabled={isPending}
              onClick={() => handleQuickLogin(u.email)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition text-left group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {u.name}
                  </span>
                  <span className="text-[11px] px-1.5 py-0.2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400">
                    {u.department}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{u.email}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
