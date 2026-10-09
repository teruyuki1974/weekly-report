"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReportStatus, Role } from "@prisma/client";
import {
  createSession,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { redirect } from "next/navigation";

// --- 認証関連 ---

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function quickLoginAction(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("ユーザーが見つかりません。");
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

// --- 部門階層ツリー取得 ---

export interface DepartmentTreeNode {
  id: string;
  name: string;
  order: number;
  parentId: string | null;
  children: DepartmentTreeNode[];
  users: {
    id: string;
    name: string;
    email: string;
    role: Role;
  }[];
}

export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  const departments = await prisma.department.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: [{ role: "desc" }, { name: "asc" }],
      },
    },
  });

  // ツリー構造の構築
  const map = new Map<string, DepartmentTreeNode>();
  departments.forEach((d) => {
    map.set(d.id, {
      id: d.id,
      name: d.name,
      order: d.order,
      parentId: d.parentId,
      children: [],
      users: d.users,
    });
  });

  const roots: DepartmentTreeNode[] = [];
  map.forEach((node) => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export async function getAllDepartments() {
  return await prisma.department.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: {
      parent: true,
      _count: {
        select: {
          children: true,
          users: true,
        },
      },
    },
  });
}

// --- システムヘルス・データ取得 ---

export async function getDbHealth() {
  try {
    const userCount = await prisma.user.count();
    const reportCount = await prisma.weeklyReport.count();
    const departmentCount = await prisma.department.count();
    return {
      ok: true,
      userCount,
      reportCount,
      departmentCount,
    };
  } catch (error) {
    console.error("DB health check error:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { name: "asc" }],
    include: {
      department: true,
      _count: {
        select: { reports: true },
      },
    },
  });
}

// 配下部門のIDを再帰的に収集
async function getDescendantDepartmentIds(deptId: string): Promise<string[]> {
  const ids = [deptId];
  const children = await prisma.department.findMany({
    where: { parentId: deptId },
    select: { id: true },
  });
  for (const child of children) {
    const subIds = await getDescendantDepartmentIds(child.id);
    ids.push(...subIds);
  }
  return ids;
}

const reportIncludeOptions = {
  user: {
    include: {
      department: true,
    },
  },
  comments: {
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
  likes: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getReports(options?: {
  departmentId?: string;
  userId?: string;
  search?: string;
}) {
  const where: any = {};

  if (options?.userId) {
    where.userId = options.userId;
  } else if (options?.departmentId && options.departmentId !== "all") {
    // 選択された部門とその子部門すべてのユーザーの週報を対象にする
    const deptIds = await getDescendantDepartmentIds(options.departmentId);
    where.user = {
      departmentId: { in: deptIds },
    };
  }

  if (options?.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { content: { contains: options.search, mode: "insensitive" } },
      { user: { name: { contains: options.search, mode: "insensitive" } } },
    ];
  }

  return await prisma.weeklyReport.findMany({
    where,
    include: reportIncludeOptions,
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }, { createdAt: "desc" }],
  });
}

// --- チェック（★）機能 ---

export async function getCheckedUserIds(currentUserId?: string): Promise<string[]> {
  if (!currentUserId) return [];
  const checks = await prisma.userCheck.findMany({
    where: { userId: currentUserId },
    select: { targetId: true },
  });
  return checks.map((c) => c.targetId);
}

export async function toggleUserCheckAction(targetUserId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const existing = await prisma.userCheck.findUnique({
    where: {
      userId_targetId: {
        userId: currentUser.id,
        targetId: targetUserId,
      },
    },
  });

  let isChecked = false;
  if (existing) {
    await prisma.userCheck.delete({
      where: { id: existing.id },
    });
    isChecked = false;
  } else {
    await prisma.userCheck.create({
      data: {
        userId: currentUser.id,
        targetId: targetUserId,
      },
    });
    isChecked = true;
  }

  revalidatePath("/");
  return { ok: true, isChecked };
}

