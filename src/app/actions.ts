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
    include: {
      user: {
        include: {
          department: true,
        },
      },
      comments: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }, { createdAt: "desc" }],
  });
}

// --- 週報作成（ログイン中のユーザーに紐づけ） ---

export async function createReport(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("ログインしてください。");
  }

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
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
      status,
      submittedAt: status === ReportStatus.SUBMITTED ? now : null,
    },
    create: {
      userId: currentUser.id,
      title,
      content,
      year,
      weekNumber,
      startDate,
      endDate,
      status,
      submittedAt: status === ReportStatus.SUBMITTED ? now : null,
    },
  });

  revalidatePath("/");
  return { ok: true };
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
