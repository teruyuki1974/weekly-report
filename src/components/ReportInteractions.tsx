"use client";

import { useState, useTransition } from "react";
import { Heart, MessageSquare, Send, Trash2, Loader2, Sparkles } from "lucide-react";
import { toggleReportLikeAction, addReportCommentAction, deleteReportCommentAction } from "@/app/actions";

interface LikeUser {
  id: string;
  name: string;
}

interface ReportLikeItem {
  id: string;
  userId: string;
  user: LikeUser;
}

interface CommentUser {
  id: string;
  name: string;
  department?: {
    name: string;
  } | null;
}

interface ReportCommentItem {
  id: string;
  userId: string;
  content: string;
  createdAt: Date | string;
  user: CommentUser;
}

interface ReportInteractionsProps {
  reportId: string;
  initialLikes: ReportLikeItem[];
  initialComments: ReportCommentItem[];
  currentUserId: string;
  currentUserRole?: string;
  currentUserName?: string;
}

export function ReportInteractions({
  reportId,
  initialLikes,
  initialComments,
  currentUserId,
  currentUserRole,
  currentUserName,
}: ReportInteractionsProps) {
  // いいね状態
  const [likes, setLikes] = useState<ReportLikeItem[]>(initialLikes);
  const [isLiked, setIsLiked] = useState<boolean>(
    initialLikes.some((like) => like.userId === currentUserId)
  );
  const [likeCount, setLikeCount] = useState<number>(initialLikes.length);
  const [isLiking, setIsLiking] = useState(false);
  const [heartAnimate, setHeartAnimate] = useState(false);

  // コメント状態
  const [comments, setComments] = useState<ReportCommentItem[]>(initialComments);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(true);

  // いいねトグル処理（楽観的更新）
  const handleToggleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);

    const prevIsLiked = isLiked;
    const prevLikeCount = likeCount;
    const prevLikes = likes;

    // 楽観的更新
    const nextIsLiked = !prevIsLiked;
    setIsLiked(nextIsLiked);
    setLikeCount((prev) => (nextIsLiked ? prev + 1 : Math.max(0, prev - 1)));
    if (nextIsLiked) {
      setHeartAnimate(true);
      setTimeout(() => setHeartAnimate(false), 400);
      setLikes((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          userId: currentUserId,
          user: { id: currentUserId, name: currentUserName || "自分" },
        },
      ]);
    } else {
      setLikes((prev) => prev.filter((l) => l.userId !== currentUserId));
    }

    try {
      const res = await toggleReportLikeAction(reportId);
      if (res && typeof res.likeCount === "number") {
        setLikeCount(res.likeCount);
        setIsLiked(res.isLiked);
      }
    } catch (error) {
      // エラー時はロールバック
      console.error("Like toggle error:", error);
      setIsLiked(prevIsLiked);
      setLikeCount(prevLikeCount);
      setLikes(prevLikes);
    } finally {
      setIsLiking(false);
    }
  };

  // コメント投稿処理
  const handleAddComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = commentText.trim();
    if (!content || isSubmittingComment) return;

    setIsSubmittingComment(true);

    // 楽観的コメント生成
    const tempComment: ReportCommentItem = {
      id: `temp-${Date.now()}`,
      userId: currentUserId,
      content,
      createdAt: new Date(),
      user: {
        id: currentUserId,
        name: currentUserName || "自分",
      },
    };

    setComments((prev) => [...prev, tempComment]);
    setCommentText("");

    try {
      const res = await addReportCommentAction(reportId, content);
      if (res.ok && res.comment) {
        // 本物のデータに置き換え
        setComments((prev) =>
          prev.map((c) => (c.id === tempComment.id ? (res.comment as any) : c))
        );
      }
    } catch (error) {
      console.error("Comment submit error:", error);
      alert("コメントの投稿に失敗しました。");
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      setCommentText(content);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // コメント削除処理
  const handleDeleteComment = async (commentId: string) => {
    if (isDeletingCommentId) return;
    if (!confirm("このコメントを削除しますか？")) return;

    setIsDeletingCommentId(commentId);
    const targetComment = comments.find((c) => c.id === commentId);

    // 楽観的削除
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      await deleteReportCommentAction(commentId);
    } catch (error) {
      console.error("Comment delete error:", error);
      alert("コメントの削除に失敗しました。");
      if (targetComment) {
        setComments((prev) => [...prev, targetComment]);
      }
    } finally {
      setIsDeletingCommentId(null);
    }
  };

  // キーボードショートカット（Ctrl/Cmd + Enter または Enter 単体での送信補助）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  // いいねしたユーザー名テキストの作成
  const likedUserNames = likes.map((l) => l.user.name).filter(Boolean);
  const likeTooltipText =
    likedUserNames.length > 0
      ? likedUserNames.length <= 3
        ? likedUserNames.join("、") + " がいいねしました"
        : `${likedUserNames.slice(0, 3).join("、")} ほか ${likedUserNames.length - 3} 名がいいねしました`
      : "";

  return (
    <div className="border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/30 dark:bg-zinc-900/30">
      {/* 操作バー（いいねボタン & コメント数トグル） */}
      <div className="px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* いいねボタン */}
          <button
            type="button"
            onClick={handleToggleLike}
            disabled={isLiking}
            title={likeTooltipText || "いいね！を押す"}
            className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer select-none ${
              isLiked
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-xs"
                : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:border-rose-300 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400"
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform duration-200 ${
                heartAnimate ? "scale-130" : "group-hover:scale-110"
              } ${isLiked ? "fill-rose-500 text-rose-500" : "text-zinc-400 group-hover:text-rose-500"}`}
            />
            <span>{likeCount > 0 ? `${likeCount}` : "いいね"}</span>
            {isLiked && <span className="text-[10px] text-rose-500 ml-0.5">済</span>}
          </button>

          {/* いいねユーザーのチラ見せアバター/リスト */}
          {likeCount > 0 && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <span title={likeTooltipText} className="truncate max-w-[200px] hover:underline cursor-default">
                {likeTooltipText}
              </span>
            </div>
          )}
        </div>

        {/* コメント表示切り替えボタン */}
        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
          <span>コメント ({comments.length})</span>
        </button>
      </div>

      {/* コメント一覧 & 入力エリア */}
      {showComments && (
        <div className="px-6 pb-5 pt-1 space-y-3">
          {/* コメント一覧 */}
          {comments.length > 0 && (
            <div className="space-y-2.5 pt-1">
              {comments.map((comment) => {
                const isMyComment = comment.userId === currentUserId;
                const canDelete = isMyComment || currentUserRole === "ADMIN";
                const isDeleting = isDeletingCommentId === comment.id;

                const commentDate = new Date(comment.createdAt);
                const timeString = isNaN(commentDate.getTime())
                  ? ""
                  : commentDate.toLocaleString("ja-JP", {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                return (
                  <div
                    key={comment.id}
                    className={`group/comment relative p-3 rounded-xl border text-xs transition ${
                      isMyComment
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/60"
                        : "bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* アバター頭文字 */}
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                          {comment.user.name?.slice(0, 1) || "U"}
                        </div>

                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {comment.user.name}
                        </span>

                        {comment.user.department && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                            {comment.user.department.name}
                          </span>
                        )}

                        {isMyComment && (
                          <span className="text-[9px] px-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold">
                            あなた
                          </span>
                        )}

                        <span className="text-[10px] text-zinc-400">{timeString}</span>
                      </div>

                      {/* 削除ボタン */}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={isDeleting}
                          title="コメントを削除"
                          className="opacity-0 group-hover/comment:opacity-100 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/60 text-zinc-400 hover:text-rose-600 transition"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    {/* コメント本文 */}
                    <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed pl-7">
                      {comment.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* コメント新規入力欄 */}
          <form onSubmit={handleAddComment} className="pt-1">
            <div className="flex gap-2.5 items-start">
              {/* 現在ユーザーの丸アイコン */}
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                {currentUserName ? currentUserName.slice(0, 1) : "私"}
              </div>

              {/* テキストエリアと送信ボタンのコンテナ */}
              <div className="flex-1 relative rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition shadow-xs">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="週報へのフィードバックやコメントを入力... (Ctrl+Enterで送信)"
                  className="w-full px-3 py-2 text-xs bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none"
                  disabled={isSubmittingComment}
                />

                <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-xl">
                  <span className="text-[10px] text-zinc-400">
                    Ctrl + Enter で送信
                  </span>

                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    {isSubmittingComment ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>送信中...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        <span>コメントする</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