// チェック対象者の「最新の週報」だけを取得する
export async function getCheckedLatestReports(options: {
  currentUserId: string;
  search?: string;
}) {
  const checkedUserIds = await getCheckedUserIds(options.currentUserId);
  if (checkedUserIds.length === 0) {
    return { reports: [], checkedUserIds: [] };
  }

  const where: any = {
    userId: { in: checkedUserIds },
  };

  if (options.search) {
    where.OR = [
      { title: { contains: options.search, mode: "insensitive" } },
      { content: { contains: options.search, mode: "insensitive" } },
      { user: { name: { contains: options.search, mode: "insensitive" } } },
    ];
  }

  const allReports = await prisma.weeklyReport.findMany({
    where,
    include: reportIncludeOptions,
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }, { createdAt: "desc" }],
  });

  // 各ユーザーごとに最新の1件のみを抽出
  const latestReportsMap = new Map<string, (typeof allReports)[0]>();
  for (const report of allReports) {
    if (!latestReportsMap.has(report.userId)) {
      latestReportsMap.set(report.userId, report);
    }
  }

  return {
    reports: Array.from(latestReportsMap.values()),
    checkedUserIds,
  };
}

// --- いいね（Like）機能 ---

export async function toggleReportLikeAction(reportId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const existing = await prisma.reportLike.findUnique({
    where: {
      reportId_userId: {
        reportId,
        userId: currentUser.id,
      },
    },
  });

  let isLiked = false;
  if (existing) {
    await prisma.reportLike.delete({
      where: { id: existing.id },
    });
    isLiked = false;
  } else {
    await prisma.reportLike.create({
      data: {
        reportId,
        userId: currentUser.id,
      },
    });
    isLiked = true;
  }

  const likeCount = await prisma.reportLike.count({
    where: { reportId },
  });

  revalidatePath("/");
  return { ok: true, isLiked, likeCount };
}

// --- コメント機能 ---

export async function addReportCommentAction(reportId: string, content: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("コメントを入力してください。");
  }

  const comment = await prisma.comment.create({
    data: {
      reportId,
      userId: currentUser.id,
      content: trimmed,
    },
    include: {
      user: {
        include: {
          department: true,
        },
      },
    },
  });

  revalidatePath("/");
  return { ok: true, comment };
}

export async function deleteReportCommentAction(commentId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!comment) {
    throw new Error("コメントが見つかりません。");
  }

  // 投稿者本人またはADMINのみ削除可能
  if (comment.userId !== currentUser.id && currentUser.role !== Role.ADMIN) {
    throw new Error("コメントを削除する権限がありません。");
  }

  await prisma.comment.delete({
    where: { id: commentId },
  });

  revalidatePath("/");
  return { ok: true };
}

// --- 週報作成（ログイン中のユーザーに紐づけ） ---

export async function createReport(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const workHours = parseFloat(formData.get("workHours") as string) || 40.0;
  const year = parseInt(formData.get("year") as string, 10) || new Date().getFullYear();
  const weekNumber = parseInt(formData.get("weekNumber") as string, 10) || 1;
  const statusStr = formData.get("status") as string;
  const status = statusStr === "SUBMITTED" ? ReportStatus.SUBMITTED : ReportStatus.DRAFT;

  const startDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);

  const now = new Date();

  await prisma.weeklyReport.upsert({
    where: {
      userId_year_weekNumber: {
        userId: currentUser.id,
        year,
        weekNumber,
      },
    },
    update: {
      title,
      content,
      workHours,
      status,
      submittedAt: status === ReportStatus.SUBMITTED ? now : null,
    },
    create: {
      userId: currentUser.id,
      title,
      content,
      workHours,
      year,
      weekNumber,
      startDate,
      endDate,
      status,
      submittedAt: status === ReportStatus.SUBMITTED ? now : null,
    },
  });

  revalidatePath("/");
  revalidatePath("/analytics/work-hours");
  return { ok: true };
}

