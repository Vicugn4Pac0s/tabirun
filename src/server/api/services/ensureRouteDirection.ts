import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { db as Database } from "~/server/db";
import { routes } from "~/server/db/schema";
import type { RouteCreateInput } from "~/shared/schemas";
import {
  computeRoute,
  type GoogleRouteDirection,
} from "~/server/features/googlemap/computeRoute";
import { checkQuota, incrementQuota } from "~/server/quota/service";
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
  const ownerCondition = and(
    eq(routes.id, route.id),
    eq(routes.createdById, userId),
  );
  const points = route.points;
  const reusable = getReusableRouteDirection(route, points, new Date());
  if (reusable) return { direction: reusable, directionErrorCode: null };

  const quotaCheckedAt = new Date();
  let isQuotaExceeded = false;
  try {
    await checkQuota(tx, userId, "direction");
  } catch (error) {
    if (!(error instanceof TRPCError) || error.code !== "TOO_MANY_REQUESTS") {
      throw error;
    }
    isQuotaExceeded = true;
  }

  const pointsHash = getRoutePointsHash(points);
  let result: SavedRouteDirection;
  if (isQuotaExceeded) {
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

  const updated = await tx
    .update(routes)
    .set({
      encodedPolyline: result.encodedPolyline,
      distanceMeters: result.distanceMeters,
      duration: result.duration,
      directionSource: result.directionSource,
      directionCalculatedAt: result.directionCalculatedAt,
      directionPointsHash: result.directionPointsHash,
      // 閲覧時の再取得で、一覧の「更新日」を書き換えない。
      updatedAt: sql`${routes.updatedAt}`,
    })
    .where(ownerCondition);
  if (updated.count === 0) throw new TRPCError({ code: "NOT_FOUND" });

  return { direction: result, directionErrorCode: null };
}
