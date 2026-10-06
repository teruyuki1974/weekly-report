import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with departments, users, and reports...");

  // 1. 部門階層の作成
  // ルート部門
  const hq = await prisma.department.upsert({
    where: { id: "dept_hq" },
    update: { name: "全社・管理本部", order: 1 },
    create: { id: "dept_hq", name: "全社・管理本部", order: 1 },
  });

  // 第1階層
  const devDiv = await prisma.department.upsert({
    where: { id: "dept_dev" },
    update: { name: "開発本部", parentId: hq.id, order: 1 },
    create: { id: "dept_dev", name: "開発本部", parentId: hq.id, order: 1 },
  });

  const designDiv = await prisma.department.upsert({
    where: { id: "dept_design" },
    update: { name: "デザイン本部", parentId: hq.id, order: 2 },
    create: { id: "dept_design", name: "デザイン本部", parentId: hq.id, order: 2 },
  });

  const salesDiv = await prisma.department.upsert({
    where: { id: "dept_sales" },
    update: { name: "営業本部", parentId: hq.id, order: 3 },
    create: { id: "dept_sales", name: "営業本部", parentId: hq.id, order: 3 },
  });

  // 第2階層
  const frontendDept = await prisma.department.upsert({
    where: { id: "dept_frontend" },
    update: { name: "フロントエンド開発部", parentId: devDiv.id, order: 1 },
    create: { id: "dept_frontend", name: "フロントエンド開発部", parentId: devDiv.id, order: 1 },
  });

  const backendDept = await prisma.department.upsert({
    where: { id: "dept_backend" },
    update: { name: "バックエンド開発部", parentId: devDiv.id, order: 2 },
    create: { id: "dept_backend", name: "バックエンド開発部", parentId: devDiv.id, order: 2 },
  });

  const uiuxDept = await prisma.department.upsert({
    where: { id: "dept_uiux" },
    update: { name: "UI/UXデザイン部", parentId: designDiv.id, order: 1 },
    create: { id: "dept_uiux", name: "UI/UXデザイン部", parentId: designDiv.id, order: 1 },
  });

  const tokyoSalesDept = await prisma.department.upsert({
    where: { id: "dept_tokyo_sales" },
    update: { name: "首都圏営業部", parentId: salesDiv.id, order: 1 },
    create: { id: "dept_tokyo_sales", name: "首都圏営業部", parentId: salesDiv.id, order: 1 },
  });

  // 2. パスワードハッシュの生成（共通初期PW: password123）
  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 3. 管理者ユーザーの作成
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      name: "システム管理者",
      role: Role.ADMIN,
      departmentId: hq.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "admin@example.com",
      name: "システム管理者",
      role: Role.ADMIN,
      departmentId: hq.id,
      passwordHash: defaultPasswordHash,
    },
  });

  // 4. 一般/マネージャーユーザーの作成
  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {
      name: "山田 太郎",
      role: Role.MEMBER,
      departmentId: frontendDept.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "alice@example.com",
      name: "山田 太郎",
      role: Role.MEMBER,
      departmentId: frontendDept.id,
      passwordHash: defaultPasswordHash,
    },
  });

  const kenji = await prisma.user.upsert({
    where: { email: "kenji@example.com" },
    update: {
      name: "高橋 健二",
      role: Role.MANAGER,
      departmentId: devDiv.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "kenji@example.com",
      name: "高橋 健二",
      role: Role.MANAGER,
      departmentId: devDiv.id,
      passwordHash: defaultPasswordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {
      name: "佐藤 花子",
      role: Role.MANAGER,
      departmentId: uiuxDept.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "bob@example.com",
      name: "佐藤 花子",
      role: Role.MANAGER,
      departmentId: uiuxDept.id,
      passwordHash: defaultPasswordHash,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@example.com" },
    update: {
      name: "鈴木 一郎",
      role: Role.MEMBER,
      departmentId: tokyoSalesDept.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "charlie@example.com",
      name: "鈴木 一郎",
      role: Role.MEMBER,
      departmentId: tokyoSalesDept.id,
      passwordHash: defaultPasswordHash,
    },
  });

  // 5. 週報データの作成
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
      title: "週報: フロントエンド設計とマークダウン対応",
      content: `## 今週の業務内容
- WSL2環境構築およびDocker+PostgreSQLのセットアップ
- Next.js + TypeScriptプロジェクトの立ち上げ
- 階層化部門ツリービューのプロトタイプ作成

## 成果
- 開発用ローカルDBがDockerで安定動作することを確認
- Next.jsとPrismaの接続確認完了

## 課題・相談
- 300人規模のツリービュー表示パフォーマンスの最適化

## 来週の予定
- 週報投稿・一覧ページのUIブラッシュアップ
- 管理画面のCRUD機能検証
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
      title: "週報: 階層組織デザインとUIコンポーネント設計",
      content: `## 今週の業務内容
- 週報システム全体のUIデザイン設計（Tailwind CSSベース）
- 部門ツリービューおよび管理画面のレイアウトワイヤーフレーム策定
- マークダウン表示時のスタイル調整

## 成果
- 画面構成案を開発チームへ共有し合意形成完了

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
