"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toggleUserCheckAction } from "@/app/actions";

interface UserCheckButtonProps {
  targetUserId: string;
  targetUserName?: string;
  initialChecked: boolean;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function UserCheckButton({
  targetUserId,
  targetUserName,
  initialChecked,
  size = "md",
  showLabel = false,
}: UserCheckButtonProps) {
  const [isChecked, setIsChecked] = useState(initialChecked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // 楽観的更新
    const nextState = !isChecked;
    setIsChecked(nextState);

    startTransition(async () => {
      try {
        const res = await toggleUserCheckAction(targetUserId);
        setIsChecked(res.isChecked);
      } catch (err) {
        setIsChecked(!nextState); // ロールバック
        console.error("Failed to toggle user check:", err);
      }
    });
  };

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={
        isChecked
          ? `${targetUserName || "このメンバー"} のチェックを外す`
          : `${targetUserName || "このメンバー"} をチェック対象に追加（最新週報をトップに表示）`
      }
      className={`inline-flex items-center gap-1 p-1 rounded-md transition cursor-pointer ${
        isChecked
          ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          : "text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <Star
        className={`${iconSize} transition-transform duration-150 ${
          isChecked ? "fill-amber-400 text-amber-500 scale-110" : "fill-none"
        } ${isPending ? "opacity-60 animate-pulse" : ""}`}
      />
      {showLabel && (
        <span className="text-[11px] font-medium">
          {isChecked ? "チェック中" : "チェック"}
        </span>
      )}
    </button>
  );
}
