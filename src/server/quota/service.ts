import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { type db as DbType } from "~/server/db";
import { quotaUsages } from "~/server/db/schema";
import { QUOTA_CONFIG, type QuotaFeature } from "./config";

type Db = Pick<typeof DbType, "query" | "insert">;

const getToday = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * 指定機能の1日あたりクォータに余裕があるか確認する。
 * 利用枠の予約は行わないため、同時リクエストの上限超過までは防がない。
 */
export async function hasQuotaRemaining(
  db: Db,
  userId: string,
  feature: QuotaFeature,
): Promise<boolean> {
  const today = getToday();
  const { dailyLimit } = QUOTA_CONFIG[feature];

  const existing = await db.query.quotaUsages.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.userId, userId), eq(t.feature, feature), eq(t.date, today)),
  });

  return !existing || existing.count < dailyLimit;
}

export async function checkQuota(
  db: Db,
  userId: string,
  feature: QuotaFeature,
): Promise<void> {
  if (!(await hasQuotaRemaining(db, userId, feature))) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "QUOTA_EXCEEDED",
    });
  }
}

/**
 * 指定機能の当日クォータ使用量を1インクリメントする。
 * 各呼び出し側の計上条件に従い、API送信後に呼び出す。
 */
export async function incrementQuota(
  db: Db,
  userId: string,
  feature: QuotaFeature,
): Promise<void> {
  await db
    .insert(quotaUsages)
    .values({ userId, feature, date: getToday(), count: 1 })
    .onConflictDoUpdate({
      target: [quotaUsages.userId, quotaUsages.feature, quotaUsages.date],
      set: { count: sql`${quotaUsages.count} + 1` },
    });
}
