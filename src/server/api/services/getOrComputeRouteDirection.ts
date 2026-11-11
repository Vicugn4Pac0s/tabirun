import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import type { db as Database } from "~/server/db";
import { routes } from "~/server/db/schema";
import { routePointsSchema } from "~/shared/schemas";
import { computeRoute } from "~/server/features/googlemap/computeRoute";
import { checkQuota, incrementQuota } from "~/server/quota/service";
import {
  getReusableRouteDirection,
  getRoutePointsHash,
  type SavedRouteDirection,
} from "./routeDirectionCache";

type RouteDirectionDb = Pick<typeof Database, "query" | "insert" | "update">;
type SavedRoute = typeof routes.$inferSelect;

export class RouteDirectionCalculationError extends Error {}

// 呼出側のトランザクションで取得・ロック（新規作成はINSERT）した行を受け取る。
export async function getRouteDirectionResult(
  tx: RouteDirectionDb,
  userId: string,
  route: SavedRoute,
): Promise<
  | { direction: SavedRouteDirection; directionErrorCode: null }
  | { direction: null; directionErrorCode: "INTERNAL_SERVER_ERROR" }
> {
  try {
    const direction = await getOrComputeRouteDirection(tx, userId, route);
    return { direction, directionErrorCode: null };
  } catch (error) {
    // 経路の取得失敗と、ルート自体が存在しないNOT_FOUNDを区別する。
    if (!(error instanceof RouteDirectionCalculationError)) throw error;
    return {
      direction: null,
      directionErrorCode: "INTERNAL_SERVER_ERROR",
    };
  }
}

export async function getOrComputeRouteDirection(
  tx: RouteDirectionDb,
  userId: string,
  route: SavedRoute,
): Promise<SavedRouteDirection> {
  if (route.createdById !== userId) throw new TRPCError({ code: "NOT_FOUND" });
  const ownerCondition = and(
    eq(routes.id, route.id),
    eq(routes.createdById, userId),
  );
  const points = routePointsSchema.parse(JSON.parse(route.points));
  const reusable = getReusableRouteDirection(route, points, new Date());
  if (reusable) return reusable;

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
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
      result = validated;
    } catch (cause) {
      throw new RouteDirectionCalculationError("ROUTE_CALCULATION_FAILED", {
        cause,
      });
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

  return result;
}