// --- マネージャー向け: 配下メンバーの稼働時間集計（積み上げグラフ用） ---

export async function getManagerWorkHoursAnalytics(selectedDeptId?: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const isManagerOrAdmin =
    currentUser.role === Role.MANAGER || currentUser.role === Role.ADMIN;
  if (!isManagerOrAdmin) {
    throw new Error("マネージャーまたは管理者権限が必要です。");
  }

  // 対象部門の特定（配下部門を再帰的に取得）
  let targetDeptIds: string[] = [];
  if (currentUser.role === Role.ADMIN) {
    if (selectedDeptId && selectedDeptId !== "all") {
      targetDeptIds = await getDescendantDepartmentIds(selectedDeptId);
    } else {
      const all = await prisma.department.findMany({ select: { id: true } });
      targetDeptIds = all.map((d) => d.id);
    }
  } else {
    // MANAGERの場合: 自部門とその子部門が管理対象
    const baseDeptId = currentUser.departmentId;
    if (!baseDeptId) {
      targetDeptIds = [];
    } else if (selectedDeptId && selectedDeptId !== "all") {
      targetDeptIds = await getDescendantDepartmentIds(selectedDeptId);
    } else {
      targetDeptIds = await getDescendantDepartmentIds(baseDeptId);
    }
  }

  // 配下メンバーを取得
  const members = await prisma.user.findMany({
    where: {
      departmentId: { in: targetDeptIds },
    },
    include: {
      department: true,
    },
    orderBy: [{ department: { order: "asc" } }, { role: "desc" }, { name: "asc" }],
  });

  const memberIds = members.map((m) => m.id);

  // 対象メンバーの週報を取得
  const reports = await prisma.weeklyReport.findMany({
    where: {
      userId: { in: memberIds },
    },
    include: {
      user: {
        include: { department: true },
      },
    },
    orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
  });

  // ユニークな週（年-週番号）の抽出
  const weekSet = new Set<string>();
  reports.forEach((r) => weekSet.add(`${r.year}-${r.weekNumber}`));

  // データが少ない場合でも最新の週を含める
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const pastDaysOfYear = (now.getTime() - startOfYear.getTime()) / 86400000;
  const currentWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  weekSet.add(`${currentYear}-${currentWeekNumber}`);

  const sortedWeeks = Array.from(weekSet).sort((a, b) => {
    const [yA, wA] = a.split("-").map(Number);
    const [yB, wB] = b.split("-").map(Number);
    return yA === yB ? wA - wB : yA - yB;
  });

  // 各週ごとの積み上げ集計
  const weeklyData = sortedWeeks.map((key) => {
    const [year, weekNumber] = key.split("-").map(Number);
    const weekReports = reports.filter(
      (r) => r.year === year && r.weekNumber === weekNumber
    );

    let totalHours = 0;
    const memberHoursMap: Record<string, { hours: number; title: string; status: ReportStatus }> = {};

    weekReports.forEach((r) => {
      totalHours += r.workHours;
      memberHoursMap[r.userId] = {
        hours: r.workHours,
        title: r.title,
        status: r.status,
      };
    });

    const breakdown = members.map((m) => {
      const reportInfo = memberHoursMap[m.id];
      return {
        userId: m.id,
        userName: m.name,
        departmentName: m.department?.name || "未所属",
        hours: reportInfo ? reportInfo.hours : 0,
        reportTitle: reportInfo ? reportInfo.title : null,
        status: reportInfo ? reportInfo.status : null,
        hasSubmitted: !!reportInfo,
      };
    });

    const submittedCount = breakdown.filter((b) => b.hasSubmitted).length;

    return {
      year,
      weekNumber,
      weekLabel: `${year}年 第${weekNumber}週`,
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours:
        submittedCount > 0
          ? Math.round((totalHours / submittedCount) * 10) / 10
          : 0,
      breakdown,
    };
  });

  // 選択可能な管理対象部門一覧
  const accessibleDepartments = await prisma.department.findMany({
    where: currentUser.role === Role.ADMIN ? {} : { id: { in: targetDeptIds } },
    orderBy: { order: "asc" },
  });

  return {
    currentUser,
    members,
    weeklyData,
    departments: accessibleDepartments,
  };
}

