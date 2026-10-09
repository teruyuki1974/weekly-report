"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  BarChart3,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  FileText,
  ChevronDown,
  Building,
  TrendingUp,
  Info,
} from "lucide-react";

interface Member {
  id: string;
  name: string;
  email: string;
  role: string;
  department: {
    id: string;
    name: string;
  } | null;
}

interface MemberBreakdown {
  userId: string;
  userName: string;
  departmentName: string;
  hours: number;
  reportTitle: string | null;
  status: string | null;
  hasSubmitted: boolean;
}

interface WeeklyData {
  year: number;
  weekNumber: number;
  weekLabel: string;
  totalHours: number;
  averageHours: number;
  breakdown: MemberBreakdown[];
}

interface AnalyticsData {
  currentUser: any;
  members: Member[];
  weeklyData: WeeklyData[];
  departments: { id: string; name: string }[];
}

interface WorkHoursStackedChartProps {
  data: AnalyticsData;
  currentDeptId?: string;
}

// 各週に割り当てる視認性の良いカラーパレット
const WEEK_PALETTE = [
  { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", text: "text-indigo-600 dark:text-indigo-400", hex: "#6366f1", badge: "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800" },
  { bg: "bg-emerald-500", hover: "hover:bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400", hex: "#10b981", badge: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800" },
  { bg: "bg-cyan-500", hover: "hover:bg-cyan-600", text: "text-cyan-600 dark:text-cyan-400", hex: "#06b6d4", badge: "bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800" },
  { bg: "bg-amber-500", hover: "hover:bg-amber-600", text: "text-amber-600 dark:text-amber-400", hex: "#f59e0b", badge: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", text: "text-purple-600 dark:text-purple-400", hex: "#a855f7", badge: "bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800" },
  { bg: "bg-teal-500", hover: "hover:bg-teal-600", text: "text-teal-600 dark:text-teal-400", hex: "#14b8a6", badge: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800" },
  { bg: "bg-rose-500", hover: "hover:bg-rose-600", text: "text-rose-600 dark:text-rose-400", hex: "#f43f5e", badge: "bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800" },
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", text: "text-blue-600 dark:text-blue-400", hex: "#3b82f6", badge: "bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", text: "text-orange-600 dark:text-orange-400", hex: "#f97316", badge: "bg-orange-50 dark:bg-orange-950/60 border-orange-200 dark:border-orange-800" },
  { bg: "bg-violet-500", hover: "hover:bg-violet-600", text: "text-violet-600 dark:text-violet-400", hex: "#8b5cf6", badge: "bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800" },
];

const MEMBER_PALETTE = [
  { hex: "#6366f1" },
  { hex: "#10b981" },
  { hex: "#f59e0b" },
  { hex: "#f43f5e" },
  { hex: "#06b6d4" },
  { hex: "#a855f7" },
  { hex: "#14b8a6" },
  { hex: "#3b82f6" },
  { hex: "#f97316" },
  { hex: "#8b5cf6" },
];

export function WorkHoursStackedChart({
  data,
  currentDeptId,
}: WorkHoursStackedChartProps) {
  const router = useRouter();
  const pathname = usePathname();

  // 選択中の特定週（ハイライト・絞り込み用）
  const [selectedWeekKey, setSelectedWeekKey] = useState<string | null>(null);
  // ツールチップ表示用のホバー情報
  const [hoveredSlice, setHoveredSlice] = useState<{
    weekLabel: string;
    userName: string;
    departmentName: string;
    hours: number;
    reportTitle: string | null;
    hasSubmitted: boolean;
    x: number;
    y: number;
  } | null>(null);

  // テーブル表示用のメンバーカラー
  const memberColors = useMemo(() => {
    const map = new Map<string, typeof MEMBER_PALETTE[0]>();
    data.members.forEach((m, idx) => {
      map.set(m.id, MEMBER_PALETTE[idx % MEMBER_PALETTE.length]);
    });
    return map;
  }, [data.members]);

  // 週カラーマップの作成（縦積み上げの各ブロックの色）
  const weekColors = useMemo(() => {
    const map = new Map<string, typeof WEEK_PALETTE[0]>();
    data.weeklyData.forEach((w, idx) => {
      map.set(`${w.year}-${w.weekNumber}`, WEEK_PALETTE[idx % WEEK_PALETTE.length]);
    });
    return map;
  }, [data.weeklyData]);

  // 部門変更ハンドラー
  const handleDeptChange = (deptId: string) => {
    if (deptId === "all") {
      router.push(pathname);
    } else {
      router.push(`${pathname}?departmentId=${deptId}`);
    }
  };

  // メンバー別・各週積み上げデータの構築
  const memberBars = useMemo(() => {
    return data.members.map((member) => {
      let totalHours = 0;
      const weekSlices = data.weeklyData.map((week) => {
        const b = week.breakdown.find((item) => item.userId === member.id);
        const hours = b?.hours || 0;
        totalHours += hours;
        return {
          weekKey: `${week.year}-${week.weekNumber}`,
          year: week.year,
          weekNumber: week.weekNumber,
          weekLabel: week.weekLabel,
          hours,
          reportTitle: b?.reportTitle || null,
          status: b?.status || null,
          hasSubmitted: !!b?.hasSubmitted,
        };
      });

      return {
        member,
        totalHours: Math.round(totalHours * 10) / 10,
        weekSlices,
      };
    });
  }, [data.members, data.weeklyData]);

  // 最新週のデータサマリー計算
  const latestWeek = data.weeklyData[data.weeklyData.length - 1];
  const totalHoursLatest = latestWeek?.totalHours || 0;
  const avgHoursLatest = latestWeek?.averageHours || 0;
  const overtimeCountLatest = latestWeek?.breakdown.filter((b) => b.hours > 45).length || 0;
  const submittedCountLatest = latestWeek?.breakdown.filter((b) => b.hasSubmitted).length || 0;
  const totalMembers = data.members.length;
  const submissionRate = totalMembers > 0 ? Math.round((submittedCountLatest / totalMembers) * 100) : 0;

  // グラフの最大高さを決定（メンバー合計稼働時間の最大値基準）
  const maxMemberHours = useMemo(() => {
    const max = Math.max(...memberBars.map((m) => m.totalHours), 50);
    // 余裕を持たせるため切りの良い数値に切り上げ (50h刻み)
    return Math.ceil(max / 50) * 50;
  }, [memberBars]);

  return (
    <div className="space-y-6">
      {/* 1. フィルター & ヘッダーツールバー */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            配下メンバーの週次稼働状況
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            管理対象: {data.members.length} 名のメンバー（マネージャー配下の部門および子部門）
          </p>
        </div>

        {/* 部門選択ドロップダウン */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 whitespace-nowrap flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            対象部門:
          </label>
          <div className="relative">
            <select
              value={currentDeptId || "all"}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="appearance-none bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs rounded-xl px-3 py-2 pr-8 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer"
            >
              <option value="all">管轄する全組織・全メンバー</option>
              {data.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. KPIサマリーカード */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-400">
              最新週 総稼働時間
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {totalHoursLatest.toFixed(1)}
              <span className="text-xs font-normal text-zinc-500 ml-1">時間</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-400">
              最新週 1人あたり平均
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {avgHoursLatest.toFixed(1)}
              <span className="text-xs font-normal text-zinc-500 ml-1">時間/人</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            overtimeCountLatest > 0
              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-400">
              過重労働注意 (45h超)
            </div>
            <div className={`text-xl font-bold ${
              overtimeCountLatest > 0 ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"
            }`}>
              {overtimeCountLatest}
              <span className="text-xs font-normal text-zinc-500 ml-1">名</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-zinc-400">
              最新週 週報提出率
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {submissionRate}%
              <span className="text-xs font-normal text-zinc-500 ml-1">
                ({submittedCountLatest}/{totalMembers})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. 積み上げグラフ表示エリア */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              メンバー別 稼働時間積み上げグラフ (横軸: メンバー / 縦: 各週を積み上げ)
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              各バー内のブロックにマウスを合わせると、対象週の稼働時間と週報情報が表示されます
            </p>
          </div>

          {/* 週選択クリアボタン */}
          {selectedWeekKey && (
            <button
              onClick={() => setSelectedWeekKey(null)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              フィルター解除（全週表示に戻す）
            </button>
          )}
        </div>

        {/* 週凡例（Legend）- クリックで特定週をハイライト */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
          <span className="text-[11px] font-semibold text-zinc-400 mr-1">週凡例:</span>
          {data.weeklyData.map((week) => {
            const weekKey = `${week.year}-${week.weekNumber}`;
            const color = weekColors.get(weekKey) || WEEK_PALETTE[0];
            const isSelected = selectedWeekKey === weekKey;
            return (
              <button
                key={weekKey}
                onClick={() =>
                  setSelectedWeekKey(isSelected ? null : weekKey)
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                  isSelected
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 shadow-sm"
                    : selectedWeekKey
                    ? "opacity-40 hover:opacity-100 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400"
                    : `${color.badge} ${color.text} hover:scale-105`
                }`}
                title="クリックしてこの週をハイライト"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color.hex }}
                />
                <span>第{week.weekNumber}週</span>
                <span className="text-[10px] opacity-75">
                  ({week.year}年)
                </span>
              </button>
            );
          })}
        </div>

        {/* グラフ描画本体 */}
        <div className="relative pt-6 pb-2">
          {/* Y軸の目盛り線 */}
          <div className="absolute inset-x-12 top-6 bottom-12 flex flex-col justify-between pointer-events-none">
            {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
              const val = Math.round(maxMemberHours * ratio);
              return (
                <div
                  key={ratio}
                  className="w-full flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/60 h-0"
                >
                  <span className="text-[10px] text-zinc-400 w-10 text-right -ml-12 shrink-0 select-none">
                    {val}h
                  </span>
                </div>
              );
            })}
          </div>

          {/* 各メンバーのバー (横軸: 人) */}
          <div className="relative pl-12 pr-4 h-72 flex items-end justify-around gap-4 sm:gap-6 pt-4">
            {memberBars.map(({ member, totalHours, weekSlices }) => {
              // バー全体の高さの割合（最大値に対する比率）
              const barHeightPercent =
                maxMemberHours > 0 ? (totalHours / maxMemberHours) * 100 : 0;

              return (
                <div
                  key={member.id}
                  className="flex-1 max-w-28 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* 合計稼働時間バッジ（バーの上部に表示） */}
                  <div className="mb-2 text-center">
                    <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md shadow-xs">
                      {totalHours.toFixed(1)}h
                    </span>
                  </div>

                  {/* 積み上げバーコンテナ */}
                  <div
                    className="w-full rounded-t-xl overflow-hidden flex flex-col-reverse justify-start shadow-sm transition-all duration-300 relative bg-zinc-100 dark:bg-zinc-800/40"
                    style={{ height: `${Math.max(barHeightPercent, 4)}%` }}
                  >
                    {totalHours > 0 ? (
                      weekSlices.map((item) => {
                        if (item.hours <= 0) return null;
                        const color = weekColors.get(item.weekKey) || WEEK_PALETTE[0];
                        // メンバーの総稼働時間に対する各週の割合
                        const slicePercent = (item.hours / totalHours) * 100;
                        const isHighlighted =
                          !selectedWeekKey || selectedWeekKey === item.weekKey;
                        const isOvertime = item.hours > 45;

                        return (
                          <div
                            key={item.weekKey}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setHoveredSlice({
                                weekLabel: item.weekLabel,
                                userName: member.name,
                                departmentName: member.department?.name || "未所属",
                                hours: item.hours,
                                reportTitle: item.reportTitle,
                                hasSubmitted: item.hasSubmitted,
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                              });
                            }}
                            onMouseLeave={() => setHoveredSlice(null)}
                            className={`w-full transition-all duration-200 relative cursor-pointer ${
                              color.bg
                            } ${
                              isHighlighted
                                ? "opacity-95 hover:opacity-100 brightness-105"
                                : "opacity-20"
                            } ${isOvertime ? "ring-2 ring-rose-400 ring-inset" : ""}`}
                            style={{ height: `${slicePercent}%` }}
                          >
                            {/* スライス内部の簡易テキスト（高さが十分にある場合のみ） */}
                            {slicePercent > 18 && (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[10px] font-bold text-white px-1 leading-tight overflow-hidden select-none">
                                <span className="truncate">第{item.weekNumber}週</span>
                                <span className="opacity-90">{item.hours}h</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[9px] text-zinc-400 font-medium">
                        0h
                      </div>
                    )}
                  </div>

                  {/* X軸ラベル: メンバー名 & 所属 */}
                  <div className="mt-2.5 text-center w-full px-0.5">
                    <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate" title={member.name}>
                      {member.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 block truncate" title={member.department?.name || "未所属"}>
                      {member.department?.name || "未所属"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ホバー時のフローティングツールチップ */}
          {hoveredSlice && (
            <div
              className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-zinc-900/95 dark:bg-zinc-800/95 text-white p-3 rounded-xl shadow-xl text-xs backdrop-blur-xs border border-zinc-700 max-w-xs transition-opacity duration-150 animate-in fade-in"
              style={{ left: `${hoveredSlice.x}px`, top: `${hoveredSlice.y}px` }}
            >
              <div className="flex items-center justify-between gap-2 border-b border-zinc-700/80 pb-1.5 mb-1.5">
                <span className="font-bold text-zinc-200">
                  {hoveredSlice.userName}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {hoveredSlice.departmentName}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-300">{hoveredSlice.weekLabel}</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {hoveredSlice.hours.toFixed(1)} 時間
                  </span>
                </div>
                {hoveredSlice.hours > 45 && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-400 font-semibold pt-0.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    45時間超過（過重労働アラート）
                  </div>
                )}
                {hoveredSlice.reportTitle && (
                  <div className="text-[11px] text-zinc-400 truncate pt-1 border-t border-zinc-800">
                    週報: {hoveredSlice.reportTitle}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. 週別メンバー稼働時間 内訳テーブル */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            配下メンバー稼働詳細・提出状況一覧
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            各週におけるメンバー別の稼働時間実績と提出状況
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 text-zinc-500">
                <th className="py-2.5 px-3 font-semibold">メンバー名</th>
                <th className="py-2.5 px-3 font-semibold">所属部門</th>
                {data.weeklyData.map((week) => (
                  <th
                    key={week.weekLabel}
                    className="py-2.5 px-3 font-semibold text-center whitespace-nowrap"
                  >
                    第{week.weekNumber}週
                  </th>
                ))}
                <th className="py-2.5 px-3 font-semibold text-right">期間合計</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {data.members.map((member) => {
                const color = memberColors.get(member.id) || MEMBER_PALETTE[0];
                let memberTotalHours = 0;

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                  >
                    <td className="py-3 px-3 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-500">
                      {member.department?.name || "未所属"}
                    </td>

                    {/* 各週の稼働時間 */}
                    {data.weeklyData.map((week) => {
                      const breakdown = week.breakdown.find(
                        (b) => b.userId === member.id
                      );
                      const hours = breakdown?.hours || 0;
                      memberTotalHours += hours;
                      const hasSubmitted = breakdown?.hasSubmitted;
                      const isOvertime = hours > 45;

                      return (
                        <td
                          key={week.weekLabel}
                          className="py-3 px-3 text-center whitespace-nowrap"
                        >
                          {hasSubmitted ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold ${
                                isOvertime
                                  ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                              }`}
                            >
                              {hours.toFixed(1)}h
                              {isOvertime && (
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                              )}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">
                              未提出
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                      {memberTotalHours.toFixed(1)}h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
