import { PrismaClient, Role, ReportStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // サンプルユーザーの作成
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      email: "alice@example.com",
      name: "山田 太郎",
      department: "開発部",
      role: Role.MEMBER,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      email: "bob@example.com",
      name: "佐藤 花子",
      department: "デザイン部",
      role: Role.MANAGER,
    },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  // 簡易的に第1週と第2週などの週報を作成
  const startDate = new Date(currentYear, now.getMonth(), now.getDate() - now.getDay() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4);

  await prisma.weeklyReport.upsert({
    where: {
      userId_year_weekNumber: {
        userId: alice.id,
        year: currentYear,
        weekNumber: 40,
      },
    },
    update: {},
    create: {
      userId: alice.id,
      year: currentYear,
      weekNumber: 40,
      startDate,
      endDate,
      title: "週報: システム基盤構築とNext.js検証",
      content: `## 今週の業務内容
- WSL2環境構築およびDocker+PostgreSQLのセットアップ
- Next.js + TypeScriptプロジェクトの立ち上げ
- データベーススキーマ設計（週報・ユーザー・コメント）

## 成果
- 開発用ローカルDBがDockerで安定動作することを確認
- Next.jsとPrismaの接続確認完了

## 課題・相談
- マークダウンエディタのUIライブラリ選定

## 来週の予定
- 週報投稿・一覧ページのUI実装
- 簡易認証・閲覧制限の組み込み
`,
      status: ReportStatus.SUBMITTED,
      submittedAt: new Date(),
    },
  });

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
