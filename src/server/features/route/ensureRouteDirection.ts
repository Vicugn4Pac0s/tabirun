import "server-only";

import { TRPCError } from "@trpc/server";
import type { db as Database } from "~/server/db";
import type { routes } from "~/server/db/schema";
import { saveOwnedRouteDirection } from "./data";
import type { RouteCreateInput } from "~/shared/schemas";
import {
  computeRoute,
  type GoogleRouteDirection,
} from "~/server/features/googlemap/computeRoute";
import { hasQuotaRemaining, incrementQuota } from "~/server/quota/service";
import {
  createStraightLineDirection,
  toSavedGoogleRouteDirection,
  getReusableRouteDirection,
  getRoutePointsHash,
  type SavedRouteDirection,
} from "./routeDirectionCache";

type RouteDirectionDb = Pick<typeof Database, "query" | "insert" | "update">;
type RouteForDirection = Omit<typeof routes.$inferSelect, "points"> & {
  points: RouteCreateInput["points"];
};

/**
 * 経路を再利用または計算・保存する。残数不足は直線、通信・保存値検証の失敗はエラーコードで返す。
 * 呼出側で取得・ロック（新規作成はINSERT）した行と同じトランザクションを使う。
 * 所有者不一致・保存0件はNOT_FOUND。入力地点が不正な場合も例外になる。
 */
export async function ensureRouteDirection(
  tx: RouteDirectionDb,
  userId: string,
  route: RouteForDirection,
): Promise<
  | { direction: SavedRouteDirection; directionErrorCode: null }
  | { direction: null; directionErrorCode: "INTERNAL_SERVER_ERROR" }
> {
  if (route.createdById !== userId) throw new TRPCError({ code: "NOT_FOUND" });
  const points = route.points;
  const reusable = getReusableRouteDirection(route, points, new Date());
  if (reusable) return { direction: reusable, directionErrorCode: null };

  const quotaCheckedAt = new Date();
  const quotaRemaining = await hasQuotaRemaining(tx, userId, "direction");

  const pointsHash = getRoutePointsHash(points);
  let result: SavedRouteDirection;
  if (!quotaRemaining) {
    result = createStraightLineDirection(points, pointsHash, quotaCheckedAt);
  } else {
    const direction = await computeAndCountRoute(tx, userId, points);
    if (!direction) {
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    const validated = toSavedGoogleRouteDirection(
      direction,
      points,
      pointsHash,
      new Date(),
    );
    if (!validated) {
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    result = validated;
  }

  const updated = await saveOwnedRouteDirection(tx, userId, route.id, result);
  if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });

  return { direction: result, directionErrorCode: null };
}

/** Googleの計算結果を返し、送信開始後の試行を計上する。通信失敗はnull、DB障害は伝播する。 */
async function computeAndCountRoute(
  tx: RouteDirectionDb,
  userId: string,
  points: RouteCreateInput["points"],
): Promise<GoogleRouteDirection | null> {
  let requestStarted = false;
  let direction: GoogleRouteDirection;
  try {
    direction = await computeRoute(
      { routePoints: points, travelMode: "WALK" },
      () => {
        requestStarted = true;
      },
    );
  } catch {
    // 到達不明の通信例外も送信試行として数え、失敗の繰り返しで上限を回避させない。
    if (requestStarted) await incrementQuota(tx, userId, "direction");
    return null;
  }
  // 結果を受け取った時点で数え、後続の検証失敗も利用回数に含める。
  // DB障害は経路エラーに変換せず、呼出側のトランザクションへ伝播させる。
  await incrementQuota(tx, userId, "direction");
  return direction;
}
