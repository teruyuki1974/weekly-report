import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with users and reports...");

  // 初期パスワード "password123" のハッシュ
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // サンプルユーザーの作成
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {
      passwordHash: defaultPasswordHash,
      department: "開発部",
      name: "山田 太郎",
    },
    create: {
      email: "alice@example.com",
      name: "山田 太郎",
      department: "開発部",
      role: Role.MEMBER,
      passwordHash: defaultPasswordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {
      passwordHash: defaultPasswordHash,
      department: "デザイン部",
      name: "佐藤 花子",
    },
    create: {
      email: "bob@example.com",
      name: "佐藤 花子",
      department: "デザイン部",
      role: Role.MANAGER,
      passwordHash: defaultPasswordHash,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {
      passwordHash: defaultPasswordHash,
      department: "営業部",
      name: "鈴木 一郎",
    },
    create: {
      email: "charlie@example.com",
      name: "鈴木 一郎",
      department: "営業部",
      role: Role.MEMBER,
      passwordHash: defaultPasswordHash,
    },
  });

  const now = new Date();
  const currentYear = now.getFullYear();
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

  await prisma.weeklyReport.upsert({
    where: {
      userId_year_weekNumber: {
        userId: bob.id,
        year: currentYear,
        weekNumber: 40,
      },
    },
    update: {},
    create: {
      userId: bob.id,
      year: currentYear,
      weekNumber: 40,
      startDate,
      endDate,
      title: "週報: 週報システムのデザインガイドライン作成",
      content: `## 今週の業務内容
- 週報システム全体のUIデザイン設計（Tailwind CSSベース）
- レスポンシブ対応およびダークモード用カラーパレット策定
- マークダウン表示時のスタイル調整

## 成果
- 画面構成案を開発チームへ共有し合意形成

## 来週の予定
- 各種コンポーネント（カード、フォーム、モーダル）のUIブラッシュアップ
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
