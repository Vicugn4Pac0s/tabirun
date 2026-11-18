import "server-only";

import type { db } from "~/server/db";
import { incrementQuota } from "~/server/quota/service";
import { computeRoute } from "~/server/features/direction/client";
import type { DirectionInput } from "~/shared/schemas";
import type { GoogleRouteDirection } from "./domain";

type DirectionDb = Pick<typeof db, "query" | "insert">;

/**
 * 経路を取得して利用回数を計上し、計算失敗時は元の例外を投げる。
 * 入力は呼出側でschema検証する。計上のDB障害は計算結果より優先して伝播する。
 */
export async function getDirection(
  database: DirectionDb,
  userId: string,
  input: DirectionInput,
): Promise<GoogleRouteDirection> {
  const result = await computeAndCountDirection(database, userId, input);
  if (result.status === "rejected") throw result.reason;
  return result.value;
}

/**
 * 経路を取得して利用回数を計上し、計算失敗時はnullを返す。
 * 入力は呼出側でschema検証する。計上のDB障害はnullに変換せず伝播する。
 */
export async function tryGetDirection(
  database: DirectionDb,
  userId: string,
  input: DirectionInput,
): Promise<GoogleRouteDirection | null> {
  const result = await computeAndCountDirection(database, userId, input);
  return result.status === "fulfilled" ? result.value : null;
}

async function computeAndCountDirection(
  database: DirectionDb,
  userId: string,
  input: DirectionInput,
): Promise<PromiseSettledResult<GoogleRouteDirection>> {
  let requestStarted = false;
  let direction: GoogleRouteDirection;
  try {
    direction = await computeRoute(input, () => {
      requestStarted = true;
    });
  } catch (error) {
    // 到達不明の通信例外も数え、失敗の繰り返しで上限を回避させない。
    if (requestStarted) await incrementQuota(database, userId, "direction");
    return { status: "rejected", reason: error };
  }
  // DB障害は計算結果に含めず、呼出側へ伝播させる。
  await incrementQuota(database, userId, "direction");
  return { status: "fulfilled", value: direction };
}