// ==========================================
// 管理者専用: 部門マスタ CRUD アクション
// ==========================================

async function ensureAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== Role.ADMIN) {
    throw new Error("管理者権限が必要です。");
  }
  return user;
}

export async function createDepartmentAction(formData: FormData) {
  await ensureAdmin();
  const name = (formData.get("name") as string)?.trim();
  const parentId = (formData.get("parentId") as string)?.trim() || null;
  const order = parseInt(formData.get("order") as string, 10) || 0;

  if (!name) {
    return { error: "部門名を入力してください。" };
  }

  await prisma.department.create({
    data: {
      name,
      parentId: parentId === "none" ? null : parentId,
      order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function updateDepartmentAction(id: string, formData: FormData) {
  await ensureAdmin();
  const name = (formData.get("name") as string)?.trim();
  const parentId = (formData.get("parentId") as string)?.trim() || null;
  const order = parseInt(formData.get("order") as string, 10) || 0;

  if (!name) {
    return { error: "部門名を入力してください。" };
  }

  if (parentId === id) {
    return { error: "自分自身を親部門に設定することはできません。" };
  }

  await prisma.department.update({
    where: { id },
    data: {
      name,
      parentId: parentId === "none" ? null : parentId,
      order,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function deleteDepartmentAction(id: string) {
  await ensureAdmin();

  // 子部門がいるかチェック
  const childrenCount = await prisma.department.count({
    where: { parentId: id },
  });
  if (childrenCount > 0) {
    return { error: "子部門が存在するため削除できません。先に子部門を削除または移動してください。" };
  }

  // 所属ユーザーのdepartmentIdをnullにクリアした上で削除
  await prisma.user.updateMany({
    where: { departmentId: id },
    data: { departmentId: null },
  });

  await prisma.department.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/departments");
  return { ok: true };
}

// ==========================================
// 管理者専用: ユーザーマスタ CRUD アクション
// ==========================================

export async function createUserAction(formData: FormData) {
  await ensureAdmin();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const departmentId = (formData.get("departmentId") as string)?.trim() || null;
  const role = (formData.get("role") as Role) || Role.MEMBER;

  if (!name || !email) {
    return { error: "氏名とメールアドレスは必須です。" };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    return { error: "そのメールアドレスは既に使用されています。" };
  }

  const passwordHash = await hashPassword(password || "password123");

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      departmentId: departmentId === "none" ? null : departmentId,
      role,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUserAction(id: string, formData: FormData) {
  await ensureAdmin();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const departmentId = (formData.get("departmentId") as string)?.trim() || null;
  const role = (formData.get("role") as Role) || Role.MEMBER;

  if (!name || !email) {
    return { error: "氏名とメールアドレスは必須です。" };
  }

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id } },
  });
  if (existing) {
    return { error: "そのメールアドレスは既に使用されています。" };
  }

  const data: any = {
    name,
    email,
    departmentId: departmentId === "none" ? null : departmentId,
    role,
  };

  if (password && password.trim().length > 0) {
    data.passwordHash = await hashPassword(password);
  }

  await prisma.user.update({
    where: { id },
    data,
  });

  revalidatePath("/");
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUserAction(id: string) {
  const admin = await ensureAdmin();
  if (admin.id === id) {
    return { error: "ログイン中の管理者アカウント自身を削除することはできません。" };
  }

  await prisma.user.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/admin/users");
  return { ok: true };
}
