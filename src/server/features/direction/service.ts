import "server-only";

import type { db } from "~/server/db";
import { incrementQuota } from "~/server/quota/service";
import { computeRoute } from "~/server/features/direction/client";
import type { DirectionInput } from "~/shared/schemas";

/**
 * Googleの経路を取得し、送信開始後の試行を成功・失敗ともに1回計上する。
 * 入力は呼出側でschema検証する。計上に失敗した場合は通信結果よりDB障害を優先する。
 */
export async function getDirection(
  database: Pick<typeof db, "query" | "insert">,
  userId: string,
  input: DirectionInput,
) {
  let requestStarted = false;
  let direction: Awaited<ReturnType<typeof computeRoute>>;
  try {
    direction = await computeRoute(input, () => {
      requestStarted = true;
    });
  } catch (error) {
    // 到達不明の通信例外も数え、失敗の繰り返しで上限を回避させない。
    if (requestStarted) await incrementQuota(database, userId, "direction");
    throw error;
  }
  // DB障害を通信失敗としてcatchせず、そのまま伝播させる。
  await incrementQuota(database, userId, "direction");
  return direction;
}
