import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { db as Database } from "~/server/db";
import { routes } from "~/server/db/schema";
import type { RouteCreateInput } from "~/shared/schemas";
import { computeRoute } from "~/server/features/googlemap/computeRoute";
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
    try {
      const direction = await computeRoute({
        routePoints: points,
        travelMode: "WALK",
      });
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
      // Google側のNOT_FOUNDをルート自体の404にせず、DB操作の失敗はこの外で伝播させる。
      return { direction: null, directionErrorCode: "INTERNAL_SERVER_ERROR" };
    }
    await incrementQuota(tx, userId, "direction");
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
