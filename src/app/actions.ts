"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReportStatus } from "@prisma/client";
import { createSession, destroySession, getCurrentUser, verifyPassword } from "@/lib/auth";
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

// --- システムヘルス・データ取得 ---

export async function getDbHealth() {
  try {
    const userCount = await prisma.user.count();
    const reportCount = await prisma.weeklyReport.count();
    return {
      ok: true,
      userCount,
      reportCount,
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
    orderBy: { name: "asc" },
  });
}

export async function getReports(department?: string) {
  return await prisma.weeklyReport.findMany({
    where: department && department !== "all" ? { user: { department } } : {},
    include: {
      user: true,
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
