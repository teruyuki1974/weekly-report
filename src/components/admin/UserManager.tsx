"use client";

import { useState, useTransition } from "react";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/actions";
import { Role } from "@prisma/client";
import {
  Users,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  KeyRound,
  Mail,
  Building,
  ShieldCheck,
  AlertCircle,
  X,
  FileText,
} from "lucide-react";

interface UserManagerProps {
  users: {
    id: string;
    name: string;
    email: string;
    role: Role;
    departmentId: string | null;
    department: { id: string; name: string } | null;
    createdAt: Date;
    _count: { reports: number };
  }[];
  departments: {
    id: string;
    name: string;
    parent: { name: string } | null;
  }[];
  currentUserId: string;
}

export function UserManager({
  users,
  departments,
  currentUserId,
}: UserManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");
  const [filterDept, setFilterDept] = useState<string>("ALL");

  // モーダル
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: Role;
    departmentId: string | null;
  } | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === "ALL" || u.role === filterRole;
    const matchesDept =
      filterDept === "ALL" ||
      (filterDept === "NONE" ? !u.departmentId : u.departmentId === filterDept);

    return matchesSearch && matchesRole && matchesDept;
  });

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setIsCreateOpen(false);
      }
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateUserAction(editUser.id, formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setEditUser(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (id === currentUserId) {
      alert("ログイン中の管理者アカウント自身を削除することはできません。");
      return;
    }
    if (!confirm(`ユーザー「${name}」を削除してもよろしいですか？\n（関連する週報データも削除されます）`)) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (res?.error) {
        alert(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            ユーザーマスタ管理
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            社内メンバーのアカウント発行、所属部門の設定、管理者権限の付与を行います。
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setErrorMessage(null);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <UserPlus className="w-4 h-4" />
          新規ユーザーを登録する
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="氏名やメールアドレスで検索..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800"
          >
            <option value="ALL">すべての権限</option>
            <option value="ADMIN">管理者のみ</option>
            <option value="MANAGER">マネージャーのみ</option>
            <option value="MEMBER">一般メンバーのみ</option>
          </select>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-800"
          >
            <option value="ALL">すべての部門</option>
            <option value="NONE">未所属</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.parent ? `${d.parent.name} > ` : ""}{d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ユーザー一覧テーブル */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold">
              <tr>
                <th className="px-6 py-3.5">氏名 / メールアドレス</th>
                <th className="px-6 py-3.5">所属部門</th>
                <th className="px-6 py-3.5">権限</th>
                <th className="px-6 py-3.5 text-center">提出週報数</th>
                <th className="px-6 py-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-400">
                    該当するユーザーが見つかりませんでした。
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isMe = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                            {user.name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              {user.name}
                              {isMe && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                                  あなた
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {user.department ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            <Building className="w-3 h-3 text-zinc-400" />
                            {user.department.name}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic">未所属</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {user.role === Role.ADMIN ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                            <ShieldCheck className="w-3 h-3" />
                            管理者
                          </span>
                        ) : user.role === Role.MANAGER ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            マネージャー
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            一般メンバー
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          <FileText className="w-3 h-3 text-zinc-400" />
                          {user._count.reports}件
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditUser({
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role,
                                departmentId: user.departmentId,
                              });
                              setErrorMessage(null);
                            }}
                            title="編集"
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={isMe}
                            title={isMe ? "自分自身は削除できません" : "削除"}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-zinc-400 hover:text-rose-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. 新規ユーザー作成モーダル */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                新規ユーザーの登録
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  氏名 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="例: 佐藤 健"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  メールアドレス <span className="text-rose-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="例: sato@example.com"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  初期パスワード
                </label>
                <input
                  name="password"
                  type="password"
                  defaultValue="password123"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-zinc-400 mt-1">
                  未変更の場合は「password123」が設定されます。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  所属部門
                </label>
                <select
                  name="departmentId"
                  defaultValue="none"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="none">-- 所属部門なし --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.parent ? `${d.parent.name} > ` : ""}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  権限（ロール）
                </label>
                <select
                  name="role"
                  defaultValue={Role.MEMBER}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={Role.MEMBER}>一般メンバー（週報の作成・閲覧）</option>
                  <option value={Role.MANAGER}>マネージャー</option>
                  <option value={Role.ADMIN}>管理者（マスタ管理画面アクセス可能）</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "登録中..." : "ユーザーを登録"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. ユーザー編集モーダル */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" />
                ユーザー情報の変更
              </h3>
              <button
                onClick={() => setEditUser(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  氏名 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editUser.name}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  メールアドレス <span className="text-rose-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={editUser.email}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  新パスワード（変更する場合のみ入力）
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="現在のままにする場合は空欄"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  所属部門
                </label>
                <select
                  name="departmentId"
                  defaultValue={editUser.departmentId || "none"}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="none">-- 所属部門なし --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.parent ? `${d.parent.name} > ` : ""}{d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  権限（ロール）
                </label>
                <select
                  name="role"
                  defaultValue={editUser.role}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={Role.MEMBER}>一般メンバー</option>
                  <option value={Role.MANAGER}>マネージャー</option>
                  <option value={Role.ADMIN}>管理者（マスタ管理アクセス可）</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "更新中..." : "変更を保存"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
