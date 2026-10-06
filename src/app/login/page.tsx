import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { Database, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-2xl shadow-md mb-3">
          週
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          週報システム ログイン
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          300人利用想定 / Next.js + PostgreSQL プロトタイプ
        </p>

        {/* Status badges */}
        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px]">
            <Database className="w-3 h-3" />
            PostgreSQL 稼働中
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-[11px]">
            <ShieldCheck className="w-3 h-3" />
            JWT セッション認証
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
