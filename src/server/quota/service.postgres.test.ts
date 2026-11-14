// @vitest-environment node
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  inject,
  it,
  vi,
} from "vitest";
import * as schema from "~/server/db/schema";
import { checkQuota, hasQuotaRemaining, incrementQuota } from "./service";

declare module "vitest" {
  export interface ProvidedContext {
    quotaPostgresUrl?: string;
  }
}

const databaseUrl = inject("quotaPostgresUrl");
const fixedDate = new Date("2026-11-14T12:00:00Z");
const today = "2026-11-14";

// 通常の単体テストではskipし、専用configで実DBの競合を検証する。
describe.skipIf(!databaseUrl)("quota PostgreSQL", () => {
  const fixtures: {
    client: postgres.Sql;
    admin: postgres.Sql;
    name: string;
  }[] = [];
  const migrations = readMigrationFiles({
    migrationsFolder: fileURLToPath(
      new URL("../../../drizzle", import.meta.url),
    ),
  });
  const initialMigration = migrations[0];
  const quotaMigration = migrations[4];
  if (!initialMigration || !quotaMigration)
    throw new Error("quota migrationがありません");
  const quotaTableSql = initialMigration.sql.find((statement) =>
    statement.includes('CREATE TABLE "tabirun_quota_usage"'),
  );
  const quotaIndexSql = initialMigration.sql.find((statement) =>
    statement.includes('CREATE INDEX "quota_user_feature_date_idx"'),
  );
  if (!quotaTableSql || !quotaIndexSql)
    throw new Error("初期quota定義がありません");

  async function createFixture() {
    if (!databaseUrl) throw new Error("専用PostgreSQL configが必要です");
    if (!quotaTableSql || !quotaIndexSql)
      throw new Error("初期quota定義がありません");
    const name = `quota_test_${randomUUID().replaceAll("-", "")}`;
    const admin = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
    const client = postgres(databaseUrl, {
      max: 8,
      connection: { search_path: name },
      onnotice: () => undefined,
    });
    fixtures.push({ client, admin, name });
    await admin`CREATE SCHEMA ${admin(name)}`;
    const db = drizzle(client, { schema });
    // 旧migrationの実際のテーブル・index定義を独立schemaに作る。
    // このテストではquotaの整合性を扱い、userへの外部キーは対象外。
    await db.execute(sql.raw(quotaTableSql));
    await db.execute(sql.raw(quotaIndexSql));
    return { db, client };
  }

  async function applyQuotaMigration(
    db: ReturnType<typeof drizzle<typeof schema>>,
  ) {
    if (!quotaMigration) throw new Error("quota migrationがありません");
    // Drizzle migratorと同様、全statementを1トランザクションで実行する。
    await db.transaction(async (tx) => {
      for (const statement of quotaMigration.sql)
        await tx.execute(sql.raw(statement));
    });
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(fixedDate);
  });
  afterEach(() => vi.useRealTimers());
  afterAll(async () => {
    for (const { client, admin, name } of fixtures) {
      await client.end();
      await admin`DROP SCHEMA ${admin(name)} CASCADE`;
      await admin.end();
    }
  });

  it("重複だけを合計で集約し、ユーザー・機能・日付が異なる行を維持する", async () => {
    const { db } = await createFixture();
    const rows = await db
      .insert(schema.quotaUsages)
      .values([
        { userId: "owner", feature: "direction", date: today, count: 3 },
        { userId: "owner", feature: "direction", date: today, count: 4 },
        { userId: "owner", feature: "direction", date: today, count: 5 },
        { userId: "other", feature: "direction", date: today, count: 7 },
        { userId: "owner", feature: "other-feature", date: today, count: 8 },
        { userId: "owner", feature: "direction", date: "2026-11-13", count: 9 },
      ])
      .returning();
    const keeper = rows[0];
    if (!keeper) throw new Error("fixtureがありません");
    await applyQuotaMigration(db);
    expect(
      await db.select().from(schema.quotaUsages).orderBy(schema.quotaUsages.id),
    ).toEqual([{ ...keeper, count: 12 }, ...rows.slice(3)]);
    await expect(
      db.insert(schema.quotaUsages).values({
        userId: "owner",
        feature: "direction",
        date: today,
        count: 1,
      }),
    ).rejects.toMatchObject({ cause: { code: "23505" } });
  });

  it("集約がintegerの範囲を超えれば、削除や制約追加をせずロールバックする", async () => {
    const { db } = await createFixture();
    const rows = await db
      .insert(schema.quotaUsages)
      .values([
        {
          userId: "owner",
          feature: "direction",
          date: today,
          count: 2147483647,
        },
        { userId: "owner", feature: "direction", date: today, count: 1 },
      ])
      .returning();
    await expect(applyQuotaMigration(db)).rejects.toMatchObject({
      cause: { code: "22003" },
    });
    expect(
      await db.select().from(schema.quotaUsages).orderBy(schema.quotaUsages.id),
    ).toEqual(rows);
    // 失敗後も旧indexのままであり、重複行の追加が可能。
    await db.insert(schema.quotaUsages).values({
      userId: "owner",
      feature: "direction",
      date: today,
      count: 1,
    });
  });

  it.each([0, 10])(
    "初期回数%dから同時加算しても、1行に全40回を記録する",
    async (initialCount) => {
      const { db, client } = await createFixture();
      await applyQuotaMigration(db);
      if (initialCount > 0)
        await db.insert(schema.quotaUsages).values({
          userId: "owner",
          feature: "direction",
          date: today,
          count: initialCount,
        });
      const sessions = await Promise.all(
        Array.from(
          { length: 4 },
          () =>
            client<
              { pid: number }[]
            >`SELECT pg_backend_pid() AS pid, pg_sleep(0.02)`,
        ),
      );
      expect(
        new Set(sessions.flat().map(({ pid }) => pid)).size,
      ).toBeGreaterThan(1);
      await Promise.all(
        Array.from({ length: 40 }, () =>
          db.transaction((tx) => incrementQuota(tx, "owner", "direction")),
        ),
      );
      expect(await db.select().from(schema.quotaUsages)).toEqual([
        expect.objectContaining({
          userId: "owner",
          feature: "direction",
          date: today,
          count: initialCount + 40,
        }),
      ]);
    },
  );

  it("上限直前・上限ちょうど・超過を判定し、他のキーを加算しない", async () => {
    const { db } = await createFixture();
    await applyQuotaMigration(db);
    await db.insert(schema.quotaUsages).values([
      { userId: "owner", feature: "direction", date: today, count: 49 },
      { userId: "other", feature: "direction", date: today, count: 50 },
      { userId: "owner", feature: "other-feature", date: today, count: 50 },
      { userId: "owner", feature: "direction", date: "2026-11-13", count: 50 },
    ]);
    await expect(hasQuotaRemaining(db, "new", "direction")).resolves.toBe(true);
    await expect(hasQuotaRemaining(db, "owner", "direction")).resolves.toBe(
      true,
    );
    await incrementQuota(db, "owner", "direction");
    await expect(hasQuotaRemaining(db, "owner", "direction")).resolves.toBe(
      false,
    );
    await expect(checkQuota(db, "owner", "direction")).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    await incrementQuota(db, "owner", "direction");
    await expect(hasQuotaRemaining(db, "owner", "direction")).resolves.toBe(
      false,
    );
    expect(
      (
        await db
          .select()
          .from(schema.quotaUsages)
          .orderBy(schema.quotaUsages.id)
      ).map(({ count }) => count),
    ).toEqual([51, 50, 50, 50]);
  });
});
