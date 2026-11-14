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
  getReusableRouteDirection,
  getRoutePointsHash,
  type SavedRouteDirection,
} from "./routeDirectionCache";

type RouteDirectionDb = Pick<typeof Database, "query" | "insert" | "update">;
type RouteForDirection = Omit<typeof routes.$inferSelect, "points"> & {
  points: RouteCreateInput["points"];
};

// 呼出側のトランザクションで取得・ロック（新規作成はINSERT）した行を受け取る。
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
    result = {
      directionSource: "straight_line",
      encodedPolyline: null,
      distanceMeters: null,
      duration: null,
      directionCalculatedAt: quotaCheckedAt,
      directionPointsHash: pointsHash,
      path: points,
    };
  } else {
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
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    // Googleの呼出結果を受け取った時点で数え、保存値の検証失敗も利用回数に含める。
    // DB障害は経路エラーに変換せず、呼出側のトランザクションへ伝播させる。
    await incrementQuota(tx, userId, "direction");
    try {
      const calculatedAt = new Date();
      const validated = getReusableRouteDirection(
        {
          directionSource: "routes_api",
          encodedPolyline: direction.encodedPolyline,
          distanceMeters: direction.distanceMeters,
          duration: direction.duration,
          directionCalculatedAt: calculatedAt,
          directionPointsHash: pointsHash,
        },
        points,
        calculatedAt,
      );
      if (!validated) {
        return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
      }
      result = validated;
    } catch {
      // 保存値の検証失敗は汎用エラーで返し、DB操作の失敗はこの外で伝播させる。
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
  }

  const updated = await saveOwnedRouteDirection(tx, userId, route.id, result);
  if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });

  return { direction: result, directionErrorCode: null };
}
