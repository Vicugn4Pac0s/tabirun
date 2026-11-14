import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { type db as DbType } from "~/server/db";
import { quotaUsages } from "~/server/db/schema";
import { QUOTA_CONFIG, type QuotaFeature } from "./config";

type Db = Pick<typeof DbType, "query" | "insert">;

const getToday = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD

/**
 * 指定機能のUTC当日の利用回数を確認し、未使用または上限未満ならtrueを返す。
 * 利用枠の予約は行わず、同時リクエストの上限超過までは防がない。
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

/**
 * 指定機能のUTC当日の残数を確認し、上限到達時はTOO_MANY_REQUESTSを投げる。
 * 利用枠の予約・加算は行わない。
 */
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
 * 指定機能のUTC当日の利用回数を1増やす。送信後の計上条件は呼出側で判断する。
 * 渡されたDB・トランザクションで加算する。トランザクションのrollbackで加算も戻る。
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
