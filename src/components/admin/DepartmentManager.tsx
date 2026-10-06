"use client";

import { useState, useTransition } from "react";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  DepartmentTreeNode,
} from "@/app/actions";
import {
  Plus,
  FolderPlus,
  Edit2,
  Trash2,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Building2,
  AlertCircle,
  X,
  Users,
} from "lucide-react";

interface DepartmentManagerProps {
  tree: DepartmentTreeNode[];
  allDepartments: {
    id: string;
    name: string;
    order: number;
    parentId: string | null;
    parent: { name: string } | null;
    _count: { children: number; users: number };
  }[];
}

export function DepartmentManager({
  tree,
  allDepartments,
}: DepartmentManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // モーダル状態
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<{
    id: string;
    name: string;
    order: number;
    parentId: string | null;
  } | null>(null);

  const [createParentId, setCreateParentId] = useState<string>("none");

  function openCreateForParent(parentId?: string) {
    setCreateParentId(parentId || "none");
    setIsCreateOpen(true);
    setErrorMessage(null);
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createDepartmentAction(formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setIsCreateOpen(false);
      }
    });
  }

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editDept) return;
    setErrorMessage(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await updateDepartmentAction(editDept.id, formData);
      if (res?.error) {
        setErrorMessage(res.error);
      } else {
        setEditDept(null);
      }
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`部門「${name}」を削除してもよろしいですか？\n（所属するユーザーは「未所属」となります）`)) {
      return;
    }
    setErrorMessage(null);
    startTransition(async () => {
      const res = await deleteDepartmentAction(id);
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
            <Building2 className="w-5 h-5 text-indigo-600" />
            部門マスタ（階層組織管理）
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            会社の組織階層（本部・部・課など）の追加・編集・削除が行えます。
          </p>
        </div>

        <button
          onClick={() => openCreateForParent()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          新規部門を登録する
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 階層ツリー & テーブルの2ペインまたはツリーカード */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            現在の部門階層ツリー（全 {allDepartments.length} 部門）
          </span>
          <span className="text-xs text-zinc-400">
            右側のボタンから子部門の追加・編集・削除が可能です
          </span>
        </div>

        {tree.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-xs">
            部門が登録されていません。「新規部門を登録する」ボタンから作成してください。
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <AdminTreeRow
                key={node.id}
                node={node}
                level={0}
                onAddChild={(parentId) => openCreateForParent(parentId)}
                onEdit={(dept) => setEditDept(dept)}
                onDelete={(id, name) => handleDelete(id, name)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 1. 新規登録モーダル */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                部門の新規追加
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
                  部門名 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="例: フロントエンド開発部"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  親部門（階層）
                </label>
                <select
                  name="parentId"
                  defaultValue={createParentId}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">-- ルート部門（親なし） --</option>
                  {allDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.parent ? `[${d.parent.name}] > ` : ""}{d.name}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-zinc-400 mt-1">
                  選択した親部門の直下に配置されます。
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  表示順序（数値が小さいほど上）
                </label>
                <input
                  name="order"
                  type="number"
                  defaultValue="0"
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
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
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
                >
                  {isPending ? "登録中..." : "部門を登録"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. 編集モーダル */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                部門情報の変更
              </h3>
              <button
                onClick={() => setEditDept(null)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  部門名 <span className="text-rose-500">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  defaultValue={editDept.name}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  親部門（階層）
                </label>
                <select
                  name="parentId"
                  defaultValue={editDept.parentId || "none"}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="none">-- ルート部門（親なし） --</option>
                  {allDepartments
                    .filter((d) => d.id !== editDept.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.parent ? `[${d.parent.name}] > ` : ""}{d.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  表示順序
                </label>
                <input
                  name="order"
                  type="number"
                  defaultValue={editDept.order}
                  className="w-full text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg p-2.5 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
                  className="px-4 py-2 text-xs text-zinc-600 hover:text-zinc-900"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs disabled:opacity-50"
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

interface AdminTreeRowProps {
  node: DepartmentTreeNode;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (dept: { id: string; name: string; order: number; parentId: string | null }) => void;
  onDelete: (id: string, name: string) => void;
}

function AdminTreeRow({
  node,
  level,
  onAddChild,
  onEdit,
  onDelete,
}: AdminTreeRowProps) {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children.length > 0;
  const userCount = node.users.length;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 transition group"
        style={{ paddingLeft: `${Math.max(12, level * 24 + 12)}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400"
            >
              {isOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-6 h-6 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-600" />
            </span>
          )}

          <div className="flex items-center gap-2 truncate">
            {isOpen ? (
              <FolderOpen className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-indigo-500 shrink-0" />
            )}
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {node.name}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              (順序: {node.order})
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
              <Users className="w-3 h-3 text-zinc-400" />
              {userCount}名所属
            </span>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
          <button
            onClick={() => onAddChild(node.id)}
            title="子部門を追加"
            className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 transition"
          >
            <Plus className="w-3 h-3" />
            <span>子部門追加</span>
          </button>
          <button
            onClick={() =>
              onEdit({
                id: node.id,
                name: node.name,
                order: node.order,
                parentId: node.parentId,
              })
            }
            title="編集"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-800 transition"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name)}
            title="削除"
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-zinc-400 hover:text-rose-600 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className="space-y-1">
          {node.children.map((child) => (
            <AdminTreeRow
              key={child.id}
              node={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
