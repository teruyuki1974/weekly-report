"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ReportStatus } from "@prisma/client";

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

export async function createReport(formData: FormData) {
  const userId = formData.get("userId") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const year = parseInt(formData.get("year") as string, 10) || new Date().getFullYear();
  const weekNumber = parseInt(formData.get("weekNumber") as string, 10) || 1;
  const statusStr = formData.get("status") as string;
  const status = statusStr === "SUBMITTED" ? ReportStatus.SUBMITTED : ReportStatus.DRAFT;

  const now = new Date();
  const startDate = new Date(year, 0, 1 + (weekNumber - 1) * 7);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);

  await prisma.weeklyReport.upsert({
    where: {
      userId_year_weekNumber: {
        userId,
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
      userId,
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
