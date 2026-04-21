import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { type db as DbType } from "~/server/db";
import { quotaUsages } from "~/server/db/schema";
import { QUOTA_CONFIG, type QuotaFeature } from "./config";

type Db = typeof DbType;

const getToday = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * 指定機能の1日あたりクォータ上限を超えていれば TOO_MANY_REQUESTS をスローする。
 */
export async function checkQuota(
  db: Db,
  userId: string,
  feature: QuotaFeature,
): Promise<void> {
  const today = getToday();
  const { dailyLimit } = QUOTA_CONFIG[feature];

  const existing = await db.query.quotaUsages.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.userId, userId), eq(t.feature, feature), eq(t.date, today)),
  });

  if (existing && existing.count >= dailyLimit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "QUOTA_EXCEEDED",
    });
  }
}

/**
 * 指定機能の当日クォータ使用量を1インクリメントする。
 * API呼び出し成功後に呼び出すこと。
 */
export async function incrementQuota(
  db: Db,
  userId: string,
  feature: QuotaFeature,
): Promise<void> {
  const today = getToday();

  const existing = await db.query.quotaUsages.findFirst({
    where: (t, { and, eq }) =>
      and(eq(t.userId, userId), eq(t.feature, feature), eq(t.date, today)),
  });

  if (existing) {
    await db
      .update(quotaUsages)
      .set({ count: sql`${quotaUsages.count} + 1` })
      .where(
        and(
          eq(quotaUsages.userId, userId),
          eq(quotaUsages.feature, feature),
          eq(quotaUsages.date, today),
        ),
      );
  } else {
    await db.insert(quotaUsages).values({
      userId,
      feature,
      date: today,
      count: 1,
    });
  }
}
