"use client";

import { useState } from "react";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { createReport } from "@/app/actions";
import { PlusCircle, Eye, Edit3, X, User as UserIcon } from "lucide-react";

interface ReportFormModalProps {
  currentUser: {
    id: string;
    name: string;
    department: string | null;
    role: string;
  };
}

export function ReportFormModal({ currentUser }: ReportFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultContent = `## 今週の業務実績
- 

## 今週の成果・良かった点
- 

## 課題・相談事項
- 

## 来週の予定
- 
`;

  const [content, setContent] = useState(defaultContent);
  const [title, setTitle] = useState("週報: ");
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED">("SUBMITTED");

  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const currentWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("content", content);
    formData.append("year", currentYear.toString());
    formData.append("weekNumber", currentWeekNumber.toString());
    formData.append("status", status);

    try {
      await createReport(formData);
      setIsOpen(false);
      setContent(defaultContent);
    } catch (err) {
      alert("週報の保存に失敗しました: " + err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-lg shadow-sm transition"
      >
        <PlusCircle className="w-4 h-4" />
        週報を作成する
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  週報の新規作成 / 編集
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {currentYear}年 第{currentWeekNumber}週の週報（マークダウン入力対応）
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* ログインユーザー情報表示 & タイトル */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      提出者（ログイン中）
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm">
                      <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {currentUser.name}
                      </span>
                      {currentUser.department && (
                        <span className="text-xs text-zinc-500">
                          ({currentUser.department})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      タイトル
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例: 週報: 今週の成果と課題"
                      className="w-full text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* エディタとプレビューのタブ */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      週報本文（Markdown）
                    </label>
                    <div className="inline-flex rounded-lg border border-zinc-200 dark:border-zinc-700 p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setActiveTab("edit")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                          activeTab === "edit"
                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium"
                            : "text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        編集
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition ${
                          activeTab === "preview"
                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs font-medium"
                            : "text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        プレビュー
                      </button>
                    </div>
                  </div>

                  {activeTab === "edit" ? (
                    <textarea
                      required
                      rows={12}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Markdown形式で入力できます（## 見出し、- リスト など）"
                      className="w-full font-mono text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                    />
                  ) : (
                    <div className="min-h-[280px] p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                      <MarkdownRenderer content={content} />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "SUBMITTED"}
                      onChange={() => setStatus("SUBMITTED")}
                      className="text-indigo-600"
                    />
                    提出済みにする
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500">
                    <input
                      type="radio"
                      name="status"
                      checked={status === "DRAFT"}
                      onChange={() => setStatus("DRAFT")}
                    />
                    下書きとして保存
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-800"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "保存中..." : status === "SUBMITTED" ? "週報を提出" : "下書き保存"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
