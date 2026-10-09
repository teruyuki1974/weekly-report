import { PrismaClient, Role, ReportStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with departments, users, and reports with work hours...");

  // 1. 部門階層の作成
  const hq = await prisma.department.upsert({
    where: { id: "dept_hq" },
    update: { name: "全社・管理本部", order: 1 },
    create: { id: "dept_hq", name: "全社・管理本部", order: 1 },
  });

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

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 2. ユーザー作成
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

  const daiki = await prisma.user.upsert({
    where: { email: "daiki@example.com" },
    update: {
      name: "渡辺 大樹",
      role: Role.MEMBER,
      departmentId: backendDept.id,
      passwordHash: defaultPasswordHash,
    },
    create: {
      email: "daiki@example.com",
      name: "渡辺 大樹",
      role: Role.MEMBER,
      departmentId: backendDept.id,
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

  // 3. 週報および稼働時間データ（第38週、第39週、第40週）
  const currentYear = new Date().getFullYear();

  const reportsData = [
    // 山田 太郎（開発本部 > フロントエンド開発部）
    {
      user: alice,
      week: 38,
      hours: 40.0,
      title: "週報: コンポーネント設計とプロトタイプ作成",
      content: "## 今週の業務内容\n- Next.js UI設計\n- Tailwind CSSでのスタイル構築",
    },
    {
      user: alice,
      week: 39,
      hours: 44.5,
      title: "週報: マークダウンエディタ機能の実装",
      content: "## 今週の業務内容\n- react-markdownとプレビュー機能の接続\n- 入力バリデーション対応",
    },
    {
      user: alice,
      week: 40,
      hours: 42.0,
      title: "週報: フロントエンド設計とマークダウン対応",
      content: "## 今週の業務内容\n- WSL2環境構築およびDocker+PostgreSQLのセットアップ\n- 階層化部門ツリービューのプロトタイプ作成",
    },

    // 渡辺 大樹（開発本部 > バックエンド開発部）
    {
      user: daiki,
      week: 38,
      hours: 38.5,
      title: "週報: DBスキーマ定義とPrisma設定",
      content: "## 今週の業務内容\n- PostgreSQLのDocker Compose環境作成\n- Prismaスキーマ定義とマイグレーション検証",
    },
    {
      user: daiki,
      week: 39,
      hours: 48.0,
      title: "週報: API認証とセッション管理の実装",
      content: "## 今週の業務内容\n- JWTクッキーセッション機能の実装\n- パスワードハッシュ化ロジックの共通化",
    },
    {
      user: daiki,
      week: 40,
      hours: 45.0,
      title: "週報: 集計クエリの最適化と階層部門対応",
      content: "## 今週の業務内容\n- 部門階層ツリーの再帰取得処理の実装\n- 稼働時間集計APIのレスポンス検証",
    },

    // 佐藤 花子（デザイン本部 > UI/UXデザイン部）
    {
      user: bob,
      week: 38,
      hours: 37.0,
      title: "週報: 週報システムのUIワイヤーフレーム策定",
      content: "## 今週の業務内容\n- 画面遷移図およびレイアウトモック作成",
    },
    {
      user: bob,
      week: 39,
      hours: 40.0,
      title: "週報: デザインシステムとカラーパレット作成",
      content: "## 今週の業務内容\n- Tailwind CSSのテーマカラー定義\n- ダークモード表示確認",
    },
    {
      user: bob,
      week: 40,
      hours: 41.5,
      title: "週報: 階層組織デザインとUIコンポーネント設計",
      content: "## 今週の業務内容\n- 部門ツリービューおよび管理画面のレイアウトワイヤーフレーム策定",
    },

    // 鈴木 一郎（営業本部 > 首都圏営業部）
    {
      user: charlie,
      week: 39,
      hours: 43.0,
      title: "週報: 社内ヒアリングと要件整理",
      content: "## 今週の業務内容\n- 週報運用の課題について各チームへヒアリング実施",
    },
    {
      user: charlie,
      week: 40,
      hours: 39.0,
      title: "週報: パイロット運用の準備",
      content: "## 今週の業務内容\n- 首都圏営業部メンバーへの週報システム先行トライアル案内",
    },
  ];

  for (const item of reportsData) {
    const startDate = new Date(currentYear, 0, 1 + (item.week - 1) * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 4);

    await prisma.weeklyReport.upsert({
      where: {
        userId_year_weekNumber: {
          userId: item.user.id,
          year: currentYear,
          weekNumber: item.week,
        },
      },
      update: {
        title: item.title,
        content: item.content,
        workHours: item.hours,
        status: ReportStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      create: {
        userId: item.user.id,
        year: currentYear,
        weekNumber: item.week,
        startDate,
        endDate,
        title: item.title,
        content: item.content,
        workHours: item.hours,
        status: ReportStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
  }

  // 初期チェック（★）データの投入
  const initialChecks = [
    // kenji (開発MG) -> alice (山田), daiki (渡辺)
    { userId: kenji.id, targetId: alice.id },
    { userId: kenji.id, targetId: daiki.id },
    // admin (管理者) -> alice, bob, daiki
    { userId: admin.id, targetId: alice.id },
    { userId: admin.id, targetId: bob.id },
    { userId: admin.id, targetId: daiki.id },
    // alice -> daiki, bob
    { userId: alice.id, targetId: daiki.id },
    { userId: alice.id, targetId: bob.id },
  ];

  for (const check of initialChecks) {
    await prisma.userCheck.upsert({
      where: {
        userId_targetId: {
          userId: check.userId,
          targetId: check.targetId,
        },
      },
      update: {},
      create: {
        userId: check.userId,
        targetId: check.targetId,
      },
    });
  }

  // 初期コメント・いいねデータの投入
  const aliceReport = await prisma.weeklyReport.findFirst({
    where: { userId: alice.id, weekNumber: 40, year: currentYear },
  });

  if (aliceReport) {
    const existingComments = await prisma.comment.count({
      where: { reportId: aliceReport.id },
    });
    if (existingComments === 0) {
      // 高橋MGのコメント
      await prisma.comment.create({
        data: {
          reportId: aliceReport.id,
          userId: kenji.id,
          content: "マークダウン対応お疲れ様です！UIのプレビューも非常に見やすくなっていますね。次週のリリースもこの調子で進めましょう！",
        },
      });

      // 渡辺のコメント
      await prisma.comment.create({
        data: {
          reportId: aliceReport.id,
          userId: daiki.id,
          content: "Dockerのローカル開発環境の手順書、とても分かりやすくて助かりました！🙏",
        },
      });
    }

    // いいね
    await prisma.reportLike.createMany({
      data: [
        { reportId: aliceReport.id, userId: kenji.id },
        { reportId: aliceReport.id, userId: daiki.id },
        { reportId: aliceReport.id, userId: bob.id },
      ],
      skipDuplicates: true,
    });
  }

  const daikiReport = await prisma.weeklyReport.findFirst({
    where: { userId: daiki.id, weekNumber: 40, year: currentYear },
  });

  if (daikiReport) {
    const existingComments = await prisma.comment.count({
      where: { reportId: daikiReport.id },
    });
    if (existingComments === 0) {
      await prisma.comment.create({
        data: {
          reportId: daikiReport.id,
          userId: alice.id,
          content: "部門階層クエリの最適化ありがとうございます！レスポンスがかなり軽くなりました。",
        },
      });
    }

    await prisma.reportLike.createMany({
      data: [
        { reportId: daikiReport.id, userId: alice.id },
        { reportId: daikiReport.id, userId: kenji.id },
      ],
      skipDuplicates: true,
    });
  }

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
